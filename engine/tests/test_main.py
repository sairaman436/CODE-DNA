import asyncio
import os
import pickle
import sys
import unittest
from concurrent.futures import ThreadPoolExecutor

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

import main  # noqa: E402


class EngineProductionGuardTests(unittest.TestCase):
    def test_webhook_headers_include_secret_only_when_configured(self):
        previous = os.environ.get("WEBHOOK_SECRET")
        try:
            os.environ.pop("WEBHOOK_SECRET", None)
            self.assertEqual(main.webhook_headers(), {})

            os.environ["WEBHOOK_SECRET"] = "prod-secret"
            self.assertEqual(main.webhook_headers(), {"x-webhook-secret": "prod-secret"})
        finally:
            if previous is None:
                os.environ.pop("WEBHOOK_SECRET", None)
            else:
                os.environ["WEBHOOK_SECRET"] = previous

    def test_job_slot_reservation_rejects_overload_and_releases(self):
        async def scenario():
            original_limit = main.ENGINE_QUEUE_LIMIT
            original_active = main.active_jobs
            try:
                main.ENGINE_QUEUE_LIMIT = 1
                main.active_jobs = 0

                self.assertTrue(await main.reserve_job_slot())
                self.assertFalse(await main.reserve_job_slot())

                await main.release_job_slot()
                self.assertEqual(main.active_jobs, 0)
                self.assertTrue(await main.reserve_job_slot())
            finally:
                main.ENGINE_QUEUE_LIMIT = original_limit
                main.active_jobs = original_active

        asyncio.run(scenario())

    def test_batch_analysis_worker_function_is_pickleable(self):
        payload = {
            "username": "alice",
            "repositories": [],
            "access_token": None,
        }

        pickle.dumps((main.run_batch_analysis_task, payload))
        result = main.run_batch_analysis_task(payload)
        self.assertEqual(result["repo_results"], [])
        self.assertEqual(result["repos_analyzed"], 0)

    def test_engine_uses_thread_pool_for_io_bound_analysis(self):
        self.assertIsInstance(main.executor, ThreadPoolExecutor)
        self.assertEqual(main.health_check.__name__, "health_check")


if __name__ == "__main__":
    unittest.main()
