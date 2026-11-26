# 0004. Reading statistics

Status: accepted

### UTC buckets and an injected clock

Where: `lib/reading-stats.ts`

Every statistic buckets in UTC, because date inputs are stored as UTC midnight, and takes `now` as a parameter so results are deterministic and testable.

### Only dated reads count

Where: `lib/reading-stats.ts` (`datedReads`, `undatedReadCount`)

A volume counts as a read only when it is read and has a `readDate`. Read volumes without a date are excluded from every metric and reported separately as `undatedReadCount`.

### Weeks start on Monday

Where: `lib/reading-stats.ts` (`weekIndex`, `currentStreak`)

Week numbers count Monday-start weeks since the epoch; 1970-01-01 was a Thursday, hence the `+ 3` offset. The streak counts consecutive weeks with at least one read ending this week, and an empty current week doesn't break it because it may still be filled.

### Year-over-year comparison is like for like

Where: `lib/reading-stats.ts` (`comparisonToLastYear`)

For the current year, the previous year is cut off at the same UTC month and day.

### Ties and pace

Where: `lib/reading-stats.ts` (`bestPeriod`, `GoalProgress`)

The busiest period picks the earliest bucket on a tie. Goal pace (`expected`, `paceDelta`) exists only for the current year, and a positive `paceDelta` means ahead of pace.

### Backlog trend leaves out undatable volumes

Where: `lib/reading-stats.ts` (`backlogTrend`)

The backlog is the owned-but-unread count at each month end (year view) or year end (all view), with the current period's point taken at `now`. Volumes without a purchase date, or read without a read date, can't be placed on the timeline and are left out.

### Calendar dates are stored as UTC midnight

Where: `utils/date.ts` (`startOfUtcDay`, `todayInputValue`)

Purchase and read dates are stored as UTC midnight of the calendar day, which is what `new Date("YYYY-MM-DD")` produces from a date input. Date inputs are prefilled with the viewer's local day.
