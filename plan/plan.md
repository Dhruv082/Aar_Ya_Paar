# Aap Ya Paar — PDF Study Plan Import

A learner can add study plans from PDFs that follow the existing Sprint / Day / Task / Estimated Time table format.
Each import is reviewed and corrected before it becomes a saved plan, while existing plans and progress remain intact.

## Who it’s for

- Learners who receive structured study plans as PDFs.
- Learners managing more than one curriculum, such as DSA preparation, system design, or a separate course plan.
- Learners who want the scheduler to use their own plan without manually entering every task.

## Core features and experience

- **Upload a plan PDF:** A clear “Import plan” entry point lets the learner choose a PDF from their device.
- **Structured extraction:** The importer reads Sprint, Day, Task, and Estimated Time columns from PDFs matching the provided sample’s layout.
- **Validation, not guessing:** Missing headings, unrecognized time values, incomplete rows, duplicate task rows, and unexpected table layouts are highlighted. The app does not invent tasks or durations.
- **Editable review:** Before saving, the learner can name the plan and review every sprint, day, task, and duration. Flagged rows must be corrected or removed before the plan can be saved.
- **Multiple plans:** Saved plans appear in a plan library. Each plan has its own curriculum, progress, schedule, settings, and completion history.
- **Active-plan switcher:** A compact switcher in the main experience makes it clear which plan is currently being scheduled. Switching plans never merges or resets progress.
- **Safe replacement behavior:** Importing or saving a new plan never overwrites the current plan. Replacing an existing plan is an explicit, separate action from that plan’s detail screen.
- **Import history:** Each saved plan retains its original PDF name and import date so the learner can identify where it came from.

## User flow

1. The learner opens the plan library and chooses **Import PDF plan**.
2. The learner selects a PDF with Sprint / Day / Task / Estimated Time tables.
3. The app shows an import progress state, then opens a review screen.
4. The review screen displays the proposed plan name, sprint/day structure, task order, minutes, total task count, and any flagged rows.
5. The learner edits the plan name or task details and resolves each flagged row.
6. The learner saves the reviewed plan as a new plan in the library.
7. The learner chooses **Make active** to start scheduling that plan, or returns to their current plan unchanged.
8. Later, the learner can switch plans from the active-plan switcher and continue exactly where they left off.

## UI/UX feel

- Keeps the existing dark, focused study-planner style.
- Uses a calm step-by-step import flow: Choose PDF → Review structure → Fix issues → Save plan.
- Makes validation easy to scan with clear section labels, task counts, time totals, and high-contrast flagged-row cards.
- Keeps editing lightweight: inline task title and minutes edits, add/remove task actions, and visible Sprint / Day grouping.
- Uses reassuring copy throughout: the current plan stays unchanged until the learner explicitly saves and activates the imported plan.

## Implementation phases

### Phase 1 — MVP: structured PDF import and multi-plan library

- Import PDFs matching the sample Sprint / Day / Task / Estimated Time format.
- Upload the selected PDF securely for extraction and retain it privately as the import source.
- Parse and validate sprint/day/task/minutes rows without AI inference.
- Provide the editable review and issue-resolution screen.
- Save multiple named plans, each with independent scheduling and progress.
- Add plan library, active-plan switching, and safe preservation of the existing plan.

### Phase 2 — richer plan management

- Add plan duplication, archiving, renaming, source-PDF viewing, and import-status history.
- Add easier bulk editing tools, such as moving a task between days and adjusting several durations at once.
- Add an import summary that explains what was accepted, corrected, or excluded.

### Phase 3 — broader import support

- Support additional PDF layouts and multi-column variations.
- Offer CSV and spreadsheet import.
- Add optional AI-assisted suggestions for unfamiliar layouts, always requiring learner review before save.

## Assumptions

- Phase 1 supports only PDFs shaped like the supplied study-plan PDF; arbitrary PDFs are intentionally out of scope.
- A valid task needs a sprint number, day number, task title, and estimated duration.
- Durations accept minutes and hour-plus-minute formats, converted to minutes for scheduling.
- The learner can manually repair or remove every flagged row; the importer will not guess missing information.
- The imported plan’s task order follows the PDF’s sprint, day, and row order exactly.
- An import creates a new named plan by default and never replaces a plan automatically.
- Each saved plan keeps progress, availability changes, settings, and schedule separate from every other plan.
- The final plan data remains available offline on the device. Without sign-in, plans are not automatically shared or recovered on another device.
- The uploaded source PDF is kept private for parsing and import traceability; it is not shared with other learners.