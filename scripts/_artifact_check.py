import json
import urllib.request

from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1280, "height": 900})
    logs = []
    page.on("console", lambda m: logs.append(f"{m.type}: {m.text}"))
    page.on("pageerror", lambda e: logs.append(f"PAGEERROR: {e}"))

    with urllib.request.urlopen("http://localhost:5252/api/resume") as resp:
        listing = json.load(resp)
    slug = listing["cvs"][0]["slug"]
    page.goto(f"http://localhost:5252/resumes/{slug}/edit")
    page.wait_for_load_state("networkidle")
    page.wait_for_timeout(1200)

    page.screenshot(path="/tmp/opencode/tailor_idle.png", full_page=True)
    print("hasUrlInput:", len(page.get_by_placeholder("Paste a job-ad URL").all()))
    print(
        "analyzeBtn:",
        len(page.get_by_role("button", name="Analyze").all()),
    )
    print("headings:", page.get_by_role("heading").all_inner_texts()[:4])
    body_text = page.inner_text("body")
    print("hasPanel:", "Tailor for job" in body_text)
    print("hasStepper:", "Reading job ad" in body_text)
    print("---console---")
    for l in logs[:25]:
        print(l)
    browser.close()