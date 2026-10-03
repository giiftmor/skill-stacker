#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

HOST_PORT="${HOST_PORT:-$(grep -E '^HOST_PORT=' .env 2>/dev/null | cut -d= -f2)}"
BASE_URL="http://localhost:${HOST_PORT:-5252}"

python3 - "$BASE_URL" <<'PY'
import json
import sys
import urllib.request

base = sys.argv[1]


def get(path):
    with urllib.request.urlopen(base + path) as r:
        return json.loads(r.read())


try:
    existing = get("/api/resume").get("cvs", [])
except Exception as e:
    sys.exit(f"error: app not reachable at {base} ({e}); start the stack first")

if existing:
    print(f"skip: DB already has {len(existing)} resume(s), not reseeding")
    sys.exit(0)

with open("scripts/sample-cvs.json") as f:
    sample = json.load(f)

for cv in sample:
    req = urllib.request.Request(
        base + "/api/resume",
        data=json.dumps(cv).encode(),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(req) as r:
        res = json.loads(r.read())
    print(f"{cv['personal']['fullName']:20} -> cvId {res['cvId']}  slug {res['slug']}")

print(f"seeded {len(sample)} sample resumes from scripts/sample-cvs.json")
PY