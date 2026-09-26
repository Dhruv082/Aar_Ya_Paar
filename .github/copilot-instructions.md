# Copilot instructions for Aar Ya Paar

## Repository shape

This repository contains two independently runnable applications:

- `frontend/` is an Expo Router app targeting Android, iOS, and web.
- `backend/` is a FastAPI service. Its main product endpoint parses an uploaded study-plan PDF and stores the source file; optional status endpoints use MongoDB.

Keep frontend and backend changes coordinated around the PDF import contract at `POST /api/plans/import-pdf`.

## Build, run, lint, and test

### Frontend

Run commands from `frontend/` (or use the equivalent `npm --prefix frontend ...` form from the repository root):

```powershell
npm install
npx expo start
npx expo start --android
npx expo start --ios
npx expo start --web
npm run lint
```

The frontend uses Yarn 1 according to `package.json`, but the checked-in lockfile and README also support `npm install`; preserve the existing package manager/lockfile choice when changing dependencies.

Configure `frontend/.env` from `.env.example` with `EXPO_PUBLIC_BACKEND_URL`. A physical device must use the computer's LAN IP, not `localhost`; an Android emulator uses `http://10.0.2.2:8000`.

### Backend

Run commands from `backend/`:

```powershell
pip install -r requirements.txt
uvicorn server:app --host 0.0.0.0 --port 8000
pytest
pytest tests/test_pdf_import_plan.py
pytest tests/test_pdf_import_plan.py::test_import_pdf_response_shape
```

`backend/pytest.ini` intentionally adds `-n 2 --dist loadscope`; do not remove or override those `addopts`. Use `-n 0` for a serial run when needed. The PDF integration tests require the backend to be running, `EXPO_PUBLIC_BACKEND_URL` to point to it, and the supplied fixture path expected by the test environment.

The repository also contains `tests/curriculum_static_check.py`, a static curriculum/scheduler consistency check. It currently uses `/app/...` absolute paths, so treat it as an environment-specific check unless those paths exist.

## Architecture

- `frontend/app/` contains file-based Expo Router screens. The `(tabs)` group is the main Today, Schedule, Progress, and Settings shell; `plans.tsx` manages the plan library; `import-plan.tsx` handles PDF review and save.
- `frontend/src/app-context.tsx` is the application store/provider. It loads and migrates persisted data, exposes plan/progress actions, persists through the storage abstraction, and gates native notifications.
- `frontend/src/scheduler.ts` is the domain engine. It defines planner state, expands the immutable `STUDY_PLAN` into ordered tasks, builds schedules from capacity and overrides, and provides rescheduling/restoration helpers. Keep scheduling logic here rather than in screens.
- `frontend/src/curriculum.ts` is the canonical ordered curriculum. Task order, sprint/day metadata, and estimated minutes are product data, not disposable seed data.
- `frontend/src/plan-types.ts` separates imported drafts and saved plans from the active planner state. Imported plans receive their own task IDs and progress history.
- `frontend/src/import-api.ts` adapts the backend response to frontend types. Web uploads use `fetch`/`FormData`; native uploads use Expo FileSystem multipart upload because URI handling differs on devices.
- `frontend/src/utils/storage/` provides the shared persistence API. Native storage uses AsyncStorage plus SecureStore helpers; web uses AsyncStorage-backed equivalents.
- `backend/server.py` owns PDF validation, parsing, row-level issue reporting, and source storage. Parsing is synchronous work dispatched through `run_in_threadpool`; managed object storage is optional and falls back to local `backend/uploads/` when no integration key is configured.

## Repository-specific conventions

- Use the `@/` TypeScript alias for frontend imports and keep shared domain behavior in `frontend/src/`, not duplicated across route components.
- Treat `STUDY_PLAN` ordering as immutable. Scheduler task IDs encode sprint/day/task position, and migrations preserve completion by matching old task titles when the curriculum version changes.
- Persist the whole `PlannerStore` under the current v2 key. Use the storage singleton rather than constructing a new storage implementation, and preserve the legacy-state migration path when changing persisted shapes.
- Recalculate schedules through `buildSchedule`, `rescheduleFrom`, or `restoreUnavailableDay`; do not hand-edit schedule arrays in UI code. Completed entries and dates before a reschedule boundary are intentionally locked.
- Dates are represented as local `YYYY-MM-DD` keys through `dateKey`/`dateFromKey`; use those helpers instead of ISO string slicing or UTC arithmetic.
- Imported plans must remain separate from the built-in curriculum, retain `sourceFilename`/`sourcePath`, and be activated through the plan library without overwriting another plan's progress.
- Keep the PDF API response fields compatible with `PdfImportResult` and `ImportedPlanDraft`: `source_filename`, `source_path`, `suggested_name`, `tasks`, `issues`, and `total_minutes`. Invalid extensions, unreadable PDFs, oversized files, and storage failures should remain explicit HTTP errors.
- Preserve test IDs used by UI automation, especially onboarding controls, `active-plan-switcher`, plan-library/import controls, and import review/save controls.
- Keep platform branches explicit for web versus native behavior. Do not replace native multipart upload with browser-style `FormData` without validating on a real Expo device.
- Keep environment-specific values out of source. Use `frontend/.env` for the backend URL and backend `.env` for optional `MONGO_URL`, `DB_NAME`, `EMERGENT_LLM_KEY`, and storage integration settings.
