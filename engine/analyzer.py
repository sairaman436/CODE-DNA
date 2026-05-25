"""
CodeDNA Python Engine — Real Code Analyzer
Uses AST parsing (Python's built-in ast module + regex-based heuristics for other languages)
to extract real metrics from GitHub repositories.

Rule 6: All code is processed in memory / temp dirs and deleted immediately after analysis.
Rule 14: Language-specific standards are applied per file.
"""

import os
import re
import ast
import math
import shutil
import tempfile
import subprocess
import concurrent.futures
import requests
from pathlib import Path
from collections import Counter, defaultdict

try:
    import tree_sitter
    import tree_sitter_javascript
    import tree_sitter_typescript
    JS_LANG = tree_sitter.Language(tree_sitter_javascript.language())
    TS_LANG = tree_sitter.Language(tree_sitter_typescript.language_typescript())
    TSX_LANG = tree_sitter.Language(tree_sitter_typescript.language_tsx())
    HAS_TREE_SITTER = True
except Exception as e:
    print(f"Tree-sitter not available: {e}")
    HAS_TREE_SITTER = False

# ──────────────────────────────────────────
# Language detection
# ──────────────────────────────────────────
LANG_EXTENSIONS = {
    # Core Languages
    '.py': 'Python', '.js': 'JavaScript', '.ts': 'TypeScript', '.tsx': 'TypeScript',
    '.jsx': 'JavaScript', '.go': 'Go', '.java': 'Java', '.rb': 'Ruby',
    '.rs': 'Rust', '.cpp': 'C++', '.c': 'C', '.cs': 'C#', '.php': 'PHP',
    '.swift': 'Swift', '.kt': 'Kotlin', '.scala': 'Scala', '.dart': 'Dart',
    '.lua': 'Lua', '.r': 'R', '.R': 'R',
    
    # Web & Style Languages
    '.html': 'HTML', '.htm': 'HTML', '.css': 'CSS', '.scss': 'SCSS', '.sass': 'Sass', 
    '.less': 'Less', '.vue': 'Vue', '.svelte': 'Svelte',
    
    # Scripts & Shells
    '.sh': 'Shell', '.bash': 'Shell', '.zsh': 'Shell', '.bat': 'Batch', '.ps1': 'PowerShell',
    
    # Systems & Functional
    '.h': 'C/C++ Header', '.hpp': 'C/C++ Header', '.m': 'Objective-C', '.mm': 'Objective-C++',
    '.pl': 'Perl', '.pm': 'Perl', '.hs': 'Haskell', '.ml': 'OCaml', '.ex': 'Elixir', '.exs': 'Elixir',
    '.erl': 'Erlang', '.clj': 'Clojure', '.cljs': 'Clojure', '.lisp': 'Lisp', '.lsp': 'Lisp',
    
    # Data & Configuration
    '.sql': 'SQL', '.yaml': 'YAML', '.yml': 'YAML', '.json': 'JSON', '.toml': 'TOML', 
    '.xml': 'XML', '.md': 'Markdown', '.markdown': 'Markdown'
}

# File patterns to skip (Rule 10: generated/boilerplate)
SKIP_PATTERNS = [
    'node_modules', 'vendor', 'dist', 'build', '.git', '__pycache__',
    'package-lock.json', 'yarn.lock', '.min.js', '.min.css',
    'migrations', '.next', '.nuxt', 'venv', 'env',
]

# Strict blocklist for secrets (Engine Hard Rule 2)
SECRET_PATTERNS = [
    '.env', '.pem', '.key', '.p12', '.pfx', 'id_rsa', 'id_ed25519',
    'credentials.json', 'secrets.json', '.secret', '.aws/credentials'
]

# Test file patterns
TEST_PATTERNS = re.compile(
    r'(test_|_test\.|\.test\.|\.spec\.|tests[\\/]|test[\\/]|__tests__[\\/]|spec[\\/])',
    re.IGNORECASE
)

# Test assertion patterns
ASSERT_PATTERNS = re.compile(
    r'\b(assert|expect|should|describe|it\(|test\(|assertEqual|assertTrue|assertFalse|toBe|toEqual|toHaveBeenCalled)\b',
    re.IGNORECASE
)

# Error handling patterns per language
ERROR_PATTERNS = {
    'Python': re.compile(r'\b(try|except|raise|finally)\b'),
    'JavaScript': re.compile(r'\b(try|catch|throw|finally)\b'),
    'TypeScript': re.compile(r'\b(try|catch|throw|finally)\b'),
    'Go': re.compile(r'(if err != nil|errors\.New|fmt\.Errorf)'),
    'Java': re.compile(r'\b(try|catch|throw|throws|finally)\b'),
    'Ruby': re.compile(r'\b(begin|rescue|raise|ensure)\b'),
    'Rust': re.compile(r'(Result<|unwrap\(|expect\(|\?;|Err\()'),
}

# Naming convention patterns (Rule 14: language-specific)
NAMING_STANDARDS = {
    'Python': 'snake_case',
    'JavaScript': 'camelCase',
    'TypeScript': 'camelCase',
    'Go': 'camelCase',
    'Java': 'camelCase',
    'Ruby': 'snake_case',
}

