import os
import tempfile
import sys
import unittest
import zipfile
import base64
import time
import concurrent.futures
from io import BytesIO
from unittest.mock import patch

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from analyzer import (  # noqa: E402
    _adaptive_distributed_batch_size,
    _split_repositories,
    _repository_work_batches,
    analyze_repository,
    analyze_repository_batch,
    analyze_repositories_distributed,
    analyze_file_generic,
    analyze_python_ast,
    classify_developer_type,
    clone_repo,
    compute_scores,
    detect_language,
    download_repo_api_files,
    download_repo_archive,
    fetch_repo_source,
    is_test_file,
    perform_full_analysis,
    should_skip_file,
)


class AnalyzerSafetyTests(unittest.TestCase):
    def test_skips_secrets_generated_and_vendor_paths(self):
        self.assertTrue(should_skip_file(".env"))
        self.assertTrue(should_skip_file("src/id_rsa"))
        self.assertTrue(should_skip_file("node_modules/pkg/index.js"))
        self.assertTrue(should_skip_file("build/app.js"))
        self.assertFalse(should_skip_file("src/environment.ts"))
        self.assertFalse(should_skip_file("src/app.py"))

    def test_detects_languages_and_test_files_case_insensitively(self):
        self.assertEqual(detect_language("service.py"), "Python")
        self.assertEqual(detect_language("widget.TSX"), "TypeScript")
        self.assertIsNone(detect_language("LICENSE"))
        self.assertTrue(is_test_file("src/__tests__/widget.spec.ts"))
        self.assertTrue(is_test_file("tests/test_analyzer.py"))
        self.assertTrue(is_test_file(r"tests\test_analyzer.py"))
        self.assertFalse(is_test_file("src/analyzer.py"))

    def test_python_ast_handles_docstrings_nesting_and_bad_syntax(self):
        content = '''
def documented(value):
    """Useful function docs."""
    if value:
        for item in value:
            return item
    return None

async def plain():
    return 1
'''
        metrics = analyze_python_ast(content)
        self.assertEqual(metrics["num_functions"], 2)
        self.assertEqual(metrics["docstring_count"], 1)
        self.assertGreaterEqual(metrics["max_nesting_depth"], 2)
        self.assertEqual(analyze_python_ast("def broken("), {})

    def test_generic_analysis_counts_comments_assertions_and_errors(self):
        content = """
// explains intent
function doThing(value) {
  try {
    expect(value).toBe(42)
  } catch (err) {
    throw err
  }
}
"""
        metrics = analyze_file_generic(content, "JavaScript")
        self.assertGreater(metrics["comment_ratio"], 0)
        self.assertGreaterEqual(metrics["assertion_count"], 1)
        self.assertGreaterEqual(metrics["error_handling_blocks"], 3)

    def test_clone_repo_uses_fast_partial_clone_with_branch(self):
        calls = []

        def fake_run(command, **kwargs):
            calls.append(command)
            return type("Result", (), {"returncode": 0, "stderr": ""})()

        with patch("analyzer.subprocess.run", side_effect=fake_run):
            ok = clone_repo(
                "https://github.com/acme/app.git",
                "/tmp/codedna",
                token="secret-token",
                default_branch="main",
            )

        self.assertTrue(ok)
        self.assertIn("--filter", calls[0])
        self.assertIn("blob:limit=200k", calls[0])
        self.assertIn("--branch", calls[0])
        self.assertIn("main", calls[0])
        self.assertIn("https://secret-token@github.com/acme/app.git", calls[0])

    def test_clone_repo_falls_back_when_partial_clone_is_unsupported(self):
        calls = []

        def fake_run(command, **kwargs):
            calls.append(command)
            returncode = 1 if len(calls) == 1 else 0
            return type("Result", (), {"returncode": returncode, "stderr": "filtering not recognized"})()

        with patch("analyzer.subprocess.run", side_effect=fake_run):
            ok = clone_repo("https://github.com/acme/app.git", "/tmp/codedna")

        self.assertTrue(ok)
        self.assertIn("--filter", calls[0])
        self.assertNotIn("--filter", calls[1])

    def test_clone_repo_clears_partial_target_before_fallback(self):
        with tempfile.TemporaryDirectory() as parent:
            target = os.path.join(parent, "codedna_partial")
            os.mkdir(target)
            with open(os.path.join(target, "leftover.git"), "w", encoding="utf-8") as handle:
                handle.write("partial clone debris")

            calls = []

            def fake_run(command, **kwargs):
                calls.append(command)
                if len(calls) == 1:
                    return type("Result", (), {"returncode": 1, "stderr": "filtering not recognized"})()

                self.assertFalse(os.path.exists(target))
                return type("Result", (), {"returncode": 0, "stderr": ""})()

            with patch("analyzer.subprocess.run", side_effect=fake_run):
                ok = clone_repo("https://github.com/acme/app.git", target)

            self.assertTrue(ok)

    def test_download_repo_archive_extracts_github_zipball_safely(self):
        zip_buffer = BytesIO()
        with zipfile.ZipFile(zip_buffer, "w") as archive:
            archive.writestr("repo-main/src/app.py", "print('ok')")
            archive.writestr("repo-main/../evil.txt", "nope")

        class Response:
            status_code = 200
            content = zip_buffer.getvalue()

        with tempfile.TemporaryDirectory() as target:
            with patch("analyzer.requests.get", return_value=Response()) as get:
                ok = download_repo_archive(
                    "https://github.com/acme/app.git",
                    target,
                    token="secret-token",
                    default_branch="main",
                )

            self.assertTrue(ok)
            self.assertTrue(os.path.exists(os.path.join(target, "src", "app.py")))
            self.assertFalse(os.path.exists(os.path.join(os.path.dirname(target), "evil.txt")))
            args, kwargs = get.call_args
            self.assertEqual(args[0], "https://api.github.com/repos/acme/app/zipball/main")
            self.assertEqual(kwargs["headers"]["Authorization"], "token secret-token")

    def test_download_repo_api_files_fetches_only_selected_source_files(self):
        tree_response = type("Response", (), {
            "status_code": 200,
            "json": lambda self: {
                "tree": [
                    {"type": "blob", "path": "src/app.py", "sha": "py-sha", "size": 18},
                    {"type": "blob", "path": "node_modules/pkg/index.js", "sha": "vendor-sha", "size": 10},
                    {"type": "blob", "path": "assets/video.mp4", "sha": "asset-sha", "size": 10_000},
                ]
            },
        })()
        blob_response = type("Response", (), {
            "status_code": 200,
            "json": lambda self: {
                "encoding": "base64",
                "content": base64.b64encode(b"print('fast')").decode("ascii"),
            },
        })()

        def fake_get(url, **kwargs):
            if "/git/trees/" in url:
                return tree_response
            return blob_response

        with tempfile.TemporaryDirectory() as target:
            with patch("analyzer.requests.get", side_effect=fake_get) as get:
                ok = download_repo_api_files(
                    "https://github.com/acme/app.git",
                    target,
                    token="secret-token",
                    default_branch="main",
                )

            self.assertTrue(ok)
            self.assertTrue(os.path.exists(os.path.join(target, "src", "app.py")))
            self.assertFalse(os.path.exists(os.path.join(target, "node_modules")))
            requested_urls = [call.args[0] for call in get.call_args_list]
            self.assertIn("https://api.github.com/repos/acme/app/git/trees/main?recursive=1", requested_urls)
            self.assertIn("https://api.github.com/repos/acme/app/git/blobs/py-sha", requested_urls)
            self.assertNotIn("https://api.github.com/repos/acme/app/git/blobs/vendor-sha", requested_urls)

    def test_fetch_repo_source_falls_back_to_git_when_archive_fails(self):
        with tempfile.TemporaryDirectory() as target:
            with patch("analyzer.download_repo_api_files", return_value=False):
                with patch("analyzer.download_repo_archive", return_value=False):
                    with patch("analyzer.clone_repo", return_value=True) as clone:
                        ok = fetch_repo_source("https://github.com/acme/app.git", target)

        self.assertTrue(ok)
        clone.assert_called_once()


