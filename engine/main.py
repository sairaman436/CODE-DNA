"""
CodeDNA Python Engine — FastAPI Entry Point
Receives analysis jobs from Node.js, runs real AST analysis, sends results back via webhook.
"""

from fastapi import FastAPI, BackgroundTasks, HTTPException
from pydantic import BaseModel
import requests
import logging
import time
import os
import asyncio
from typing import List, Optional
from concurrent.futures import ProcessPoolExecutor
from functools import partial

from analyzer import perform_full_analysis

app = FastAPI(title="CodeDNA Analysis Engine", version="1.0.0")
logging.basicConfig(level=logging.INFO, format='%(asctime)s %(levelname)s %(message)s')

NODE_BACKEND_URL = "http://localhost:5000"

# ─── Industrial Scalability: Parallel Processing Pool ───
# We use a ProcessPoolExecutor to handle CPU-bound AST analysis across all available cores.
# This ensures that one user's analysis doesn't block another's.
executor = ProcessPoolExecutor(max_workers=os.cpu_count() or 4)

class Repository(BaseModel):
    name: str
    clone_url: str
    language: Optional[str] = None
    default_branch: Optional[str] = None

class AnalysisRequest(BaseModel):
    jobId: str
    userId: str
    username: str
    repositories: List[Repository] = []
    access_token: Optional[str] = None

def update_job_progress(job_id: str, progress: int, step: str):
    """Update the analysis job status in Node.js backend."""
    try:
        logging.info(f"Progress: {progress}% - {step}")
        requests.post(
            f"{NODE_BACKEND_URL}/api/webhook/progress",
            json={"jobId": job_id, "progress": progress, "step": step},
            timeout=5
        )
    except Exception as e:
        logging.error(f"Failed to update progress: {e}")

def run_analysis_task(request_data: dict):
    """
    Synchronous wrapper for the analysis task, suitable for ProcessPoolExecutor.
    Note: Inside a separate process, we don't share the main thread's memory.
    """
    job_id = request_data['jobId']
    user_id = request_data['userId']
    username = request_data['username']
    repositories = request_data['repositories']
    access_token = request_data.get('access_token')

    start_time = time.time()
    logging.info(f"Starting parallel analysis for @{username} (Job: {job_id})")

    try:
        # Run the real analysis pipeline
        results = perform_full_analysis(
            username, 
            repositories, 
            progress_callback=lambda p, s: update_job_progress(job_id, p, s),
            access_token=access_token
        )

        elapsed = round(time.time() - start_time, 1)
        logging.info(f"Parallel analysis completed for @{username} in {elapsed}s")

        # Send results back to Node.js Orchestrator
        payload = {
            "jobId": job_id,
            "userId": user_id,
            "results": results
        }

        requests.post(
            f"{NODE_BACKEND_URL}/api/webhook/results",
            json=payload,
            timeout=30
        )

    except Exception as e:
        logging.error(f"Parallel analysis failed for @{username}: {str(e)}")
        try:
            requests.post(
                f"{NODE_BACKEND_URL}/api/webhook/results",
                json={
                    "jobId": job_id,
                    "userId": user_id,
                    "results": {
                        "scores": {k: 0 for k in [
                            'readability', 'complexity', 'documentation', 'test_mindset',
                            'commit_discipline', 'language_depth', 'refactor_tendency', 'error_handling'
                        ]},
                        "developer_type": "Unknown",
                        "personality_summary": f"Analysis Error: {str(e)}",
                        "strengths": [],
                        "growth_areas": [],
                    }
                },
                timeout=10
            )
        except: pass

@app.post("/analyze")
async def start_analysis(request: AnalysisRequest):
    """Accepts repositories and dispatches them to the Parallel Process Pool."""
    if not request.jobId or not request.userId:
        raise HTTPException(status_code=400, detail="Missing required fields")

    # We convert to dict because Pydantic models aren't always pickleable for multiprocessing
    request_data = {
        'jobId': request.jobId,
        'userId': request.userId,
        'username': request.username,
        'repositories': [r.dict() for r in request.repositories],
        'access_token': request.access_token
    }

    # Dispatch to the Process Pool (Non-blocking for the API thread)
    loop = asyncio.get_event_loop()
    loop.run_in_executor(executor, run_analysis_task, request_data)

    return {"message": "Analysis dispatched to parallel worker pool", "jobId": request.jobId}

@app.get("/health")
async def health_check():
    return {
        "status": "ok", 
        "service": "codedna-python-engine", 
        "concurrency": "ProcessPoolExecutor",
        "cores_active": os.cpu_count() or 4
    }
