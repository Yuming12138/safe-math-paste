# Contributing

Thanks for helping improve Safe Math Paste.

## Development setup

```powershell
npm install
npm run check
```

Use Node.js 18 or later. The `check` script runs unit tests, the production build, and linting.

## Pull requests

- Keep transformations conservative. A false positive that changes ordinary prose is worse than leaving an ambiguous formula unchanged.
- Add or update unit tests for every transformation rule.
- Preserve fenced code blocks, inline code, existing dollar-delimited math, and line endings.
- Avoid network access, telemetry, and Node.js or Electron APIs so the plugin remains local and mobile-compatible.
- Use sentence case for commands, settings, and notices.

## Manual Obsidian verification

Copy `main.js`, `manifest.json`, and `styles.css` into `<Vault>/.obsidian/plugins/safe-math-paste/`, reload the plugin, paste representative content, and check the Obsidian developer console for errors.
