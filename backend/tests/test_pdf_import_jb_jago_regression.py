import os
from typing import Any

import pytest
import requests
from dotenv import dotenv_values


# Module: exact customer-supplied JB Jago PDF import regression
PDF_URL = "https://customer-assets-m6fa6gv7.emergentagent.net/job_emergent-code-sync/artifacts/ea3fmurg_JB%20Jago%20JB%20Savera%20-%20Complete%20Plan.pdf"
BASE_URL = os.environ.get("EXPO_PUBLIC_BACKEND_URL")

if not BASE_URL:
    frontend_env = dotenv_values("/app/frontend/.env")
    BASE_URL = frontend_env.get("EXPO_BACKEND_URL") or frontend_env.get("EXPO_PUBLIC_BACKEND_URL")


@pytest.fixture(scope="session")
def imported_payload() -> dict[str, Any]:
    if not BASE_URL:
        pytest.fail("Missing frontend/backend public base URL")

    fixture_response = requests.get(PDF_URL, timeout=180)
    assert fixture_response.status_code == 200, f"Failed to fetch supplied fixture: {fixture_response.status_code}"
    assert fixture_response.content, "Supplied fixture is empty"

    files = {"file": ("JB Jago JB Savera - Complete Plan.pdf", fixture_response.content, "application/pdf")}
    response = requests.post(f"{BASE_URL.rstrip('/')}/api/plans/import-pdf", files=files, timeout=240)

    assert response.status_code == 200, f"Unexpected status: {response.status_code}, body={response.text[:400]}"
    payload = response.json()
    assert isinstance(payload, dict)
    return payload


def test_import_supplied_pdf_returns_non_empty_tasks(imported_payload: dict[str, Any]):
    tasks = imported_payload.get("tasks", [])
    assert isinstance(tasks, list)
    assert len(tasks) > 0


def test_import_supplied_pdf_metadata_and_no_global_issues(imported_payload: dict[str, Any]):
    assert imported_payload.get("source_filename") == "JB Jago JB Savera - Complete Plan.pdf"
    assert imported_payload.get("issues") == []
