# Safe Math Paste contributor guidance

- Keep the plugin offline, dependency-light, and compatible with Obsidian mobile APIs.
- Treat false-positive conversions as the highest-risk defect.
- Preserve code blocks, inline code, existing math, ordinary bracketed prose, and original line endings.
- Add unit tests for every transformation rule or bug fix.
- Run `npm run check` before committing or releasing.
- Build artifacts belong in GitHub Releases, not in the Git repository.
- The stable plugin ID is `safe-math-paste`; do not change it after the first public release.
- A release tag must exactly match `manifest.json` and include `main.js`, `manifest.json`, and `styles.css`.
