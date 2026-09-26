import os

import pytest
import requests
from dotenv import dotenv_values


# Module: API proxy root and PDF import failure-path validation
BASE_URL = os.environ.get("EXPO_PUBLIC_BACKEND_URL")
if not BASE_URL:
    frontend_env = dotenv_values("/app/frontend/.env")
    BASE_URL = frontend_env.get("EXPO_BACKEND_URL") or frontend_env.get("EXPO_PUBLIC_BACKEND_URL")


@pytest.fixture(scope="session")
def api_base_url() -> str:
    if not BASE_URL:
        pytest.fail("Missing EXPO_PUBLIC_BACKEND_URL / EXPO_BACKEND_URL")
    return BASE_URL.rstrip("/")


def test_api_root_reachable_via_frontend_proxy(api_base_url: str):
    response = requests.get(f"{api_base_url}/api/", timeout=30)
    assert response.status_code == 200
    payload = response.json()
    assert payload == {"message": "Hello World"}


def test_pdf_import_without_file_returns_validation_error(api_base_url: str):
    response = requests.post(f"{api_base_url}/api/plans/import-pdf", timeout=30)
    assert response.status_code == 422
    payload = response.json()
    assert isinstance(payload, dict)
    assert payload.get("detail")


def test_pdf_import_rejects_non_pdf(api_base_url: str):
    files = {"file": ("not_a_pdf.txt", b"hello", "text/plain")}
    response = requests.post(f"{api_base_url}/api/plans/import-pdf", files=files, timeout=30)
    assert response.status_code == 400
    payload = response.json()
    assert payload.get("detail") == "Choose a PDF file."
