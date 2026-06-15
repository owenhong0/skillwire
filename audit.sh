#!/bin/bash
# audit.sh — Skillwire site audit pipeline
# Usage: ./audit.sh [url]
# Requires: curl, node, lighthouse (npm i -g lighthouse)

URL=${1:-"https://owenhong0.github.io/skillwire/"}
REPORT_DIR="./audit-reports/$(date +%Y-%m-%d)"
mkdir -p $REPORT_DIR

echo "=== Skillwire Audit Pipeline ==="
echo "Target: $URL"
echo ""

# Agent 1 — Lighthouse (performance, accessibility, best practices)
echo "[1/4] Running Lighthouse..."
lighthouse $URL \
  --output json \
  --output-path $REPORT_DIR/lighthouse.json \
  --chrome-flags="--headless" \
  --quiet

node -e "
const r = require('./$REPORT_DIR/lighthouse.json');
const cats = r.categories;
console.log('  Performance:   ' + Math.round(cats.performance.score * 100));
console.log('  Accessibility: ' + Math.round(cats.accessibility.score * 100));
console.log('  Best practices:' + Math.round(cats['best-practices'].score * 100));
console.log('  SEO:           ' + Math.round(cats.seo.score * 100));
"

# Agent 2 — Backend cold start timing
echo ""
echo "[2/4] Testing backend cold start..."
BACKEND="https://skillwire.onrender.com"
START=$(date +%s%3N)
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BACKEND/api/health")
END=$(date +%s%3N)
echo "  Status: $STATUS"
echo "  Response time: $((END - START))ms"

# Agent 3 — Search pipeline smoke test
# NOTE: the backend is REST JSON, not a POST /api/search NDJSON stream. This hits
# the real endpoint (GET /api/repos/search → Card[]) and summarizes the result.
echo ""
echo "[3/4] Running search pipeline test..."
curl -s "$BACKEND/api/repos/search?q=Claude%20MCP%20tools&per_page=3" \
  --max-time 90 \
  | node -e "
let d='';
process.stdin.on('data', c => d += c).on('end', () => {
  try {
    const a = JSON.parse(d);
    console.log('  cards: ' + a.length);
    a.slice(0, 3).forEach(c => console.log('  - [' + c.score + '] ' + c.trust + ' · ' + c.title));
  } catch (e) { console.log('  (unexpected response: ' + d.slice(0, 80) + ')'); }
});
"

# Agent 4 — Mobile viewport check via curl headers
echo ""
echo "[4/4] Checking page metadata..."
curl -s $URL | grep -E "(title|description|viewport)" | head -5

echo ""
echo "=== Done. Full report saved to $REPORT_DIR ==="
echo "Run again after fixes to compare scores."