CLONE_DEPTH = int(os.getenv('CODEDNA_CLONE_DEPTH', '20'))
CLONE_TIMEOUT_SECONDS = int(os.getenv('CODEDNA_CLONE_TIMEOUT_SECONDS', '90'))
GIT_LOG_LIMIT = int(os.getenv('CODEDNA_GIT_LOG_LIMIT', '50'))
GIT_TIMEOUT_SECONDS = int(os.getenv('CODEDNA_GIT_TIMEOUT_SECONDS', '12'))
MAX_REPOS_TO_ANALYZE = int(os.getenv('CODEDNA_MAX_REPOS', '0'))
MAX_REPO_WORKERS = int(os.getenv('CODEDNA_MAX_REPO_WORKERS', '6'))
MAX_REPO_SIZE_KB = int(os.getenv('CODEDNA_MAX_REPO_SIZE_KB', '0'))
MAX_CANDIDATE_FILES = int(os.getenv('CODEDNA_MAX_CANDIDATE_FILES', '2000'))
MAX_FILES_TO_SCORE = int(os.getenv('CODEDNA_MAX_FILES_TO_SCORE', '80'))
MAX_FILE_BYTES = int(os.getenv('CODEDNA_MAX_FILE_BYTES', '200000'))
PARTIAL_CLONE_FILTER = os.getenv('CODEDNA_PARTIAL_CLONE_FILTER', 'blob:limit=200k')
PEER_BATCH_TIMEOUT_SECONDS = int(os.getenv('CODEDNA_PEER_BATCH_TIMEOUT_SECONDS', '900'))

LANGUAGE_PRIORITY = {
    'Python': 110,
    'TypeScript': 105,
    'JavaScript': 100,
    'Go': 95,
    'Java': 90,
    'Rust': 90,
    'C++': 85,
    'C': 80,
    'C#': 80,
    'PHP': 75,
    'Ruby': 75,
    'Markdown': 40,
    'JSON': 25,
    'YAML': 25,
    'TOML': 25,
}


def should_skip_file(filepath: str) -> bool:
    """Check if a file should be skipped."""
    filepath_lower = filepath.lower().replace('\\', '/')
    path_parts = [part for part in filepath_lower.split('/') if part]
    
    # 1. Block secrets immediately
    for secret in SECRET_PATTERNS:
        if secret in filepath_lower:
            return True
            
    # 2. Block generated/vendor files
    for pattern in SKIP_PATTERNS:
        normalized = pattern.lower().replace('\\', '/')
        if normalized.startswith('.') and filepath_lower.endswith(normalized):
            return True
        if '/' in normalized and normalized in filepath_lower:
            return True
        if normalized in path_parts:
            return True
            
    return False


def detect_language(filepath: str) -> str | None:
    """Detect programming language from file extension."""
    ext = Path(filepath).suffix.lower()
    return LANG_EXTENSIONS.get(ext)


def is_test_file(filepath: str) -> bool:
    """Detect if a file is a test file."""
    return bool(TEST_PATTERNS.search(filepath))


def analyze_python_ast(content: str) -> dict:
    """Use Python's built-in AST module for deep analysis of Python files."""
    try:
        tree = ast.parse(content)
    except SyntaxError:
        return {}

    functions = []
    classes = 0
    docstrings = 0
    max_nesting = 0

    for node in ast.walk(tree):
        if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
            func_lines = node.end_lineno - node.lineno + 1 if node.end_lineno else 1
            functions.append(func_lines)
            if ast.get_docstring(node):
                docstrings += 1
        elif isinstance(node, ast.ClassDef):
            classes += 1

    def get_nesting_depth(node, depth=0):
        max_d = depth
        for child in ast.iter_child_nodes(node):
            if isinstance(child, (ast.If, ast.For, ast.While, ast.With, ast.Try)):
                max_d = max(max_d, get_nesting_depth(child, depth + 1))
            else:
                max_d = max(max_d, get_nesting_depth(child, depth))
        return max_d

    max_nesting = get_nesting_depth(tree)

    return {
        'function_lengths': functions,
        'num_functions': len(functions),
        'avg_function_length': sum(functions) / len(functions) if functions else 0,
        'max_nesting_depth': max_nesting,
        'num_classes': classes,
        'docstring_count': docstrings,
        'docstring_ratio': docstrings / len(functions) if functions else 0,
    }


def analyze_jsts_ast(content: str, language: str) -> dict:
    """Use Tree-sitter for deep analysis of JS/TS files."""
    if not HAS_TREE_SITTER:
        return {}
    try:
        if language == 'JavaScript':
            parser = tree_sitter.Parser(JS_LANG)
        elif language == 'TypeScript':
            if '</div>' in content or 'react' in content.lower():
                parser = tree_sitter.Parser(TSX_LANG)
            else:
                parser = tree_sitter.Parser(TS_LANG)
        else:
            return {}

        if hasattr(parser, 'timeout_micros'):
            parser.timeout_micros = 5_000_000  # 5 seconds
        tree = parser.parse(bytes(content, "utf8"))
        
        functions = []
        classes = 0
        docstrings = 0
        
        def walk_tree(node, depth):
            nonlocal classes, docstrings
            max_d = depth
            
            if node.type in ['function_declaration', 'method_definition', 'arrow_function']:
                start_line = node.start_point[0]
                end_line = node.end_point[0]
                func_lines = end_line - start_line + 1
                functions.append(func_lines)
            
            if node.type == 'class_declaration':
                classes += 1
                
            if node.type == 'comment':
                if b'/**' in content.encode('utf8')[node.start_byte:node.end_byte]:
                    docstrings += 1

            if node.type in ['if_statement', 'for_statement', 'while_statement', 'try_statement', 'catch_clause']:
                depth += 1
                max_d = max(max_d, depth)
                
            for child in node.children:
                max_d = max(max_d, walk_tree(child, depth))
                
            return max_d

        max_nesting = walk_tree(tree.root_node, 0)
        
        return {
            'function_lengths': functions,
            'num_functions': len(functions),
            'avg_function_length': sum(functions) / len(functions) if functions else 0,
            'max_nesting_depth': max_nesting,
            'num_classes': classes,
            'docstring_count': docstrings,
            'docstring_ratio': docstrings / len(functions) if functions else 0,
        }
    except Exception as e:
        print(f"Tree-sitter parse failed: {e}")
        return {}


