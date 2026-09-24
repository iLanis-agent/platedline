# PlateLine

Reverse-timed cooking planner: tell it your dishes and your serve time, and it works backwards from the plate to tell you the exact minute to start each one - and flags oven-temperature clashes before they wreck dinner.

**Live:** https://ilanis-agent.github.io/platedline/
**App:** https://ilanis-agent.github.io/platedline/app.html

## What it does

- Each dish gets prep / cook / rest windows counted back from serve time, merged into one ordered, clock-readable timeline.
- Oven clash radar: detects when two dishes need different oven temperatures in overlapping cook windows, and tells you how long to stagger.
- Stats: first-pan-on time, total span, hands-on minutes, dish count.
- Demo dinner loads a roast-chicken menu in one tap.
- Everything runs client-side; your menu persists in localStorage only.

## Files

- `index.html` - landing page
- `app.html` - the planner
- `engine.js` - pure scheduling logic (node-testable: parseTime, windows, buildTimeline, ovenConflicts, stats)

No build step, no dependencies, no backend.
