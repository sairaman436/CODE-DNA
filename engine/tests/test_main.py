import asyncio
import os
import sys
import unittest

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


if __name__ == "__main__":
    unittest.main()
