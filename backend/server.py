from fastapi import FastAPI, APIRouter, File, HTTPException, UploadFile
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import Any, List
import uuid
from datetime import datetime, timezone
import io
import re
import requests
from fastapi.concurrency import run_in_threadpool
from pypdf import PdfReader


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB is only needed by the optional status endpoints. Keeping it optional
# lets the PDF importer run locally without a database.
mongo_url = os.environ.get("MONGO_URL")
db_name = os.environ.get("DB_NAME")
client = AsyncIOMotorClient(mongo_url) if mongo_url else None
db = client[db_name] if client and db_name else None
APP_NAME = "aap-ya-paar"
STORAGE_BASE = (os.environ.get("INTEGRATION_PROXY_URL") or "").strip() or "https://integrations.emergentagent.com"
STORAGE_URL = STORAGE_BASE.rstrip("/") + "/objstore/api/v1/storage"
EMERGENT_KEY = os.environ.get("EMERGENT_LLM_KEY")
storage_key: str | None = None
MAX_UPLOAD_BYTES = 15 * 1024 * 1024

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# Define Models
class StatusCheck(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class StatusCheckCreate(BaseModel):
    client_name: str

class ParsedTask(BaseModel):
    row_id: str
    sprint: int | None = None
    day: int | None = None
    title: str = ""
    minutes: int | None = None
    issues: List[str] = Field(default_factory=list)

class PdfImportResult(BaseModel):
    source_filename: str
    source_path: str
    suggested_name: str
    tasks: List[ParsedTask]
    issues: List[str]
    total_minutes: int

def init_storage() -> str:
    global storage_key
    if storage_key:
        return storage_key
    if not EMERGENT_KEY:
        raise RuntimeError("Managed storage is not configured")
    response = requests.post(f"{STORAGE_URL}/init", json={"emergent_key": EMERGENT_KEY}, timeout=30)
    response.raise_for_status()
    storage_key = response.json()["storage_key"]
    return storage_key

def put_pdf(path: str, content: bytes) -> dict[str, Any]:
    if not EMERGENT_KEY:
        local_path = ROOT_DIR / "uploads" / Path(path).name
        local_path.parent.mkdir(parents=True, exist_ok=True)
        local_path.write_bytes(content)
        return {"path": str(local_path)}
    key = init_storage()
    response = requests.put(f"{STORAGE_URL}/objects/{path}", headers={"X-Storage-Key": key, "Content-Type": "application/pdf"}, data=content, timeout=120)
    if response.status_code == 503:
        global storage_key
        storage_key = None
        key = init_storage()
        response = requests.put(f"{STORAGE_URL}/objects/{path}", headers={"X-Storage-Key": key, "Content-Type": "application/pdf"}, data=content, timeout=120)
    response.raise_for_status()
    return response.json()

def duration_to_minutes(raw: str) -> int | None:
    value = raw.strip().lower().replace("mins", "min")
    hour_match = re.fullmatch(r"(?:(\d+)\s*h(?:\s*(\d+)\s*m(?:in)?)?)|(\d+)\s*m(?:in)?", value)
    if not hour_match:
        return None
    if hour_match.group(3):
        return int(hour_match.group(3))
    return int(hour_match.group(1) or 0) * 60 + int(hour_match.group(2) or 0)

def parse_study_plan(content: bytes, filename: str) -> PdfImportResult:
    try:
        reader = PdfReader(io.BytesIO(content))
    except Exception as exc:
        raise ValueError("The selected file could not be read as a PDF.") from exc
    tasks: list[ParsedTask] = []
    issues: list[str] = []
    sprint: int | None = None
    day: int | None = None
    saw_table_header = False
    seen_rows: set[tuple[int | None, int | None, str]] = set()
    pending_title: str | None = None
    for page_index, page in enumerate(reader.pages, start=1):
        text = page.extract_text() or ""
        if re.search(r"Task\s+Estimated\s+Time", text, re.I):
            saw_table_header = True
        for raw_line in text.splitlines():
            line = re.sub(r"\s+", " ", raw_line).strip()
            sprint_match = re.match(r"^Sprint\s+(\d+)\b", line, re.I)
            day_match = re.match(r"^Day\s+(\d+)\b", line, re.I)
            if sprint_match:
                sprint, day = int(sprint_match.group(1)), None
                pending_title = None
                continue
            if day_match:
                day = int(day_match.group(1))
                pending_title = None
                continue
            if not line or re.match(r"^(Task\s+Estimated\s+Time|Estimated Time|Aap Ya Paar|Complete 9 Sprint|Generated )", line, re.I):
                continue
            if re.fullmatch(r"\d+\s*h(?:\s*\d+\s*m(?:in)?)?|\d+\s*m(?:in)?", line, re.I) and pending_title:
                title, minutes = pending_title, duration_to_minutes(line)
                pending_title = None
            else:
                time_match = re.match(r"^(?P<title>.+?)\s+(?P<time>\d+\s*h(?:\s*\d+\s*m(?:in)?)?|\d+\s*m(?:in)?)$", line, re.I)
                if not time_match:
                    if sprint is not None and day is not None and re.search(r"[A-Za-z]", line):
                        pending_title = line.strip(" |")
                    continue
                title = time_match.group("title").strip(" |")
                minutes = duration_to_minutes(time_match.group("time"))
                pending_title = None
            row_issues: list[str] = []
            if sprint is None: row_issues.append("Missing Sprint heading")
            if day is None: row_issues.append("Missing Day heading")
            if not title: row_issues.append("Missing task title")
            if minutes is None or minutes <= 0: row_issues.append("Unrecognized estimated time")
            key = (sprint, day, title.casefold())
            if key in seen_rows: row_issues.append("Duplicate task row")
            seen_rows.add(key)
            tasks.append(ParsedTask(row_id=f"p{page_index}-r{len(tasks)+1}", sprint=sprint, day=day, title=title, minutes=minutes, issues=row_issues))
    if not saw_table_header:
        issues.append("Expected ‘Task / Estimated Time’ table headings were not found.")
    if not tasks:
        issues.append("No task rows with recognized durations were found.")
    if any(task.issues for task in tasks):
        issues.append("Some rows need review before this plan can be saved.")
    suggested_name = re.sub(r"\.[Pp][Dd][Ff]$", "", filename).replace("_", " ").strip() or "Imported study plan"
    return PdfImportResult(source_filename=filename, source_path="", suggested_name=suggested_name, tasks=tasks, issues=issues, total_minutes=sum(task.minutes or 0 for task in tasks))

# Add your routes to the router instead of directly to app
@api_router.get("/")
async def root():
    return {"message": "Hello World"}

@api_router.post("/plans/import-pdf", response_model=PdfImportResult)
async def import_plan_pdf(file: UploadFile = File(...)):
    filename = file.filename or "study-plan.pdf"
    if not filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Choose a PDF file.")
    content = await file.read()
    if not content or len(content) > MAX_UPLOAD_BYTES:
        raise HTTPException(status_code=400, detail="PDF must be between 1 byte and 15 MB.")
    try:
        parsed = await run_in_threadpool(parse_study_plan, content, filename)
        path = f"{APP_NAME}/uploads/local/{uuid.uuid4()}.pdf"
        await run_in_threadpool(put_pdf, path, content)
        parsed.source_path = path
        return parsed
    except requests.HTTPError as exc:
        status = exc.response.status_code if exc.response is not None else 502
        if status == 402:
            raise HTTPException(status_code=402, detail="Storage is temporarily unavailable for uploads.") from exc
        raise HTTPException(status_code=502, detail="The PDF could not be securely stored.") from exc
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc

@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    if db is None:
        raise HTTPException(status_code=503, detail="Database is not configured.")
    status_dict = input.dict()
    status_obj = StatusCheck(**status_dict)
    _ = await db.status_checks.insert_one(status_obj.dict())
    return status_obj

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    if db is None:
        raise HTTPException(status_code=503, detail="Database is not configured.")
    status_checks = await db.status_checks.find().to_list(1000)
    return [StatusCheck(**status_check) for status_check in status_checks]

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    if client:
        client.close()