def analyze_file_generic(content: str, language: str) -> dict:
    """Generic heuristic analysis for any language."""
    lines = content.split('\n')
    total_lines = len(lines)
    blank_lines = sum(1 for l in lines if not l.strip())
    code_lines = total_lines - blank_lines

    # Comment detection
    comment_lines = 0
    for line in lines:
        stripped = line.strip()
        if stripped.startswith('#') or stripped.startswith('//') or stripped.startswith('/*') or stripped.startswith('*'):
            comment_lines += 1

    comment_ratio = comment_lines / code_lines if code_lines > 0 else 0

    # Function detection (heuristic)
    func_pattern = re.compile(r'(def |function |func |fn |public |private |protected )')
    func_count = len(func_pattern.findall(content))

    # Naming analysis
    identifiers = re.findall(r'\b([a-zA-Z_][a-zA-Z0-9_]*)\b', content)
    snake_count = sum(1 for i in identifiers if '_' in i and i == i.lower())
    camel_count = sum(1 for i in identifiers if re.match(r'^[a-z][a-zA-Z0-9]*$', i) and any(c.isupper() for c in i))
    total_named = snake_count + camel_count

    expected = NAMING_STANDARDS.get(language, 'camelCase')
    if expected == 'snake_case':
        naming_consistency = snake_count / total_named if total_named > 0 else 0.5
    else:
        naming_consistency = camel_count / total_named if total_named > 0 else 0.5

    naming_style = 'camelCase'
    if snake_count > camel_count:
        naming_style = 'snake_case'
    elif total_named == 0:
        naming_style = 'unknown'

    # Error handling
    error_pattern = ERROR_PATTERNS.get(language, re.compile(r'\b(try|catch|except|throw|raise)\b'))
    error_blocks = len(error_pattern.findall(content))

    # Test assertions
    assertion_count = len(ASSERT_PATTERNS.findall(content))

    # Magic numbers (literals not 0, 1, 2)
    magic_numbers = len(re.findall(r'(?<!\w)\d{2,}(?!\w)', content))

    # Nesting depth heuristic
    max_indent = 0
    for line in lines:
        if line.strip():
            indent = len(line) - len(line.lstrip())
            max_indent = max(max_indent, indent)
    nesting_estimate = max_indent // 4  # Rough: 4 spaces per level

    # Average function length (heuristic for non-python)
    avg_func_len = code_lines / func_count if func_count > 0 else 20

    return {
        'total_lines': total_lines,
        'code_lines': code_lines,
        'comment_lines': comment_lines,
        'comment_ratio': comment_ratio,
        'func_count': func_count,
        'avg_function_length': avg_func_len,
        'naming_consistency': naming_consistency,
        'naming_style': naming_style,
        'error_handling_blocks': error_blocks,
        'assertion_count': assertion_count,
        'magic_numbers': magic_numbers,
        'max_nesting_estimate': nesting_estimate,
    }


def _redact_token(value: str, token: str | None) -> str:
    if token:
        return value.replace(token, '***')
    return value


def _clear_clone_target(target_dir: str):
    if os.path.exists(target_dir):
        shutil.rmtree(target_dir, ignore_errors=True)


def clone_repo(clone_url: str, target_dir: str, token: str = None, default_branch: str = None) -> bool:
    """Ultra-lean shallow clone with small source blobs available locally."""
    try:
        env = os.environ.copy()
        env['GIT_TERMINAL_PROMPT'] = '0'
        env['GIT_ASKPASS'] = 'echo'
        env['GCM_INTERACTIVE'] = 'never'
        env['GIT_LFS_SKIP_SMUDGE'] = '1'
        
        # Inject token into URL for private repo access if provided
        final_url = clone_url
        if token and 'github.com' in clone_url:
            final_url = clone_url.replace('https://', f'https://{token}@')

        command = [
            'git', 'clone',
            '--depth', str(CLONE_DEPTH),
            '--single-branch',
            '--no-tags',
            '--filter', PARTIAL_CLONE_FILTER,
        ]
        if default_branch:
            command.extend(['--branch', default_branch])
        command.extend([final_url, target_dir])

        result = subprocess.run(
            command,
            capture_output=True,
            text=True,
            timeout=CLONE_TIMEOUT_SECONDS,
            check=False,
            env=env
        )
        if result.returncode == 0:
            return True

        # Some hosts/proxies do not support partial clone filters. Fall back to a
        # plain shallow clone so analysis still completes instead of hanging.
        _clear_clone_target(target_dir)
        fallback = [
            'git', 'clone',
            '--depth', '1',
            '--single-branch',
            '--no-tags',
        ]
        if default_branch:
            fallback.extend(['--branch', default_branch])
        fallback.extend([final_url, target_dir])
        result = subprocess.run(
            fallback,
            capture_output=True,
            text=True,
            timeout=CLONE_TIMEOUT_SECONDS,
            check=False,
            env=env
        )
        if result.returncode != 0:
            stderr = _redact_token(result.stderr.strip(), token)
            print(f"  ! Failed to clone {_redact_token(clone_url, token)}: {stderr}", flush=True)
            return False
        return True
    except subprocess.TimeoutExpired:
        print(f"  ! Timeout cloning {_redact_token(clone_url, token)}", flush=True)
        return False
    except Exception as e:
        print(f"  ! Failed to clone {_redact_token(clone_url, token)}: {_redact_token(str(e), token)}", flush=True)
        return False


