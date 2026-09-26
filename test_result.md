#====================================================================================================
# START - Testing Protocol - DO NOT EDIT OR REMOVE THIS SECTION
#====================================================================================================

# THIS SECTION CONTAINS CRITICAL TESTING INSTRUCTIONS FOR BOTH AGENTS
# BOTH MAIN_AGENT AND TESTING_AGENT MUST PRESERVE THIS ENTIRE BLOCK

# Communication Protocol:
# If the `testing_agent` is available, main agent should delegate all testing tasks to it.
#
# You have access to a file called `test_result.md`. This file contains the complete testing state
# and history, and is the primary means of communication between main and the testing agent.
#
# Main and testing agents must follow this exact format to maintain testing data. 
# The testing data must be entered in yaml format Below is the data structure:
# 
## user_problem_statement: {problem_statement}
## backend:
##   - task: "Task name"
##     implemented: true
##     working: true  # or false or "NA"
##     file: "file_path.py"
##     stuck_count: 0
##     priority: "high"  # or "medium" or "low"
##     needs_retesting: false
##     status_history:
##         -working: true  # or false or "NA"
##         -agent: "main"  # or "testing" or "user"
##         -comment: "Detailed comment about status"
##
## frontend:
##   - task: "Task name"
##     implemented: true
##     working: true  # or false or "NA"
##     file: "file_path.js"
##     stuck_count: 0
##     priority: "high"  # or "medium" or "low"
##     needs_retesting: false
##     status_history:
##         -working: true  # or false or "NA"
##         -agent: "main"  # or "testing" or "user"
##         -comment: "Detailed comment about status"
##
## metadata:
##   created_by: "main_agent"
##   version: "1.0"
##   test_sequence: 0
##   run_ui: false
##
## test_plan:
##   current_focus:
##     - "Task name 1"
##     - "Task name 2"
##   stuck_tasks:
##     - "Task name with persistent issues"
##   test_all: false
##   test_priority: "high_first"  # or "sequential" or "stuck_first"
##
## agent_communication:
##     -agent: "main"  # or "testing" or "user"
##     -message: "Communication message between agents"

# Protocol Guidelines for Main agent
#
# 1. Update Test Result File Before Testing:
#    - Main agent must always update the `test_result.md` file before calling the testing agent
#    - Add implementation details to the status_history
#    - Set `needs_retesting` to true for tasks that need testing
#    - Update the `test_plan` section to guide testing priorities
#    - Add a message to `agent_communication` explaining what you've done
#
# 2. Incorporate User Feedback:
#    - When a user provides feedback that something is or isn't working, add this information to the relevant task's status_history
#    - Update the working status based on user feedback
#    - If a user reports an issue with a task that was marked as working, increment the stuck_count
#    - Whenever user reports issue in the app, if we have testing agent and task_result.md file so find the appropriate task for that and append in status_history of that task to contain the user concern and problem as well 
#
# 3. Track Stuck Tasks:
#    - Monitor which tasks have high stuck_count values or where you are fixing same issue again and again, analyze that when you read task_result.md
#    - For persistent issues, use websearch tool to find solutions
#    - Pay special attention to tasks in the stuck_tasks list
#    - When you fix an issue with a stuck task, don't reset the stuck_count until the testing agent confirms it's working
#
# 4. Provide Context to Testing Agent:
#    - When calling the testing agent, provide clear instructions about:
#      - Which tasks need testing (reference the test_plan)
#      - Any authentication details or configuration needed
#      - Specific test scenarios to focus on
#      - Any known issues or edge cases to verify
#
# 5. Call the testing agent with specific instructions referring to test_result.md
#
# IMPORTANT: Main agent must ALWAYS update test_result.md BEFORE calling the testing agent, as it relies on this file to understand what to test next.

#====================================================================================================
# END - Testing Protocol - DO NOT EDIT OR REMOVE THIS SECTION
#====================================================================================================



#====================================================================================================
# Testing Data - Main Agent and testing sub agent both should log testing data below this section
#====================================================================================================

