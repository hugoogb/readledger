# Architecture decision records

Code comments are kept out of the source (see 0001). A non-obvious constraint
or choice goes in the ADR for its area instead, as a section with a `Where:`
line naming the file and symbol it applies to.

| ADR                                   | Area                                                                                |
| ------------------------------------- | ----------------------------------------------------------------------------------- |
| [0001](0001-no-comments-in-code.md)   | No comments in code: lint rule, directives, suppressions baseline                   |
| [0002](0002-external-book-apis.md)    | External book APIs: MangaDex, Open Library, Google Books, throttling                |
| [0003](0003-library-model.md)         | Library model: titles, standalone books, volumes, ISBN scanning                     |
| [0004](0004-reading-statistics.md)    | Reading statistics                                                                  |
| [0005](0005-add-flow-search-ui.md)    | Add-flow search UI                                                                  |
| [0006](0006-dev-seed.md)              | Development seed script                                                             |
| [0007](0007-auth-and-security.md)     | Auth and security: OTP, sessions, proxy, CSP, ownership checks                      |
| [0008](0008-actions-and-errors.md)    | Server actions and errors                                                           |
| [0009](0009-ui-patterns.md)           | UI patterns: mobile and touch behaviour, optimistic state, React and browser quirks |
| [0010](0010-seo-and-marketing.md)     | SEO and marketing pages                                                             |
| [0011](0011-deployment-and-config.md) | Deployment and config                                                               |
| [0012](0012-testing.md)               | Testing                                                                             |
