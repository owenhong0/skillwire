"""Pydantic response models for The Skillwire Dispatch API.

The Repo shape mirrors frontend/src/types.ts exactly so the backend is a
drop-in data source for the existing TypeScript types.
"""
from typing import List, Optional

from pydantic import BaseModel


class Owner(BaseModel):
    login: str


class License(BaseModel):
    spdx_id: Optional[str] = None


class Repo(BaseModel):
    full_name: str
    name: str
    description: Optional[str] = None
    stargazers_count: int = 0
    pushed_at: Optional[str] = None
    language: Optional[str] = None
    topics: List[str] = []
    open_issues_count: int = 0
    owner: Optional[Owner] = None
    html_url: str
    homepage: Optional[str] = None
    license: Optional[License] = None


class RepoDetail(Repo):
    # README excerpt (1-2 cleaned paragraphs), filled by the detail endpoint.
    readme_paras: List[str] = []


class Article(BaseModel):
    id: str
    title: str
    url: str
    source: str
    author: Optional[str] = None
    score: Optional[int] = None
    comments: Optional[int] = None
    published_at: Optional[str] = None  # ISO 8601 when known
    summary: Optional[str] = None
