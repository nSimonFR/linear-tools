Linear EPIC is still relevant, but I would rather you see => https://github.com/nSimonFR/GPT-Linear

# Linear API scripts

A collection of useful linear scripts I made, as I required them for my usage and the Linear API (As well as the product in itself) is actually kinda insanely good and well documented.

❤️ https://linear.app ❤️

## Update EPIC

[Link to source](./update-epic.js)

Automatically synchronizes the state of a parent ticket with it's sub-tickets, as long as this parent matches a specific tag (= EPIC) and sets the estimation to 0 (So that estimation only is reflected by the children).

Uses an internal list of priorities between states for sync to be relevant (A "started" takes priority over "backlog" and "completed") => See `find-state.test.js`.

Unlikely to work cross-team (Note: improve compatibility).

Made to run directly in a Google Cloud Function.

## Issue Move

[Link to source](./issue-move.js)

Move a list of linear issues from a state to another. Takes either a list of direct linear links or issue related link.

Useful if you need further automation

Example usage (List recent merged PR for repository and move linear ticket from state "Merged" to "In Production"):
```bash
RECENTLY_MERGED_PR_URLS=$(gh pr list --state merged --json url -q '.[].url')
node linear_move "Merged" "In Production"
```

## Issues Project

[Link to source](./issues-project.js)

Automatically creates a list of issues in a project to the appropriate teams with optional inter-dependancy.

Usage: Edit the list of TASKS, then run `node integration-project "Project Name"`
