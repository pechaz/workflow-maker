# How I used AI

I used Cursor to implement this project from the take-home brief, the starter, and the walkthrough notes. I directed it to keep React Flow, to put every validation and timing rule in one shared module, and to save only valid documents. I reviewed the schedule against the Cutting example (35 minutes, Cutting → Assembly), a disconnected pair of groups, and a diamond where the long chain is not the widest step in each column. I also reviewed cycle detection and the save path so an invalid or overlapping save cannot replace the stored workflow with a partial document.

# Assumptions and limitations

- The product is one workflow, not an account system and not a list of workflows.
- Durations are positive numbers of minutes and may be fractional. Zero and negative durations are invalid.
- Name and duration wait about 300ms after the last keystroke before saving. Adding, deleting, connecting, retargeting, and dropping a dragged step save immediately.
- An invalid draft is kept on screen and is not stored. The previous valid workflow stays in the database. There is no automatic repair suggestion.
- When several critical paths take the same time, one is highlighted. The choice is stable for a given graph.
- The API does not require a revision token. Overlapping saves are full documents; the later committed update wins, and the editor sends the latest valid snapshot again if you edit during a save.
- A stored step name is trimmed. The field keeps the typed text until the next load.
- UI tests are not included. The automated tests cover calculation, validation, and the HTTP load/save path.