def analyze_repository(repo_dir: str) -> dict:
    """Walk all source files in a cloned repo and extract metrics in parallel."""
    language_line_counts = Counter()
    test_file_count = 0
    total_files = 0
    total_assertions = 0
    
    # 1. Collect a bounded set of source candidates first. Large repos often
    # contain thousands of generated/config files; scanning forever makes the
    # user wait without improving the profile.
    source_files = []
    for root, dirs, files in os.walk(repo_dir):
        dirs[:] = [d for d in dirs if not d.startswith('.') and not should_skip_file(d)]
        for fname in files:
            filepath = os.path.join(root, fname)
            rel_path = os.path.relpath(filepath, repo_dir)
            if should_skip_file(rel_path): continue
            
            language = detect_language(fname)
            if not language: continue

            try:
                size = os.path.getsize(filepath)
            except OSError:
                continue
            if size <= 0 or size > MAX_FILE_BYTES:
                continue

            source_files.append((filepath, rel_path, language, size))
            if len(source_files) >= MAX_CANDIDATE_FILES:
                break
        if len(source_files) >= MAX_CANDIDATE_FILES:
            break

    # 2. Extract Git History Metrics (Real Data)
    commit_metrics = {
        'avg_message_length': 0,
        'most_active_hour': 12,
        'most_active_day': 'Monday',
        'fix_to_feature_ratio': 0.2,
        'commit_style': 'Imperative',
        'total_commits': 0,
        'avg_commit_size': 0,
        'emoji_usage_pct': 0,
    }
    try:
        # Get last 100 commits, include shortstat for commit size, and special delimiter
        log_output = subprocess.check_output(
            ['git', '--no-pager', 'log', '-n', str(GIT_LOG_LIMIT), '--format=@@@%ad|%s', '--date=iso', '--shortstat'],
            cwd=repo_dir, env=os.environ, stderr=subprocess.DEVNULL, timeout=GIT_TIMEOUT_SECONDS
        ).decode('utf-8', errors='ignore')
        
        if log_output:
            commits_data = [c for c in log_output.split('@@@') if c.strip()]
            total_len = 0
            hours = []
            fixes = 0
            emojis = 0
            total_lines_changed = 0
            valid_commits = 0
            
            for c_data in commits_data:
                lines = c_data.strip().split('\n')
                if not lines: continue
                
                header = lines[0]
                if '|' not in header: continue
                date_str, msg = header.split('|', 1)
                
                total_len += len(msg)
                
                hour_match = re.search(r' (\d{2}):', date_str)
                if hour_match: hours.append(int(hour_match.group(1)))
                
                if re.search(r'\b(fix|bug|patch|issue)\b', msg, re.I): fixes += 1
                if re.search(r'[\U0001F000-\U0001FAFF]', msg): emojis += 1
                
                stat_line = lines[-1] if len(lines) > 1 else ""
                if ' changed' in stat_line and (' insertion' in stat_line or ' deletion' in stat_line):
                    ins_match = re.search(r'(\d+) insertion', stat_line)
                    del_match = re.search(r'(\d+) deletion', stat_line)
                    ins = int(ins_match.group(1)) if ins_match else 0
                    dels = int(del_match.group(1)) if del_match else 0
                    total_lines_changed += (ins + dels)
                
                valid_commits += 1
            
            if valid_commits > 0:
                commit_metrics['total_commits'] = valid_commits
                commit_metrics['avg_message_length'] = total_len / valid_commits
                if hours: commit_metrics['most_active_hour'] = Counter(hours).most_common(1)[0][0]
                commit_metrics['fix_to_feature_ratio'] = fixes / valid_commits
                commit_metrics['commit_style'] = 'Descriptive' if (total_len / valid_commits) > 50 else 'Imperative'
                commit_metrics['avg_commit_size'] = total_lines_changed / valid_commits
                commit_metrics['emoji_usage_pct'] = (emojis / valid_commits) * 100

    except Exception as e:
        print(f"  ! Git log analysis failed: {e}")

    def file_priority(file_info):
        filepath, rel_path, language, size = file_info
        name = os.path.basename(rel_path).lower()
        priority = LANGUAGE_PRIORITY.get(language, 50)
        if is_test_file(rel_path):
            priority -= 8
        if name.startswith('readme'):
            priority += 20
        if name in {'package.json', 'pyproject.toml', 'requirements.txt', 'go.mod', 'cargo.toml'}:
            priority += 14

        # Prefer meaningful medium-sized source files. Huge files are slower and
        # more likely generated; tiny files rarely carry enough signal.
        if size < 400:
            size_score = size / 400
        elif size <= 60_000:
            size_score = 1
        else:
            size_score = max(0.2, 1 - ((size - 60_000) / MAX_FILE_BYTES))
        return priority + (size_score * 25)

    # 3. Score the most representative files, not simply the largest files.
    source_files = sorted(source_files, key=file_priority, reverse=True)[:MAX_FILES_TO_SCORE]

    def analyze_file_task(file_info):
        filepath, rel_path, language, size = file_info
        try:
            with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()
            if len(content) > MAX_FILE_BYTES: return None
            
            is_test = is_test_file(rel_path)
            metrics = analyze_file_generic(content, language)
            
            if language == 'Python' and not is_test:
                py_metrics = analyze_python_ast(content)
                metrics.update(py_metrics)
                if 'max_nesting_depth' in py_metrics:
                    metrics['max_nesting_estimate'] = py_metrics['max_nesting_depth']
            elif language in ['JavaScript', 'TypeScript'] and not is_test:
                js_metrics = analyze_jsts_ast(content, language)
                if js_metrics:
                    metrics.update(js_metrics)
                    if 'max_nesting_depth' in js_metrics:
                        metrics['max_nesting_estimate'] = js_metrics['max_nesting_depth']
                
            metrics['language'] = language
            metrics['is_test'] = is_test
            return metrics
        except:
            return None

    # 4. Analyze files sequentially. The outer repo analysis is already parallel,
    # so this keeps CPU and disk pressure predictable.
    file_metrics = []
    for file_info in source_files:
        m = analyze_file_task(file_info)
        if m:
            file_metrics.append(m)
            language_line_counts[m['language']] += m['code_lines']
            total_files += 1
            if m['is_test']:
                test_file_count += 1
            total_assertions += m.get('assertion_count', 0)

    return {
        'file_metrics': file_metrics,
        'language_line_counts': dict(language_line_counts),
        'test_file_count': test_file_count,
        'total_files': total_files,
        'total_assertions': total_assertions,
        'activity': get_repo_activity(repo_dir),
        'commit_metrics': commit_metrics,
    }


