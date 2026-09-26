# Aar Ya Paar — Product Memory

## Problem statement
Keep the current GitHub `main` mobile app synchronized with this workspace and its existing Expo project, preserving the app's complete feature set while applying only required Expo compatibility fixes.

## Architecture
- Expo SDK 57 / React Native frontend with Expo Router bottom navigation and the existing Expo project identity.
- Local-first persistence using the provided AsyncStorage-backed storage helper; no login required for planner flows.
- Pure deterministic scheduling engine in `frontend/src/scheduler.ts` for capacity, missed days, unavailable days, completion, and Study Ahead recalculation.
- Local reminders through `expo-notifications`; JSON backup/restore through the device clipboard.
- FastAPI backend for managed PDF upload and deterministic PDF plan parsing; optional MongoDB status endpoints.

## User personas
- A solo software-engineering learner following a fixed curriculum.
- A time-constrained learner who needs missed days and changing availability handled automatically.
- A plan maintainer who imports structured study-plan PDFs and manages multiple curricula.

## Core requirements (static)
- First-launch onboarding for weekday/weekend capacity and reminder time.
- Bundled 9-sprint curriculum with immutable sequence ordering.
- Today task checklist with planned, completed, and remaining minutes.
- Missed-day handling, future unavailable/freedom days, and Study Ahead.
- Schedule runway, projected finish date, progress metrics, sprint breakdown, settings, local reminders, reset, and backup/restore.
- Offline operation with no account system.
- Preserve GitHub `main` navigation, behavior, visual identity, assets, permissions, and Expo project configuration.

## Implemented 2026-09-25
- Built dark-first amber tactical mobile UI based on `/app/design_guidelines.json`.
- Added onboarding, Today, Schedule, Progress, Settings, curriculum modal, safe-area handling, Android-first touch targets, and stable regression test IDs.
- Added the PDF-aligned 250-task curriculum with immutable sprint/day/source order, local persistence, schedule recalculation, task completion, missed/unavailable day logic, Study Ahead, reminder scheduling, JSON clipboard export/import, and reset flow.
- Verified with ESLint, TypeScript, Expo preview smoke checks, and frontend QA iteration 1; onboarding, task interaction, all four tabs, settings, backup controls, and overflow checks passed.
- Added Expo Go Android compatibility: notification code now loads only outside Expo Go, preventing a startup crash while retaining notifications for development/production builds.
- Fixed daily workload stability: checking a task now preserves today’s planned minutes; only Study Ahead can pull additional work into today.
- Added a reversible Schedule control: unavailable days remember their original unfinished tasks, so restoring a missed day never pulls future-day work into it.
- Added Phase 1 PDF plan import: private managed source-PDF upload, deterministic Sprint/Day/Task/Time extraction, editable import review, local multi-plan library, and active-plan switcher.
- Renamed all visible product branding from Aap Ya Paar to Aar Ya Paar while preserving local planner data and storage identifiers.
- Native PDF upload now copies the picked document into an app-owned cache folder, verifies it, and uploads it via Expo FileSystem multipart after Android reported an unreadable picker cache URI; backend parsing passed with the supplied 250-task PDF, pending physical-device confirmation.

## Implemented 2026-09-26 — GitHub-to-Expo synchronization
- Confirmed the workspace exactly matched GitHub `origin/main` at commit `be28fa2` before compatibility work.
- Updated Expo, Expo Linking, and Expo Router to their Expo SDK 57-compatible patch releases; Expo Doctor now passes all 20 checks.
- Added the root safe-area provider while retaining the existing navigation and app providers.
- Restored backend runtime startup by installing the declared `pypdf` dependency; `/api/` and a real PDF upload now succeed through the configured public proxy.
- Added an explicit task-completion state marker for reliable end-to-end validation and increased the active-plan switcher to a 44pt minimum touch target.
- Verified TypeScript, JavaScript/Python linting, backend smoke/import tests, onboarding, tabs, plan-library routing, and task completion in the Expo preview.

## Prioritized backlog
- P0: Re-run active-plan switching on a physical device after importing a PDF; automated preview picker handoff was intermittent, although import/review/edit/save and plan coexistence passed in QA.
- P0: Confirm Android/Expo Go PDF picker → upload → review using the new native multipart upload path.
- P0: Add a richer editable date detail modal for custom-capacity overrides.
- P1: Add native calendar month grid and notification cancellation/update handling.
- P1: Add curriculum import so users can replace the bundled task set.
- P2: Add streak history and a more detailed velocity chart.
- P2: Add optional encrypted file-based backup/share instead of clipboard-only backup.

## Remaining next tasks
- Validate notification behavior on physical Android and iOS devices.
- Validate the native document-picker upload path on physical Android and iOS devices.
- Add unit coverage for scheduler edge cases across weekends, unavailable dates, oversized tasks, and timezone changes.
- Improve accessibility labels for native tab bar variants.