---
name: plgn-posting-cadence
description: "Use inside a /plgn command that schedules posts — how often to post, spreading a month across platforms and topics, choosing times, and cutting rather than padding when there are fewer good posts than slots. Not for scheduling advice outside plgn."
---

`/plgn <name>` in this text means the plgn-<name> skill. In a tool without slash commands, ask for it by name.

# How often to post

How often, when, and in what order — decided once so a month does not bunch up.

## A pace a brand can keep

| Platform | Sustainable | Ambitious | Notes |
|---|---|---|---|
| LinkedIn | 2–3/week | 5/week | Long posts; each one is real work |
| X | 4–7/week | 2–3/day | Short; the only platform where daily is normal |
| Instagram | 2–3/week | 5/week | Needs a picture every time — that's the real limit |
| Facebook | 2–3/week | 5/week | Low ceiling for most business audiences |
| TikTok | 2–3/week | daily | Needs video; rarely fits a writing-first workflow |

**Choose the pace the brand can keep up**, not the one that looks impressive.
Daily LinkedIn from a team of one is a plan that fails in week two, and a feed
that stops suddenly looks worse than one that was always modest.

Say what you assumed out loud — team size, whether video is possible, weekdays
only — because a user can only correct a guess they can see.

## Times

Treat times as **sensible defaults, not promises**. Real best times vary by
audience and can only be known from a brand's own data, which plgn does not
hold.

- **Selling to businesses** — weekday mornings, in the audience's timezone.
- **Selling to people** — evenings and weekends tend to do better.
- **Avoid** Friday afternoons and public holidays where the audience is.

## Where the timezone comes from

The **brand record**. `brand_list` prints it beside the brand's name and
languages; `brand_update(timezone: "Africa/Cairo")` sets it.

It used to live in a knowledge entry, because the record had nowhere to put
it. See **plgn-brand-knowledge-map** for the four places a brand is stored.

**A brand with no timezone set is a brand you must not schedule silently.**
Say which zone you used and offer to save the right one. See
**plgn-brand-knowledge-map** for what happens when that is skipped.

Never claim a time gets more attention. Say "a sensible default" and move on.

## Spreading it out

- **No topic takes a whole week.** Rotate so one post follows a different topic.
- **Change the shape of the opening** between one slot and the next, per
  **plgn-platform-specs**. Two number-led openings in a row read like a template.
- **Spread each platform evenly.** Three LinkedIn posts should be Mon / Wed /
  Fri, not three in one afternoon.
- **Leave the last week lighter.** Something always takes it — a launch, a
  holiday, an emergency. A month with no slack is a month that breaks.
- **Never put two posts on the same platform within a few hours**, unless the
  platform is X and the brand genuinely posts that way.

## Fewer good posts than slots

This happens constantly, and how it is handled separates a useful schedule from
a damaging one.

**Cut the schedule. Do not pad it.**

A padded post is not neutral — it reaches real followers, teaches them the
brand's posts are worth skipping, and makes the next good post less likely to be
read. The cost is paid on the *next* post, which is why padding feels free and
is not.

When it happens:

1. Schedule the strong posts.
2. Post less often, to match what exists.
3. **Say so**, with the reason:

> Scheduled 22 of the planned 28. Two topics had fewer posts than planned, and
> padding them would have meant publishing filler.

The plan already told the user how many to expect, so a shortfall is
information, not a failure. Never quietly write weak posts to hit a number.

## When the plan is too ambitious

If a requested pace cannot be kept up, say so **before** scheduling, not after:

> 5 LinkedIn posts a week takes about 5 hours of writing. At 3 a week the
> quality holds and the topics last twice as long. Which do you want?

Give the user the trade-off and let them choose. Do not quietly cut it, and do
not quietly go along with a pace that will produce filler.

## Talking about this to the user

Never use the word "cadence" in anything the user reads. Say "how often you
post", or just give the numbers. See the **plgn-reply-style** skill.
