"""The Skillwire Dispatch API — live news + repos for the frontend.

Endpoints (all cached in-memory):
  GET /api/health
  GET /api/articles?limit=
  GET /api/repos/search?section=<id>|q=<text>&per_page=
  GET /api/repos/{owner}/{repo}      → repo + readme_paras

Server-only secrets (optional): GITHUB_TOKEN (raises GitHub limits),
NEWS_API_KEY (adds NewsAPI), ALLOWED_ORIGINS (CORS allowlist). Nothing reaches
the browser — the frontend just calls these endpoints.
"""
import os
from typing import List, Optional

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

import sources
from cache import get_or_set
from models import Article, Repo, RepoDetail

load_dotenv()

app = FastAPI(title="The Skillwire Dispatch API")

_DEFAULT_ORIGINS = [
    "https://owenhong0.github.io",
    "http://localhost:5173",
    "http://localhost:4173",
]
_env_origins = [o.strip() for o in os.environ.get("ALLOWED_ORIGINS", "").split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=_env_origins or _DEFAULT_ORIGINS,
    allow_methods=["GET"],
    allow_headers=["*"],
)

REPO_TTL = 600   # 10 min
NEWS_TTL = 1200  # 20 min


@app.get("/api/health")
async def health():
    return {"ok": True}


@app.get("/api/articles", response_model=List[Article])
async def articles(limit: int = Query(12, ge=1, le=40)):
    return await get_or_set(f"articles:{limit}", NEWS_TTL, lambda: sources.aggregate_articles(limit))


@app.get("/api/repos/search", response_model=List[Repo])
async def repos_search(
    section: Optional[str] = None,
    q: Optional[str] = None,
    per_page: int = Query(9, ge=1, le=30),
):
    query = sources.SECTIONS.get(section) if section else None
    query = query or q
    if not query:
        raise HTTPException(status_code=400, detail="provide a `section` or `q`")
    key = f"search:{query}:{per_page}"
    try:
        return await get_or_set(key, REPO_TTL, lambda: sources.search_github(query, per_page))
    except sources.RateLimited:
        raise HTTPException(status_code=429, detail="GitHub rate limit reached; try again shortly")


@app.get("/api/repos/{owner}/{repo}", response_model=RepoDetail)
async def repo_detail(owner: str, repo: str):
    key = f"repo:{owner}/{repo}"
    try:
        return await get_or_set(key, REPO_TTL, lambda: sources.get_github_repo(owner, repo))
    except sources.NotFound:
        raise HTTPException(status_code=404, detail="repository not found")
    except sources.RateLimited:
        raise HTTPException(status_code=429, detail="GitHub rate limit reached; try again shortly")
