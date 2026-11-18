# CONTRIBUTING — MODULE 04: 3D CLOTHING PREVIEW

Thank you for helping build CUSTOM SHIRT STUDIO. This module is one of eight
in a shared ecosystem; changes here affect other modules' integration.

## Ground rules

1. **Preserve existing work.** Never delete working code without an issue +
   discussion. Never force-push. Never merge to `main` without owner approval.
2. **Module boundaries.** Module 04 owns only 3D visualization. Do not
   implement design capture (Module 03), fabric inventory (Module 02),
   pricing (05), measurements (06), orders (07), or admin (08) here.
3. **Never invent other modules' APIs.** Unknown contracts go behind an
   adapter with labelled fixtures and documented assumptions.
4. **Honesty invariants.** The preview is a visual approximation. Do not add
   claims of exact fit, physical cloth simulation, or fabric photography that
   is not real photography. Fixtures stay labelled as fixtures.
5. **No secrets.** No API keys, tokens, passwords, or personal data in any
   commit.
6. **Stable identifiers.** `SHIRT_COMPONENT_IDS`, material slots, and option
   ids are a public contract — renaming is a breaking change requiring a
   major version and a CHANGELOG entry.

## Development setup

```bash
npm install
npm run dev        # demo harness on the dev server
npm test           # must stay green
npm run build      # typecheck + production build — must stay green
```

## Code standards

- TypeScript strict; no `any` without a comment justifying it.
- Core logic (`src/core`, `src/integration`) stays free of React and DOM
  so it remains Node-testable.
- Every new variation needs: geometry spec entry, builder support, tests,
  and a docs update in the same PR.
- Dispose what you allocate (geometries, materials, textures).

## Testing expectations

- Add/extend tests for every behaviour change; run the full suite.
- Report real numbers in PRs (tests run, passed/failed) — never paste
  unexecuted expectations.
- Note jsdom limitations: WebGL scenes are browser-verified via the dev
  preview; state that honestly in PR descriptions.

## Commit style

Small, logical commits with imperative messages, e.g.
`feat(model): add mandarin collar band-only geometry`,
`fix(adapter): reject invalid thread_color with note`.
