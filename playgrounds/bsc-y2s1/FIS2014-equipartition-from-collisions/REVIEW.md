# REVIEW - equipartition-from-collisions (deep audit; supersedes any earlier pass)

## Verdict
DEPRECATED (status: deprecated; superseded_by: maxwell-boltzmann-emergence in spec.md line 5)

## A. Scientific validity
Not audited in detail; playground is marked deprecated and superseded by maxwell-boltzmann-emergence. Spec.md line 24 cites Reif Ch. 7 for equipartition theorem. If ever reactivated, require full physics audit.

## B. Physics & numerical robustness
Status is deprecated; do not ship. No action required.

## C. Presentability
Spec.md lines 13-14 contain placeholder strings `hook: 'STATUS: needs_hook'` and `one_paragraph: 'STATUS: needs_paragraph'`. These are benign for deprecated items.

## Hero-candidate
N/A (deprecated).

## Action checklist for maintainer
Do not ship. Keep deprecated status until intentional reactivation. If reactivating, remove deprecated flag, write hook/paragraph, and audit full physics.
