from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI(title="Code DNA Analysis Engine")

class AnalysisRequest(BaseModel):
    github_username: str
    job_id: str

@app.get("/health")
def health_check():
    return {"status": "ok", "service": "analysis-engine"}

@app.post("/analyze")
def analyze_code(request: AnalysisRequest):
    # This will handle the AST parsing and ML inference later
    return {"status": "started", "job_id": request.job_id, "username": request.github_username}