class AnalyzerScoringTests(unittest.TestCase):
    def test_compute_scores_returns_full_contract_when_no_metrics_exist(self):
        result = compute_scores([])
        self.assertEqual(set(result.keys()), {"scores", "patterns"})
        self.assertTrue(all(value == 0 for value in result["scores"].values()))
        self.assertEqual(result["patterns"]["naming_style"], "unknown")
        self.assertEqual(result["patterns"]["total_commits"], 0)

    def test_compute_scores_clamps_scores_to_expected_range(self):
        result = compute_scores([
            {
                "file_metrics": [
                    {
                        "language": "Python",
                        "code_lines": 120,
                        "comment_ratio": 0.2,
                        "naming_consistency": 1,
                        "avg_function_length": 8,
                        "magic_numbers": 0,
                        "max_nesting_estimate": 1,
                        "docstring_ratio": 0.5,
                        "is_test": False,
                        "error_handling_blocks": 2,
                    },
                    {
                        "language": "Python",
                        "code_lines": 30,
                        "comment_ratio": 0.1,
                        "naming_consistency": 1,
                        "avg_function_length": 6,
                        "max_nesting_estimate": 1,
                        "assertion_count": 4,
                        "is_test": True,
                    },
                ],
                "language_line_counts": {"Python": 150},
                "test_file_count": 1,
                "total_files": 2,
                "total_assertions": 4,
                "commit_metrics": {"commit_style": "Descriptive", "total_commits": 3},
            }
        ])

        for score in result["scores"].values():
            self.assertGreaterEqual(score, 0)
            self.assertLessEqual(score, 100)
        self.assertEqual(result["patterns"]["naming_style"], "unknown")
        self.assertEqual(result["patterns"]["total_commits"], 3)

    def test_perform_full_analysis_handles_empty_repository_list(self):
        result = perform_full_analysis("empty-user", [])
        self.assertEqual(result["repos_analyzed"], 0)
        self.assertEqual(result["total_files_analyzed"], 0)
        self.assertEqual(len(result["activity_pulse"]), 90)
        self.assertEqual(result["developer_type"], "The Pragmatist")

    def test_perform_full_analysis_attempts_oversized_repos_by_default(self):
        with patch("analyzer.fetch_repo_source", return_value=False) as fetch:
            result = perform_full_analysis("huge-user", [
                {
                    "name": "huge-monolith",
                    "clone_url": "https://github.com/acme/huge-monolith.git",
                    "size": 250000,
                }
            ])

        fetch.assert_called_once()
        self.assertEqual(result["repos_analyzed"], 0)

    def test_split_repositories_balances_by_repo_size(self):
        chunks = _split_repositories([
            {"name": "small", "size": 1},
            {"name": "huge", "size": 100},
            {"name": "medium", "size": 50},
        ], 2)

        self.assertEqual(chunks[0][0]["name"], "huge")
        self.assertEqual(chunks[1][0]["name"], "medium")

    def test_repository_work_batches_create_small_cost_ordered_batches(self):
        batches = _repository_work_batches([
            {"name": "small", "size": 1},
            {"name": "huge", "size": 100},
            {"name": "medium", "size": 50},
            {"name": "tiny", "size": 0},
        ], batch_size=2)

        self.assertEqual([[repo["name"] for repo in batch] for batch in batches], [
            ["huge", "medium"],
            ["small", "tiny"],
        ])

    def test_adaptive_batch_size_scales_with_repo_count(self):
        small = _adaptive_distributed_batch_size(repo_count=9, worker_count=3)
        large = _adaptive_distributed_batch_size(repo_count=100, worker_count=3)

        self.assertEqual(small, 1)
        self.assertGreater(large, small)

    def test_medium_repo_spawns_file_analysis_agents(self):
        with tempfile.TemporaryDirectory() as repo_dir:
            for index in range(24):
                path = os.path.join(repo_dir, f"file_{index}.py")
                with open(path, "w", encoding="utf-8") as handle:
                    handle.write(f"def fn_{index}():\n    return {index}\n")

            with patch("analyzer.FILE_ANALYSIS_PARALLEL_THRESHOLD", 2):
                with patch("analyzer.FILE_ANALYSIS_WORKERS", 3):
                    with patch("analyzer.concurrent.futures.ThreadPoolExecutor") as pool:
                        class ImmediateExecutor:
                            def __enter__(self):
                                return self

                            def __exit__(self, *args):
                                return False

                            def submit(self, fn, item):
                                future = concurrent.futures.Future()
                                future.set_result(fn(item))
                                return future

                            def shutdown(self, wait=True, cancel_futures=False):
                                return None

                        pool.return_value = ImmediateExecutor()
                        result = analyze_repository(repo_dir)

        pool.assert_called_once()
        self.assertEqual(pool.call_args.kwargs["max_workers"], 3)
        self.assertGreaterEqual(result["total_files"], 20)

    def test_repo_batch_watchdog_skips_stuck_workers(self):
        repos = [
            {"name": "stuck", "clone_url": "https://github.com/acme/stuck.git", "size": 1},
        ]

        def slow_repo(*args, **kwargs):
            time.sleep(0.2)
            return None

        with patch("analyzer.REPO_ANALYSIS_TIMEOUT_SECONDS", 0.01):
            with patch("analyzer._analyze_single_repo", side_effect=slow_repo):
                result = analyze_repository_batch("alice", repos)

        self.assertEqual(result["repos_analyzed"], 0)
        self.assertEqual(result["timed_out_repos"], ["stuck"])

    def test_distributed_analysis_uses_peer_batches_and_local_fallback(self):
        repos = [
            {"name": "a", "clone_url": "https://github.com/acme/a.git", "size": 1},
            {"name": "b", "clone_url": "https://github.com/acme/b.git", "size": 2},
        ]
        remote_result = {
            "repo_results": [
                {
                    "file_metrics": [],
                    "language_line_counts": {"Python": 1},
                    "test_file_count": 0,
                    "total_files": 1,
                    "total_assertions": 0,
                    "activity": [0] * 90,
                    "commit_metrics": {},
                }
            ],
            "repos_analyzed": 1,
            "language_stats": {"Python": 1},
        }

        with patch.dict(os.environ, {
            "CODEDNA_ENGINE_PEER_URLS": "http://peer-one:8000",
            "CODEDNA_ENGINE_SELF_URL": "http://self:8000",
        }):
            with patch("analyzer._analyze_remote_batch", return_value=remote_result) as remote:
                with patch("analyzer.analyze_repository_batch", return_value={"repo_results": [], "repos_analyzed": 0, "language_stats": {}}):
                    results = analyze_repositories_distributed("alice", repos)

        remote.assert_called_once()
        self.assertEqual(len(results), 1)

    def test_distributed_analysis_reuses_fast_workers_for_pending_batches(self):
        repos = [
            {"name": "huge", "clone_url": "https://github.com/acme/huge.git", "size": 100},
            {"name": "medium", "clone_url": "https://github.com/acme/medium.git", "size": 50},
            {"name": "small", "clone_url": "https://github.com/acme/small.git", "size": 1},
        ]
        local_result = {"repo_results": [], "repos_analyzed": 0, "language_stats": {}}
        remote_result = {
            "repo_results": [
                {
                    "file_metrics": [],
                    "language_line_counts": {"Python": 1},
                    "test_file_count": 0,
                    "total_files": 1,
                    "total_assertions": 0,
                    "activity": [0] * 90,
                    "commit_metrics": {},
                }
            ],
            "repos_analyzed": 1,
            "language_stats": {"Python": 1},
        }

        with patch.dict(os.environ, {
            "CODEDNA_ENGINE_PEER_URLS": "http://peer-one:8000",
            "CODEDNA_ENGINE_SELF_URL": "http://self:8000",
        }):
            with patch("analyzer._analyze_remote_batch", return_value=remote_result) as remote:
                with patch("analyzer.analyze_repository_batch", return_value=local_result) as local:
                    results = analyze_repositories_distributed("alice", repos)

        self.assertGreaterEqual(remote.call_count + local.call_count, 3)
        self.assertEqual(len(results), remote.call_count)

    def test_developer_classification_boundaries(self):
        scores = {
            "readability": 80,
            "complexity": 75,
            "documentation": 20,
            "test_mindset": 10,
            "commit_discipline": 50,
            "language_depth": 40,
            "refactor_tendency": 45,
            "error_handling": 30,
        }
        dev_type, summary = classify_developer_type(scores)
        self.assertEqual(dev_type, "The Architect")
        self.assertIn("test coverage", summary)


if __name__ == "__main__":
    unittest.main()
