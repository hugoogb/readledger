# 0001. No comments in code

Status: accepted

### Comments are banned by lint

Where: `eslint-rules/no-comments.cjs`, `eslint.config.mjs`

The `local/no-comments` rule reports every comment in JS and TS files. Code should say what it does through names, types and small functions. A non-obvious constraint or choice goes in the ADR for its area as a section with a `Where:` line. A known shortcut goes in a GitHub issue, not in a comment that excuses it.

### Directive allowlist

Where: `eslint-rules/no-comments.cjs` (`DIRECTIVES`)

Tool directives are not comments and stay allowed: `eslint-disable`/`eslint-enable`/`eslint-env`, `global`/`globals`/`exported`, `@ts-expect-error`/`@ts-ignore`/`@ts-nocheck`/`@ts-check`, `/// <reference`, `prettier-ignore`, `#__PURE__`/`@__PURE__`, `@jest-environment` and `istanbul ignore`, plus shebangs. A new marker that a tool reads is added to `DIRECTIVES` rather than suppressed.

### No suppressions baseline

Where: `eslint.config.mjs` (`local/no-comments`)

Every existing comment was audited and removed when the rule was added: decisions went to these ADRs and shortcuts to the "Comment audit" issues (#26, #27, #28). The rule is therefore a plain error with no `eslint-suppressions.json` baseline, and a new comment fails `pnpm lint`.

### Files outside ESLint

Where: `app/globals.css`, `prisma/schema.prisma`, `Dockerfile`, `docker-compose.*.yml`, `.github/workflows/*.yml`

CSS, Prisma schema, Docker, YAML and SQL comments have no lint ratchet. Prisma migrations are generated history and are never edited.