## user_problem_statement: "Add Phase 1 PDF study-plan import with deterministic validation, editable review, multiple local plans, and active-plan switching."
## frontend:
  - task: "Expo Go notification compatibility"
    implemented: true
    working: true
    file: "frontend/src/app-context.tsx"
    stuck_count: 1
    priority: "high"
    needs_retesting: false
    status_history:
      - working: false
        agent: "user"
        comment: "Expo Go on Android throws an uncaught expo-notifications error while loading app-context.tsx."
      - working: "NA"
        agent: "main"
        comment: "Replaced the startup-level notification import with a lazy, Expo Go Android-safe loader."
      - working: true
        agent: "main"
        comment: "Lint passed and mobile preview successfully rendered the onboarding screen after the fix."
  - task: "Stable planned minutes after task completion"
    implemented: true
    working: true
    file: "frontend/src/app-context.tsx, frontend/src/scheduler.ts"
    stuck_count: 1
    priority: "high"
    needs_retesting: false
    status_history:
      - working: false
        agent: "user"
        comment: "Checking a task caused extra tasks to be pulled into today and increased planned minutes."
      - working: "NA"
        agent: "main"
        comment: "Completion now preserves the existing schedule; Study Ahead is the only action that reflows today. Self-check held 225m before and after a check-off."
      - working: true
        agent: "testing"
        comment: "Iteration 2 independently confirmed planned minutes remained 225m before and after the first completion."
  - task: "Restore unavailable day"
    implemented: true
    working: true
    file: "frontend/src/app-context.tsx, frontend/app/(tabs)/schedule.tsx"
    stuck_count: 2
    priority: "high"
    needs_retesting: false
    status_history:
      - working: false
        agent: "user"
        comment: "An unavailable day could not be made available again."
      - working: "NA"
        agent: "main"
        comment: "Added the Mark available control and rescheduling from the selected date."
      - working: false
        agent: "testing"
        comment: "Iteration 2 found Alert confirmation callbacks did not execute in web preview, so unavailable state was never set."
      - working: "NA"
        agent: "main"
        comment: "Removed the unreliable Alert confirmation layer; the reversible mark-unavailable and mark-available actions now execute directly."
      - working: true
        agent: "testing"
        comment: "Iteration 3 independently verified the full unavailable → available lifecycle on a future day."
      - working: false
        agent: "user"
        comment: "Restoring a missed day pulled a group of tasks from the next day instead of only the item that had been left on the missed day."
      - working: "NA"
        agent: "main"
        comment: "Unavailable overrides now preserve their original unfinished task IDs. Restoring the date returns those IDs only, then rebuilds all other pending work from the next date."
      - working: true
        agent: "testing"
        comment: "Iteration 4 independently confirmed a restored missed day returned only its original unfinished task and did not pull in the next-day task."
  - task: "PDF curriculum order"
    implemented: true
    working: true
    file: "frontend/src/curriculum.ts, frontend/src/scheduler.ts"
    stuck_count: 1
    priority: "high"
    needs_retesting: false
    status_history:
      - working: false
        agent: "user"
        comment: "The displayed question list and ordering did not match the uploaded study plan."
      - working: "NA"
        agent: "main"
        comment: "Installed the full 250-task PDF sequence with source sprint, day, and minute estimates."
      - working: true
        agent: "testing"
        comment: "Iteration 2 independently confirmed all 250 tasks and the first Sprint 1 / Day 1 sequence against the PDF."
  - task: "PDF import and multi-plan library"
    implemented: true
    working: false
    file: "backend/server.py, frontend/app/import-plan.tsx, frontend/app/plans.tsx, frontend/src/app-context.tsx"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: "NA"
        agent: "main"
        comment: "Built secure private-PDF upload, deterministic Sprint/Day/Task/Time extraction, editable review, local multi-plan storage, and active-plan switching. Backend sample parse returned 250 tasks and stored the source PDF."
      - working: false
        agent: "testing"
        comment: "Iteration 5 found the Review screen crashed because the backend’s snake_case import response was passed directly to camelCase frontend types."
      - working: "NA"
        agent: "main"
        comment: "Added an explicit API response adapter plus null-safe review name handling. Full UI import/save/switch retest required."
      - working: false
        agent: "testing"
        comment: "Iteration 6 still observed the pre-fix Review crash after upload, indicating the preview was serving an older Metro bundle."
      - working: "NA"
        agent: "main"
        comment: "Cleared generated Metro cache and restarted Expo via stop/start after a supervisor port-race recovery."
      - working: false
        agent: "testing"
        comment: "Iteration 7 verified import/review/edit/save and plan coexistence, but could not reliably tap the imported plan’s small Make active CTA on mobile web."
      - working: "NA"
        agent: "main"
        comment: "Replaced the small CTA with one full-card Pressable activation target and removed global LogBox suppression."
      - working: false
        agent: "user"
        comment: "Uploading the same structured PDF on mobile fails with an unsupported FormData part implementation error."
      - working: "NA"
        agent: "main"
        comment: "Replaced native FormData URI-object upload with Expo FileSystem legacy multipart upload; web retains Blob/FormData handling."
      - working: false
        agent: "user"
        comment: "Native FileSystem upload then failed because the DocumentPicker cache URI was not readable on Android/Expo Go."
      - working: "NA"
        agent: "main"
        comment: "Native imports now explicitly copy the picker URI into an app-owned plan-imports cache folder, verify it exists and has size, then upload that verified file."
## metadata:
  created_by: "main_agent"
  version: "1.0"
  test_sequence: 10
  run_ui: true
## test_plan:
  current_focus:
    - "PDF import and multi-plan library"
  stuck_tasks: []
  test_all: false
  test_priority: "high_first"
## agent_communication:
  - agent: "main"
    message: "User-reported Expo Go Android startup issue is fixed in app-context.tsx and needs UI verification."
  - agent: "user"
    message: "Reported that completing today’s work increases planned minutes, unavailable days cannot be restored, and the question sequence does not follow the uploaded PDF."
  - agent: "main"
    message: "Replaced the curriculum with the PDF’s 250 ordered tasks, preserved today’s scheduled workload on completion, and added Mark available for unavailable days. Independent QA required."
  - agent: "main"
    message: "After QA exposed the web Alert callback issue, removed confirmations from the reversible schedule toggle. Preview now passes unavailable → available lifecycle; retest is required."
  - agent: "main"
    message: "User reported restored missed days pulled in future work. The scheduler now restores only the day’s remembered unfinished tasks; independent QA is required."
  - agent: "main"
    message: "Phase 1 PDF import and local multi-plan library are implemented. Validate upload/review/save/switch and active-plan isolation."