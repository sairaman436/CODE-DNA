"""
CodeDNA Python Engine — FastAPI Entry Point
Receives analysis jobs from Node.js, runs real AST analysis, sends results back via webhook.
"""

from fastapi import FastAPI, BackgroundTasks, HTTPException
from pydantic import BaseModel
import requests
import logging
import time
from typing import List, Optional

from analyzer import perform_full_analysis

app = FastAPI(title="CodeDNA Analysis Engine", version="1.0.0")
logging.basicConfig(level=logging.INFO, format='%(asctime)s %(levelname)s %(message)s')

NODE_BACKEND_URL = "http://localhost:5000"


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


def run_analysis_task(request: AnalysisRequest):
    """Background task that performs the actual analysis."""
    start_time = time.time()
    logging.info(f"Starting analysis for @{request.username} (Job: {request.jobId})")
    logging.info(f"   Repositories to analyze: {len(request.repositories)}")

    try:
        # Convert Pydantic models to dicts for the analyzer
        repos = [r.dict() for r in request.repositories]

        # Run the real analysis pipeline with progress feedback
        results = perform_full_analysis(
            request.username, 
            repos, 
            progress_callback=lambda p, s: update_job_progress(request.jobId, p, s),
            access_token=request.access_token
        )

        elapsed = round(time.time() - start_time, 1)
        logging.info(f"Analysis completed for @{request.username} in {elapsed}s")
        logging.info(f"   Type: {results['developer_type']}")
        logging.info(f"   Repos analyzed: {results['repos_analyzed']}")
        logging.info(f"   Files analyzed: {results['total_files_analyzed']}")
        logging.info(f"   Scores: {results['scores']}")

        # Send results back to Node.js Orchestrator
        payload = {
            "jobId": request.jobId,
            "userId": request.userId,
            "results": results
        }

        response = requests.post(
            f"{NODE_BACKEND_URL}/api/webhook/results",
            json=payload,
            timeout=30
        )
        response.raise_for_status()
        logging.info(f"Results delivered to Node.js backend for @{request.username}")

    except Exception as e:
        logging.error(f"Analysis failed for @{request.username}: {str(e)}")
        # Try to mark job as failed
        try:
            requests.post(
                f"{NODE_BACKEND_URL}/api/webhook/results",
                json={
                    "jobId": request.jobId,
                    "userId": request.userId,
                    "results": {
                        "scores": {k: 0 for k in [
                            'readability', 'complexity', 'documentation', 'test_mindset',
                            'commit_discipline', 'language_depth', 'refactor_tendency', 'error_handling'
                        ]},
                        "developer_type": "Unknown",
                        "personality_summary": "Analysis encountered an error. Please try again.",
                        "strengths": [],
                        "growth_areas": [],
                    }
                },
                timeout=10
            )
        except Exception:
            pass


@app.post("/analyze")
async def start_analysis(request: AnalysisRequest, background_tasks: BackgroundTasks):
    """Accepts repositories from Node.js and starts AST analysis in the background."""
    if not request.jobId or not request.userId:
        raise HTTPException(status_code=400, detail="Missing required fields")

    background_tasks.add_task(run_analysis_task, request)
    return {"message": "Analysis started in background", "jobId": request.jobId}


@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "codedna-python-engine", "version": "1.0.0"}
