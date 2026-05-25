import os
import tempfile
import sys
import unittest
from unittest.mock import patch

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from analyzer import (  # noqa: E402
    analyze_file_generic,
    analyze_python_ast,
    classify_developer_type,
    clone_repo,
    compute_scores,
    detect_language,
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
