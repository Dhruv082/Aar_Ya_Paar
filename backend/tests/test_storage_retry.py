import requests
import pytest
import sys
from pathlib import Path

sys.path.append(str(Path(__file__).resolve().parents[1]))
import server


# Module: managed storage retry behavior for transient 5xx failures
class _FakeResponse:
    def __init__(self, status_code: int, payload: dict | None = None):
        self.status_code = status_code
        self._payload = payload or {}

    def raise_for_status(self):
        if self.status_code >= 400:
            raise requests.HTTPError(f"HTTP {self.status_code}", response=self)

    def json(self):
        return self._payload


def test_put_pdf_retries_with_new_storage_session_on_5xx(monkeypatch):
    monkeypatch.setattr(server, "EMERGENT_KEY", "test-key")
    monkeypatch.setattr(server, "storage_key", None)

    init_calls = {"count": 0}

    def fake_post(*args, **kwargs):
        init_calls["count"] += 1
        return _FakeResponse(200, {"storage_key": f"key-{init_calls['count']}"})

    put_calls = {"count": 0}

    def fake_put(*args, **kwargs):
        put_calls["count"] += 1
        if put_calls["count"] == 1:
            return _FakeResponse(502)
        return _FakeResponse(200, {"path": "aap-ya-paar/uploads/local/retried.pdf"})

    monkeypatch.setattr(server.requests, "post", fake_post)
    monkeypatch.setattr(server.requests, "put", fake_put)

    result = server.put_pdf("aap-ya-paar/uploads/local/retried.pdf", b"%PDF-1.4")

    assert result["path"] == "aap-ya-paar/uploads/local/retried.pdf"
    assert init_calls["count"] == 2
    assert put_calls["count"] == 2


def test_put_pdf_raises_after_retry_if_second_5xx(monkeypatch):
    monkeypatch.setattr(server, "EMERGENT_KEY", "test-key")
    monkeypatch.setattr(server, "storage_key", None)

    init_calls = {"count": 0}

    def fake_post(*args, **kwargs):
        init_calls["count"] += 1
        return _FakeResponse(200, {"storage_key": f"key-{init_calls['count']}"})

    def fake_put(*args, **kwargs):
        return _FakeResponse(500)

    monkeypatch.setattr(server.requests, "post", fake_post)
    monkeypatch.setattr(server.requests, "put", fake_put)

    with pytest.raises(requests.HTTPError):
        server.put_pdf("aap-ya-paar/uploads/local/still-fails.pdf", b"%PDF-1.4")

    assert init_calls["count"] == 2
