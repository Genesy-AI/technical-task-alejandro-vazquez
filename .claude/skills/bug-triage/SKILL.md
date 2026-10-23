---
name: bug-triage
description: Use when the user reports a bug to investigate and fix. Reproduces it, finds the root cause with evidence, proposes the smallest fix, and adds a regression test.
---

# Bug triage

The user gives you a bug description. Follow this order.

1. **Reproduce first.** Run the failing scenario and show the actual output
   (values, logs, raw bytes if encoding is involved). If you can't reproduce it,
   say so and stop.
2. **Trace the path end to end** (input, processing, storage, API, UI) and say
   where the data or behavior first goes wrong. Cite file paths and line numbers.
3. **State the root cause with evidence.** With several hypotheses, say how to
   tell them apart and check, don't guess.
4. **Propose the smallest fix** plus one alternative and its trade-off.
   Wait for approval before editing.
5. **After approval:** fix without unrelated refactors, add a regression test that
   fails before and passes after, run the existing suite, and report the result.
6. **Finish with** the diff and a short summary. Do not commit.
7. If the finding reveals a risk or changes a priority, add one line to
   IMPROVEMENTS.md (file, what you saw, confirmed or suspected).

Never include secrets or API keys in code, logs or commits.