def get_repo_activity(repo_path: str) -> list:
    """Extract commit dates for the last 90 days using git log."""
    try:
        # Get commit timestamps from last 90 days
        cmd = ["git", "--no-pager", "log", "--since=90.days.ago", "--format=%at"]
        result = subprocess.run(cmd, cwd=repo_path, capture_output=True, text=True, check=True, timeout=GIT_TIMEOUT_SECONDS)
        timestamps = result.stdout.splitlines()
        
        from datetime import datetime, timezone
        now = datetime.now(timezone.utc).timestamp()
        day_seconds = 86400
        
        pulse = [0] * 90
        for ts in timestamps:
            try:
                days_ago = int((now - int(ts)) / day_seconds)
                if 0 <= days_ago < 90:
                    pulse[89 - days_ago] += 1
            except:
                continue
        return pulse
    except:
        return [0] * 90


def compute_scores(all_repo_results: list) -> dict:
    """
    Compute the 8-axis DNA scores from aggregated repo analysis results.
    Each score is 0-100. Uses the formulas from Blueprint §11 Step 5.
    """
    # Aggregate all file metrics
    all_metrics = []
    total_language_lines = Counter()
    total_test_files = 0
    total_files = 0
    total_assertions = 0
    
    # Aggregated commit patterns
    agg_commit_styles = []
    agg_hours = []
    agg_msg_lens = []
    agg_fix_ratios = []
    agg_total_commits = 0
    agg_commit_sizes = []
    agg_emoji_pcts = []

    for repo in all_repo_results:
        all_metrics.extend(repo['file_metrics'])
        for lang, lines in repo['language_line_counts'].items():
            total_language_lines[lang] += lines
        total_test_files += repo['test_file_count']
        total_files += repo['total_files']
        total_assertions += repo['total_assertions']
        
        cm = repo.get('commit_metrics', {})
        agg_commit_styles.append(cm.get('commit_style', 'Imperative'))
        agg_hours.append(cm.get('most_active_hour', 12))
        agg_msg_lens.append(cm.get('avg_message_length', 0))
        agg_fix_ratios.append(cm.get('fix_to_feature_ratio', 0))
        agg_total_commits += cm.get('total_commits', 0)
        agg_commit_sizes.append(cm.get('avg_commit_size', 0))
        agg_emoji_pcts.append(cm.get('emoji_usage_pct', 0))

    if not all_metrics:
        return {
            'scores': _default_scores(),
            'patterns': _default_patterns(),
        }

    # --- Axis 1: Code Readability ---
    naming_scores = [m.get('naming_consistency', 0.5) for m in all_metrics]
    avg_naming = sum(naming_scores) / len(naming_scores) if naming_scores else 0.5
    func_lengths = [m.get('avg_function_length', 20) for m in all_metrics if m.get('avg_function_length', 0) > 0]
    avg_func_len = sum(func_lengths) / len(func_lengths) if func_lengths else 20
    magic_nums = sum(m.get('magic_numbers', 0) for m in all_metrics)
    magic_density = magic_nums / total_files if total_files > 0 else 0

    readability = int(min(100, max(0,
        avg_naming * 35 * 100 +
        max(0, (1 - avg_func_len / 50)) * 25 * 100 +
        max(0, (1 - magic_density / 10)) * 20 * 100 +
        sum(m.get('comment_ratio', 0) for m in all_metrics) / len(all_metrics) * 20 * 100
    )))

    # --- Axis 2: Complexity Management ---
    nesting_depths = [m.get('max_nesting_estimate', 0) for m in all_metrics]
    avg_nesting = sum(nesting_depths) / len(nesting_depths) if nesting_depths else 0
    complexity = int(min(100, max(0, (1 - avg_nesting / 10) * 100)))

    # --- Axis 3: Documentation Quality ---
    comment_ratios = [m.get('comment_ratio', 0) for m in all_metrics if not m.get('is_test')]
    avg_comment = sum(comment_ratios) / len(comment_ratios) if comment_ratios else 0
    docstring_ratios = [m.get('docstring_ratio', 0) for m in all_metrics if 'docstring_ratio' in m]
    avg_docstring = sum(docstring_ratios) / len(docstring_ratios) if docstring_ratios else 0
    documentation = int(min(100, max(0, avg_comment * 300 + avg_docstring * 50)))

    # --- Axis 4: Test Mindset ---
    test_ratio = total_test_files / total_files if total_files > 0 else 0
    assertion_density = total_assertions / total_test_files if total_test_files > 0 else 0
    test_mindset = int(min(100, max(0,
        test_ratio * 50 * 100 +
        min(assertion_density / 10, 1) * 30 * 100 +
        (1 if total_test_files > 0 else 0) * 20 * 100
    )))

    # --- Axis 5: Commit Discipline (estimated from repo structure) ---
    # Without commit history, estimate from file organization
    has_readme = any('readme' in m.get('language', '').lower() for m in all_metrics)
    commit_discipline = int(min(100, max(0, 50 + (20 if has_readme else 0) + min(total_files, 30))))

    # --- Axis 6: Language Depth ---
    num_languages = len(total_language_lines)
    if num_languages == 0:
        language_depth = 0
    else:
        total_lines_all = sum(total_language_lines.values())
        top_lang_lines = max(total_language_lines.values()) if total_language_lines else 0
        concentration = top_lang_lines / total_lines_all if total_lines_all > 0 else 0
        # Reward depth (high concentration) but also having 2-3 languages
        language_depth = int(min(100, max(0, concentration * 60 + min(num_languages / 5, 1) * 40) * 100))

    # --- Axis 7: Refactor Tendency ---
    # Heuristic: shorter functions + lower nesting = likely refactored
    refactor_tendency = int(min(100, max(0,
        max(0, (1 - avg_func_len / 40)) * 50 * 100 +
        max(0, (1 - avg_nesting / 8)) * 50 * 100
    )))

    # --- Axis 8: Error Handling ---
    error_blocks = sum(m.get('error_handling_blocks', 0) for m in all_metrics if not m.get('is_test'))
    non_test_files = sum(1 for m in all_metrics if not m.get('is_test'))
    error_density = error_blocks / non_test_files if non_test_files > 0 else 0
    error_handling = int(min(100, max(0, min(error_density / 3, 1) * 100)))

    return {
        'scores': {
            'readability': min(readability, 100),
            'complexity': min(complexity, 100),
            'documentation': min(documentation, 100),
            'test_mindset': min(test_mindset, 100),
            'commit_discipline': min(commit_discipline, 100),
            'language_depth': min(language_depth, 100),
            'refactor_tendency': min(refactor_tendency, 100),
            'error_handling': min(error_handling, 100),
        },
        'patterns': {
            'naming_style': Counter([m.get('naming_style', 'unknown') for m in all_metrics]).most_common(1)[0][0] if all_metrics else 'unknown',
            'avg_fn_length': int(avg_func_len),
            'commit_style': Counter(agg_commit_styles).most_common(1)[0][0] if agg_commit_styles else 'Imperative',
            'most_active_hour': Counter(agg_hours).most_common(1)[0][0] if agg_hours else 12,
            'avg_message_length': sum(agg_msg_lens) / len(agg_msg_lens) if agg_msg_lens else 0,
            'fix_to_feature_ratio': sum(agg_fix_ratios) / len(agg_fix_ratios) if agg_fix_ratios else 0.2,
            'avg_commit_size': sum(agg_commit_sizes) / len(agg_commit_sizes) if agg_commit_sizes else 0,
            'emoji_usage_pct': sum(agg_emoji_pcts) / len(agg_emoji_pcts) if agg_emoji_pcts else 0,
            'total_commits': agg_total_commits,
        }
    }


