import os
from pathlib import Path
from typing import Any

import pytest
import requests
from dotenv import dotenv_values


# Module: PDF import endpoint deterministic parsing validation
PDF_PATH = Path("/app/tests/assets/aap_ya_paar_complete_study_plan.pdf")
BASE_URL = os.environ.get("EXPO_PUBLIC_BACKEND_URL")

if not BASE_URL:
    frontend_env = dotenv_values("/app/frontend/.env")
    BASE_URL = frontend_env.get("EXPO_BACKEND_URL") or frontend_env.get("EXPO_PUBLIC_BACKEND_URL")


@pytest.fixture(scope="session")
def imported_payload() -> dict[str, Any]:
    if not BASE_URL:
        pytest.fail("Missing EXPO_PUBLIC_BACKEND_URL environment variable")

    assert PDF_PATH.exists(), f"Missing supplied test PDF at {PDF_PATH}"
    pdf_content = PDF_PATH.read_bytes()
    assert pdf_content, "Supplied test PDF is empty"

    files = {"file": (PDF_PATH.name, pdf_content, "application/pdf")}
    response = requests.post(f"{BASE_URL.rstrip('/')}/api/plans/import-pdf", files=files, timeout=180)

    assert response.status_code == 200, f"Unexpected status: {response.status_code}, body={response.text[:400]}"
    payload = response.json()
    assert isinstance(payload, dict)
    return payload


def test_import_pdf_response_shape(imported_payload: dict[str, Any]):
    assert imported_payload.get("source_filename")
    source_path = imported_payload.get("source_path")
    assert isinstance(source_path, str) and source_path
    assert not source_path.startswith("http"), "source_path should remain private, not public URL"
    assert source_path.startswith("aap-ya-paar/uploads/local/")


def test_import_pdf_expected_task_count_and_issues(imported_payload: dict[str, Any]):
    tasks = imported_payload.get("tasks", [])
    issues = imported_payload.get("issues", [])
    assert len(tasks) == 250
    assert issues == []


def test_import_pdf_specific_rows(imported_payload: dict[str, Any]):
    tasks = imported_payload.get("tasks", [])

    def find_task(title: str):
        for task in tasks:
            if (task.get("title") or "").strip() == title:
                return task
        return None

    design = find_task("Task Management System Design")
    assert design is not None
    assert design.get("sprint") == 8
    assert design.get("day") == 2
    assert design.get("minutes") == 51

    code = find_task("Task Management System Code")
    assert code is not None
    assert code.get("sprint") == 8
    assert code.get("day") == 3
    assert code.get("minutes") == 22
