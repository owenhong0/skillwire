---
name: Feature request
about: Suggest an improvement
title: "[feat] "
labels: enhancement
---

## Problem

What problem are you trying to solve? Who is it for?

## Proposed solution

What should happen?

## Which part of the pipeline does this touch?

<!-- check all that apply -->
- [ ] Frontend (React/Vite — components, search, cards)
- [ ] Sources (`backend/sources.py` — GitHub / Hacker News / RSS / Reddit)
- [ ] Trust (`backend/trust.py` — source verification)
- [ ] Scorer (`backend/scorer.py` — Claude 0–100 scoring)
- [ ] Formatter (`backend/formatter.py` — Claude card copy)

> Note: there is no "Scout" agent — candidate discovery is `sources.py`.

## Alternatives considered

Anything you ruled out, and why.