def _default_scores():
    """Return zeroed scores when no files could be analyzed."""
    return {k: 0 for k in [
        'readability', 'complexity', 'documentation', 'test_mindset',
        'commit_discipline', 'language_depth', 'refactor_tendency', 'error_handling'
    ]}


def _default_patterns():
    """Return neutral pattern values when no repositories can be analyzed."""
    return {
        'naming_style': 'unknown',
        'avg_fn_length': 0,
        'commit_style': 'Imperative',
        'most_active_hour': 12,
        'avg_message_length': 0,
        'fix_to_feature_ratio': 0,
        'avg_commit_size': 0,
        'emoji_usage_pct': 0,
        'total_commits': 0,
    }


def classify_developer_type(scores: dict) -> tuple[str, str]:
    """
    Classify developer into one of 8 types using a decision tree.
    Returns (type_name, personality_summary).
    Based on Blueprint §6 table.
    """
    r = scores['readability']
    c = scores['complexity']
    d = scores['documentation']
    t = scores['test_mindset']
    cd = scores['commit_discipline']
    ld = scores['language_depth']
    rt = scores['refactor_tendency']
    eh = scores['error_handling']

    # Decision tree from Blueprint
    if r >= 70 and c >= 60 and t < 50:
        dev_type = "The Architect"
        summary = f"You write clean, structured code with strong readability ({r}/100) and good complexity management ({c}/100), but your test coverage could use attention ({t}/100)."
    elif d >= 70 and r >= 70 and rt >= 60:
        dev_type = "The Perfectionist"
        summary = f"You prioritize documentation ({d}/100) and readability ({r}/100), and regularly refactor your code ({rt}/100). Your code is a joy to maintain."
    elif d < 40 and c >= 50 and ld >= 50:
        dev_type = "The Hacker"
        summary = f"You move fast across multiple languages ({ld}/100) and tackle complex problems ({c}/100), but documentation isn't your priority ({d}/100)."
    elif d >= 60 and cd >= 60 and c < 50:
        dev_type = "The Documenter"
        summary = f"Your code is well-documented ({d}/100) with disciplined commits ({cd}/100). You favor simplicity over complexity."
    elif eh >= 60 and rt >= 60:
        dev_type = "The Debugger"
        summary = f"You excel at error handling ({eh}/100) and regularly refactor code ({rt}/100). You build resilient systems."
    elif ld >= 60 and ld > r:
        dev_type = "The Explorer"
        summary = f"You work across many languages ({ld}/100) and love learning new technologies. Your breadth is impressive."
    elif r >= 60 and d < 40 and c >= 50:
        dev_type = "The Minimalist"
        summary = f"Your code is readable ({r}/100) and well-structured ({c}/100), with minimal comments — you let the code speak for itself."
    else:
        dev_type = "The Pragmatist"
        summary = f"You maintain a balanced profile across all axes. No extreme highs or lows — you're adaptable and practical."

    return dev_type, summary


