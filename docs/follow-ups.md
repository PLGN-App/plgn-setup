# Follow-ups

## portable-skills-setup leftovers, added 2026-10-08

- [ ] P1. `src/skills.js`: Devin folder follows Decision 3 (~/.config/devin/skills), but the table distinguishes "Devin for Terminal" from "Devin (formerly Windsurf)" desktop app, which uses ~/.codeium/windsurf/skills. Old installs may only find Devin through ~/.codeium/windsurf, so skills placed in ~/.config/devin/skills may never be read. Keep the Task 7 live check that Devin really lists skills from this folder, and record the real folder if it does not.

- [ ] P2. `src/doctor.js`: Doctor marks skills as red for any host without plgn skills, as the brief asks. However, anyone who used --no-skills or answered no will see a red row and exit 1 on every doctor run, but neither the README nor CHANGELOG documents this behavior. Optional: add one README sentence that doctor counts missing skills as a problem, or later have doctor show a skip row for an explicit opt-out instead of red.

- [ ] P3. `src/skills.js`: The README offers `npx skills add PLGN-App/plgn-setup`, which by default symlinks to ~/.agents/skills. If the linked copy differs from the bundle, installSkills replaces the symlink with an older bundled copy, breaking future updates from the skills CLI. Follow-up only: either leave symlinked bundled-name entries alone (report as same or skip), or add a README note to pick one install route.
