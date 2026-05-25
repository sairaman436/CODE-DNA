"""
CodeDNA Python Engine — FastAPI Entry Point
Receives analysis jobs from Node.js, runs real AST analysis, sends results back via webhook.
"""

from fastapi import FastAPI, BackgroundTasks, HTTPException, Request
from pydantic import BaseModel
import requests
import logging
import time
import os
import asyncio
from typing import List, Optional
from concurrent.futures import ThreadPoolExecutor
from functools import partial

import analyzer
from analyzer import analyze_repository_batch, perform_full_analysis

app = FastAPI(title="CodeDNA Analysis Engine", version="1.0.0")
logging.basicConfig(level=logging.INFO, format='%(asctime)s %(levelname)s %(message)s')

NODE_BACKEND_URL = "http://localhost:5000"

# ─── Industrial Scalability: Parallel Processing Pool ───
# Keep analysis jobs isolated without process-spawn overhead. Repository
# analysis is dominated by git/network/disk I/O, so threads are faster and
# quieter on Windows than process workers.
ENGINE_WORKERS = int(os.getenv("CODEDNA_ENGINE_WORKERS", "2"))
ENGINE_QUEUE_LIMIT = int(os.getenv("CODEDNA_ENGINE_QUEUE_LIMIT", str(ENGINE_WORKERS * 4)))
executor = ThreadPoolExecutor(max_workers=ENGINE_WORKERS)
active_jobs = 0
active_jobs_lock = asyncio.Lock()

class Repository(BaseModel):
    name: str
    clone_url: str
    language: Optional[str] = None
    default_branch: Optional[str] = None
    size: Optional[int] = None

class AnalysisRequest(BaseModel):
    jobId: str
    userId: str
    username: str
    repositories: List[Repository] = []
    access_token: Optional[str] = None

class BatchAnalysisRequest(BaseModel):
    username: str
    repositories: List[Repository] = []
    access_token: Optional[str] = None

def webhook_headers():
    headers = {}
    secret = os.getenv("WEBHOOK_SECRET")
    if secret:
        headers["x-webhook-secret"] = secret
    return headers

def verify_internal_secret(request: Request):
    secret = os.getenv("WEBHOOK_SECRET")
    if not secret:
        return
    if request.headers.get("x-webhook-secret") != secret:
        raise HTTPException(status_code=401, detail="Unauthorized engine request")

async def reserve_job_slot() -> bool:
    global active_jobs
    async with active_jobs_lock:
        if active_jobs >= ENGINE_QUEUE_LIMIT:
            return False
        active_jobs += 1
        return True

async def release_job_slot():
    global active_jobs
    async with active_jobs_lock:
        active_jobs = max(0, active_jobs - 1)

def update_job_progress(job_id: str, progress: int, step: str):
    """Update the analysis job status in Node.js backend."""
    try:
        logging.info(f"Progress: {progress}% - {step}")
        requests.post(
            f"{NODE_BACKEND_URL}/api/webhook/progress",
            json={"jobId": job_id, "progress": progress, "step": step},
            headers=webhook_headers(),
            timeout=5
        )
    except Exception as e:
        logging.error(f"Failed to update progress: {e}")

def run_analysis_task(request_data: dict):
    """
    Synchronous wrapper for the analysis task, suitable for ThreadPoolExecutor.
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
            headers=webhook_headers(),
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
                headers=webhook_headers(),
                timeout=10
            )
        except: pass


def run_batch_analysis_task(request_data: dict):
    return analyze_repository_batch(
        request_data['username'],
        request_data['repositories'],
        request_data.get('access_token')
    )

@app.post("/analyze")
async def start_analysis(request: AnalysisRequest, http_request: Request):
    """Accepts repositories and dispatches them to the Parallel Process Pool."""
    verify_internal_secret(http_request)
    if not request.jobId or not request.userId:
        raise HTTPException(status_code=400, detail="Missing required fields")

    if not await reserve_job_slot():
        raise HTTPException(status_code=503, detail="Analysis engine is busy. Please retry shortly.")

    # Keep worker payload as plain data so it remains executor-agnostic.
    request_data = {
        'jobId': request.jobId,
        'userId': request.userId,
        'username': request.username,
        'repositories': [r.model_dump() for r in request.repositories],
        'access_token': request.access_token
    }

    # Dispatch to the worker pool (non-blocking for the API thread)
    loop = asyncio.get_event_loop()
    future = loop.run_in_executor(executor, run_analysis_task, request_data)
    future.add_done_callback(
        lambda _: loop.call_soon_threadsafe(asyncio.create_task, release_job_slot())
    )

    return {"message": "Analysis dispatched to parallel worker pool", "jobId": request.jobId}

@app.post("/analyze-batch")
async def analyze_batch(request: BatchAnalysisRequest, http_request: Request):
    """Analyze a repo batch for a coordinator engine and return raw results."""
    verify_internal_secret(http_request)
    request_data = {
        'username': request.username,
        'repositories': [r.model_dump() for r in request.repositories],
        'access_token': request.access_token,
    }

    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(
        executor,
        run_batch_analysis_task,
        request_data
    )

@app.get("/health")
async def health_check():
    return {
        "status": "ok", 
        "service": "codedna-python-engine", 
        "concurrency": "ThreadPoolExecutor",
        "workers_active": ENGINE_WORKERS,
        "queue_limit": ENGINE_QUEUE_LIMIT,
        "jobs_in_flight": active_jobs,
        "source_fetch_mode": analyzer.SOURCE_FETCH_MODE,
        "distributed_batch_size": analyzer.DISTRIBUTED_BATCH_SIZE,
        "api_file_fetch_workers": analyzer.API_FILE_FETCH_WORKERS,
        "file_analysis_workers": analyzer.FILE_ANALYSIS_WORKERS,
        "file_analysis_parallel_threshold": analyzer.FILE_ANALYSIS_PARALLEL_THRESHOLD,
        "file_analysis_timeout_seconds": analyzer.FILE_ANALYSIS_TIMEOUT_SECONDS,
        "repo_analysis_timeout_seconds": analyzer.REPO_ANALYSIS_TIMEOUT_SECONDS,
        "peer_batch_timeout_seconds": analyzer.PEER_BATCH_TIMEOUT_SECONDS,
        "max_repo_workers": analyzer.MAX_REPO_WORKERS,
        "cores_available": os.cpu_count() or 4
    }