def determine_strengths_and_growth(scores: dict) -> tuple[list, list]:
    """
    Determine top 3 strengths and growth areas.
    Rule 13: Growth areas must be framed constructively.
    """
    axis_names = {
        'readability': 'Code Readability',
        'complexity': 'Complexity Management',
        'documentation': 'Documentation Quality',
        'test_mindset': 'Test Mindset',
        'commit_discipline': 'Commit Discipline',
        'language_depth': 'Language Depth',
        'refactor_tendency': 'Refactor Tendency',
        'error_handling': 'Error Handling',
    }

    sorted_axes = sorted(scores.items(), key=lambda x: x[1], reverse=True)
    strengths = [axis_names[k] for k, v in sorted_axes[:3]]
    growth = [axis_names[k] for k, v in sorted_axes[-3:]]

    return strengths, growth


def _selected_repositories(repositories: list) -> list:
    return repositories[:MAX_REPOS_TO_ANALYZE] if MAX_REPOS_TO_ANALYZE > 0 else repositories


def _engine_peer_urls() -> list:
    raw = os.getenv('CODEDNA_ENGINE_PEER_URLS', '')
    self_url = os.getenv('CODEDNA_ENGINE_SELF_URL', '').rstrip('/')
    peers = []
    for url in raw.split(','):
        normalized = url.strip().rstrip('/')
        if normalized and normalized != self_url and normalized not in peers:
            peers.append(normalized)
    return peers


def _webhook_headers() -> dict:
    secret = os.getenv('WEBHOOK_SECRET')
    return {'x-webhook-secret': secret} if secret else {}


def _split_repositories(repositories: list, worker_count: int) -> list:
    chunks = [[] for _ in range(max(1, worker_count))]
    sorted_repos = sorted(repositories, key=lambda repo: repo.get('size') or 0, reverse=True)
    for index, repo in enumerate(sorted_repos):
        chunks[index % len(chunks)].append(repo)
    return [chunk for chunk in chunks if chunk]


def _analyze_single_repo(username: str, index: int, repo: dict, access_token: str = None) -> dict | None:
    tmp_dir = tempfile.mkdtemp(prefix=f'codedna_{username}_{index}_')
    try:
        clone_url = repo.get('clone_url', '')
        if not clone_url:
            return None

        # Engine Hard Rule 4: Never penalize for learning repositories
        repo_name = repo.get('name', '').lower()
        learning_keywords = ['learn', 'practice', 'tutorial', 'course', 'exercise', 'kata', 'bootcamp', 'hello', 'test-', 'demo']
        if any(k in repo_name for k in learning_keywords):
            print(f"  > Skipping learning repo (Rule 4): {repo['name']}", flush=True)
            return None

        repo_size = repo.get('size')
        if MAX_REPO_SIZE_KB > 0 and isinstance(repo_size, int) and repo_size > MAX_REPO_SIZE_KB:
            print(f"  > Skipping oversized repo: {repo['name']} ({repo_size} KB)", flush=True)
            return None

        print(f"  > Cloning {repo['name']} (Parallel)...", flush=True)
        if not clone_repo(clone_url, tmp_dir, token=access_token, default_branch=repo.get('default_branch')):
            return None

        print(f"  > Analyzing {repo['name']}...", flush=True)
        return analyze_repository(tmp_dir)
    finally:
        shutil.rmtree(tmp_dir, ignore_errors=True)


