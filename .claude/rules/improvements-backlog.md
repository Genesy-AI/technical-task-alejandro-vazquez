# Improvements backlog

`IMPROVEMENTS.md` at the repo root is the project's improvements backlog. Keep it current at the end of every task, before the final report and before committing.

## Only pending items

- The file lists only work that is still pending: status `To do` or `Needs decision`.
- When a task resolves an item, delete its row from the Summary table and its ticket section. Don't mark it `Done`; the history lives in git and the PR.
- When a task changes an item without resolving it (new evidence, a different priority, a decision taken), update that ticket in place.

## New items need confirmation

- Never add an item without asking first. At the end of the task, list each proposed item with its title, area, priority, status and a one-line problem, and wait for the user's explicit confirmation.
- Add only the items the user confirms. Items they decline go only under "Findings for follow-up" in the final message.
- Don't add items that duplicate an existing ticket; update that ticket instead.

## Format

- Keep the existing structure: the header table, the status and priority key, the Summary table, then one `## IMP-NN · Title` section per item with a status/priority/area line and **Problem**, **Evidence** (confirmed or suspected) and **Next step**.
- Take new IDs from the `Next ID` header field, then increment it. Never reuse an ID, even after its item is removed.
- Order the Summary table by priority (High, Medium, Low), then by ID.
- Set `Last updated` to today's date whenever the file changes.
- If nothing changed, say so in the final report: "IMPROVEMENTS.md: no changes".
