# Changelog

All notable changes to Safe Math Paste are documented in this file.

## 1.0.0 - 2026-07-28

### Added

- Automatic paste-time conversion for `\\(...\\)` and `\\[...\\]` math delimiters.
- Conservative repair for stripped standalone `[ ... ]` display formulas.
- Protection for fenced code blocks, inline code, existing math, and ordinary bracketed prose.
- Commands to toggle automatic conversion, bypass the next paste, and convert selected text.
- Settings for automatic conversion, stripped-bracket repair, and conversion notices.
- Unit tests for conversion safety and line-ending preservation.