def analyze_repository_batch(username: str, repositories: list, access_token: str = None, progress_callback=None) -> dict:
    repo_results = []
    language_stats = Counter()
    total_repos = len(repositories)

    if progress_callback and total_repos == 0:
        progress_callback(90, "No repositories assigned to this engine")

    worker_count = max(1, min(MAX_REPO_WORKERS, total_repos or 1))
    with concurrent.futures.ThreadPoolExecutor(max_workers=worker_count) as executor:
        future_to_repo = {
            executor.submit(_analyze_single_repo, username, i, repo, access_token): repo
            for i, repo in enumerate(repositories)
        }

        completed = 0
        for future in concurrent.futures.as_completed(future_to_repo):
            completed += 1
            if progress_callback:
                current_progress = 10 + int((completed / max(total_repos, 1)) * 80)
                repo_name = future_to_repo[future]['name']
                progress_callback(current_progress, f"Processed {repo_name} ({completed}/{total_repos})")

            result = future.result()
            if result:
                repo_results.append(result)
                for lang, lines in result['language_line_counts'].items():
                    language_stats[lang] += lines

    return {
        'repo_results': repo_results,
        'repos_analyzed': len(repo_results),
        'language_stats': dict(language_stats),
    }


def _analyze_remote_batch(peer_url: str, username: str, repositories: list, access_token: str = None) -> dict:
    response = requests.post(
        f"{peer_url}/analyze-batch",
        json={
            "username": username,
            "repositories": repositories,
            "access_token": access_token,
        },
        headers=_webhook_headers(),
        timeout=PEER_BATCH_TIMEOUT_SECONDS,
    )
    if not response.ok:
        raise RuntimeError(f"{peer_url} rejected batch: {response.status_code} {response.text[:200]}")
    return response.json()


def analyze_repositories_distributed(username: str, repositories: list, progress_callback=None, access_token: str = None) -> list:
    peers = _engine_peer_urls()
    if not peers or len(repositories) < 2:
        return analyze_repository_batch(username, repositories, access_token, progress_callback)['repo_results']

    workers = ['local'] + peers
    chunks = _split_repositories(repositories, len(workers))
    repo_results = []

    if progress_callback:
        progress_callback(12, f"Distributing {len(repositories)} repositories across {len(chunks)} engine batch(es)")

    def run_chunk(worker, chunk):
        if worker == 'local':
            return analyze_repository_batch(username, chunk, access_token)
        try:
            return _analyze_remote_batch(worker, username, chunk, access_token)
        except Exception as error:
            print(f"  ! Peer engine failed ({worker}): {error}. Falling back locally.", flush=True)
            return analyze_repository_batch(username, chunk, access_token)

    with concurrent.futures.ThreadPoolExecutor(max_workers=len(chunks)) as executor:
        futures = []
        for index, chunk in enumerate(chunks):
            worker = workers[index % len(workers)]
            futures.append(executor.submit(run_chunk, worker, chunk))

        completed = 0
        for future in concurrent.futures.as_completed(futures):
            completed += 1
            batch = future.result()
            repo_results.extend(batch.get('repo_results', []))
            if progress_callback:
                progress = 12 + int((completed / max(len(futures), 1)) * 78)
                progress_callback(progress, f"Completed engine batch {completed}/{len(futures)}")

    return repo_results


def build_analysis_response(all_repo_results: list) -> dict:
    language_stats = Counter()
    for repo_result in all_repo_results:
        for lang, lines in repo_result['language_line_counts'].items():
            language_stats[lang] += lines

    analysis_results = compute_scores(all_repo_results)
    scores = analysis_results['scores']
    patterns = analysis_results['patterns']
    dev_type, summary = classify_developer_type(scores)
    strengths, growth_areas = determine_strengths_and_growth(scores)

    lang_stats_list = []
    for lang, lines in language_stats.most_common(10):
        lang_stats_list.append({
            'language': lang,
            'total_lines': lines,
            'total_commits': 0,
            'trend': 'stable',
        })

    return {
        'scores': {k: int(v) for k, v in scores.items()},
        'developer_type': dev_type,
        'personality_summary': summary,
        'strengths': strengths,
        'growth_areas': growth_areas,
        'language_stats': lang_stats_list,
        'commit_patterns': {
            'avg_message_length': round(patterns['avg_message_length'], 1),
            'commit_style': patterns['commit_style'],
            'most_active_hour': patterns['most_active_hour'],
            'most_active_day': 'Analyzed Patterns',
            'avg_commit_size': int(patterns['avg_commit_size']),
            'fix_to_feature_ratio': round(patterns['fix_to_feature_ratio'], 2),
            'emoji_usage_pct': round(patterns['emoji_usage_pct'], 1),
            'naming_style': patterns['naming_style'],
            'avg_fn_length': int(patterns['avg_fn_length']),
            'total_commits': patterns['total_commits'],
        },
        'repos_analyzed': len(all_repo_results),
        'total_files_analyzed': sum(r['total_files'] for r in all_repo_results),
        'activity_pulse': [sum(day) for day in zip(*[r['activity'] for r in all_repo_results])] if all_repo_results else [0]*90
    }


def perform_full_analysis(username: str, repositories: list, progress_callback=None, access_token: str = None) -> dict:
    """
    The main analysis pipeline.
    Optimized for speed: distributes repository batches across peer engines when configured.
    """
    selected_repos = _selected_repositories(repositories)
    if progress_callback and len(selected_repos) == 0:
        progress_callback(90, "No eligible repositories found")

    all_repo_results = analyze_repositories_distributed(username, selected_repos, progress_callback, access_token)
    return build_analysis_response(all_repo_results)
