import json
import re
from pathlib import Path


CURRICULUM_PATH = Path("/app/frontend/src/curriculum.ts")
SCHEDULER_PATH = Path("/app/frontend/src/scheduler.ts")


def main() -> None:
    curriculum_text = CURRICULUM_PATH.read_text(encoding="utf-8")
    scheduler_text = SCHEDULER_PATH.read_text(encoding="utf-8")

    task_pairs = re.findall(r'\["([^"\\]+)",\s*(\d+)\]', curriculum_text)
    task_count = len(task_pairs)

    first_day_match = re.search(r"\[\s*\[\[(.*?)\]\s*,\s*\[\[", curriculum_text, flags=re.S)
    first_day_raw = first_day_match.group(1) if first_day_match else ""
    first_day_pairs = re.findall(r'"([^"\\]+)",\s*(\d+)', first_day_raw)

    expected_first_day = [
        ("Majority Element-I", "17"),
        ("Kadane's Algorithm", "19"),
        ("Majority Element-II", "25"),
        ("Maximum Product Subarray in an Array", "18"),
        ("Sort an array of 0's 1's and 2's", "24"),
        ("3 Sum", "37"),
        ("Next Permutation", "26"),
        ("4 Sum", "27"),
        ("Merge two sorted arrays without extra space", "32"),
    ]

    has_sprint = "sprint: sprintIndex + 1" in scheduler_text
    has_original_day = "originalDay: dayIndex + 1" in scheduler_text
    has_sequence = "sequence: ++sequence" in scheduler_text

    result = {
        "task_count": task_count,
        "first_day": first_day_pairs,
        "first_day_matches_expected": first_day_pairs == expected_first_day,
        "scheduler_metadata_mapping": {
            "sprint": has_sprint,
            "originalDay": has_original_day,
            "sequence": has_sequence,
        },
    }

    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
