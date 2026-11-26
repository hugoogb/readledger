# 0006. Development seed script

Status: accepted

### Writes only to the local dev container

Where: `scripts/seed-dev.mjs` (`containerRunning`)

The seed writes through `docker exec … psql` into the `docker-compose.dev.yml` container and nowhere else, so it needs no extra dependencies and its safety check is only that this container exists and is running.

### Idempotent and representative

Where: `scripts/seed-dev.mjs`

If the dev account already has series, nothing is changed. The data covers every screen's edge cases: manga runs with gaps, single books, missing covers, a very long title, prices, stores, reading dates, a goal and a wishlist. In the `manga` entries, `owned` is the count of volumes owned and `read` is how many of the owned are read. Purchase dates spread deterministically over this year and last, never in the future, and a read lands 3 to 40 days after its purchase, capped at today.
