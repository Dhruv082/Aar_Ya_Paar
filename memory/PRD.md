# Aap Ya Paar — Product Memory

## Problem statement
Build a mobile app from the uploaded Aap Ya Paar AI App Specification: a personal, local-first study planner that turns a fixed 9-sprint curriculum into an elastic daily schedule without changing task order.

## Architecture
- Expo SDK 57 / React Native frontend with Expo Router bottom navigation.
- Local-first persistence using the provided AsyncStorage-backed storage helper; no login and no backend dependency.
- Pure deterministic scheduling engine in `frontend/src/scheduler.ts` for capacity, missed days, unavailable days, completion, and Study Ahead recalculation.
- Local reminders through `expo-notifications`; JSON backup/restore through the device clipboard.

## User personas
- A solo software-engineering learner following a fixed curriculum.
- A time-constrained learner who needs missed days and changing availability handled automatically.

## Core requirements (static)
- First-launch onboarding for weekday/weekend capacity and reminder time.
- Bundled 9-sprint curriculum with immutable sequence ordering.
- Today task checklist with planned, completed, and remaining minutes.
- Missed-day handling, future unavailable/freedom days, and Study Ahead.
- Schedule runway, projected finish date, progress metrics, sprint breakdown, settings, local reminders, reset, and backup/restore.
- Offline operation with no account system.

## Implemented 2026-09-25
- Built dark-first amber tactical mobile UI based on `/app/design_guidelines.json`.
- Added onboarding, Today, Schedule, Progress, Settings, curriculum modal, safe-area handling, Android-first touch targets, and stable regression test IDs.
- Added the PDF-aligned 250-task curriculum with immutable sprint/day/source order, local persistence, schedule recalculation, task completion, missed/unavailable day logic, Study Ahead, reminder scheduling, JSON clipboard export/import, and reset flow.
- Verified with ESLint, TypeScript, Expo preview smoke checks, and frontend QA iteration 1; onboarding, task interaction, all four tabs, settings, backup controls, and overflow checks passed.
- Added Expo Go Android compatibility: notification code now loads only outside Expo Go, preventing a startup crash while retaining notifications for development/production builds.
- Fixed daily workload stability: checking a task now preserves today’s planned minutes; only Study Ahead can pull additional work into today.
- Added a reversible Schedule control: unavailable days remember their original unfinished tasks, so restoring a missed day never pulls future-day work into it.
- Added Phase 1 PDF plan import: private managed source-PDF upload, deterministic Sprint/Day/Task/Time extraction, editable import review, local multi-plan library, and active-plan switcher.

## Prioritized backlog
- P0: Re-run active-plan switching on a physical device after importing a PDF; automated preview picker handoff was intermittent, although import/review/edit/save and plan coexistence passed in QA.
- P0: Add a richer editable date detail modal for custom-capacity overrides.
- P1: Add native calendar month grid and notification cancellation/update handling.
- P1: Add curriculum import so users can replace the bundled task set.
- P2: Add streak history and a more detailed velocity chart.
- P2: Add optional encrypted file-based backup/share instead of clipboard-only backup.

## Remaining next tasks
- Validate notification behavior on physical Android and iOS devices.
- Add unit coverage for scheduler edge cases across weekends, unavailable dates, oversized tasks, and timezone changes.
- Improve accessibility labels for native tab bar variants.