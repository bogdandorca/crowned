# Current User Rank Window Design

## Goal

Show signed-in donors their own leaderboard position even when they are ranked below the top 10.

## Behavior

- The leaderboard continues to show the leading patron, podium cards, and normal standings through rank 10.
- When the signed-in donor has rank 10 or better, the existing highlighted row or podium card is enough and no extra section appears.
- When the signed-in donor is ranked below 10, the standings list shows a quiet separator after rank 10, then five nearby rows.
- The signed-in donor appears as the third row in that five-row window whenever enough neighbors exist.
- The nearby window reuses the existing row component, share behavior, rank display, amount animation, and "You" badge.

## Data

The mocked donor set will be extended beyond 10 donors so this behavior is visible in local testing. Mocked Google sign-in will still resolve to donor `tudi`, but Tudi will rank below the top 10 in at least the default view.

## UI

The separator should match Crowned's restrained donor-focused style: subtle rule, small uppercase label, no playful effects, no confetti, and no competitive copy.

## Testing

Add regression coverage for the display-section helper:

- active donor at rank 10 or better does not create a nearby section;
- active donor below rank 10 creates a five-row nearby section;
- the active donor is the third row in that nearby section when possible.

Update `FEATURES.md` to document the current-user rank window.
