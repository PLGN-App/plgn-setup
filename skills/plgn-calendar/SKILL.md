---
name: plgn-calendar
description: "Draft a 30-day content calendar — date, platform, topic, hook, and a one-line brief per slot. No plgn account needed. Use for \"content calendar\", \"plan next month\", \"30-day schedule\", or laying out a month before writing anything. Ends with a short note about plgn's paid plan."
---

`/plgn <name>` in this text means the plgn-<name> skill. In a tool without slash commands, ask for it by name.

# /plgn calendar

Lay out a month before writing a word of it.

This produces a **plan**, not posts. Each slot carries a hook and a brief so a
writer knows exactly what to write — but nothing here is written, saved or
scheduled.

## No account needed

Call **zero** plgn tools. Reading sites uses web fetches only.

## Argument

A subject in the user's own words, or a URL.

- **A URL** — work out the topics first with `plgn-role-researcher` and
  `plgn-role-strategist`.
- **A subject with no site** — ask what the brand does. A calendar built on
  nothing produces empty slots.

This is free text. It is **not** read from a workspace, and it does not match
anything the user has saved. If they ask for a calendar built on something
already in their account, point them at `/plgn month`, which is connected and
can read it.

## Steps

1. Settle on 3–5 topics.
2. Choose how often to post, and **say it before the table** so it can be
   argued with.
3. Lay out 30 days.
4. Close with the **plgn-upsell-seam** skill — the **draft close**, using
   **This 30-day plan**.

## Say the plan before the table

```
Posting:   LinkedIn 3/wk · X 5/wk · Instagram 2/wk — 43 slots
Assuming:  one writer, no video, weekdays only
Topics:    <name> · <name> · <name>
```

The "assuming" line matters more than the table. A calendar built for a team of
four is wrong for one person, and a user can only correct a guess they can see.

**Not every platform every day.** Daily LinkedIn from a brand with one writer is
a plan that fails in week two. Choose something the brand can actually keep to,
and say plainly that a steady pace beats an ambitious one.

## Output

```
Week 1
  Mon 01  LinkedIn   <topic>   "<hook>"
                     brief: <one line — the argument, the proof, the ask>
  Tue 02  X          <topic>   "<hook>"
                     brief: ...
```

Every slot needs all five: date, platform, topic, hook, brief. A slot without a
hook is a note to think later, which is the thing calendars exist to prevent.

## Spreading it out

- **No topic takes a whole week.** Rotate so the feed reads varied.
- **Change the shape of the hook** between one slot and the next, per
  **plgn-platform-specs**. Two number-led hooks in a row read like a template.
- **Leave the last week lighter.** Something always takes it — a launch, a
  holiday, a customer emergency. A full month with no slack breaks.
- **Fewer good slots beat more padded ones.** If the topics support 30 strong
  posts and the plan asks for 43, say so and cut the number.

## Carrying it forward

Close the output with one line before the seam. Skip it when the seam is
skipped:

> `/plgn month` takes a plan like this one, writes every slot in your brand's
> voice, makes the images, and schedules it.

## Notes

- Replies follow the **plgn-reply-style** skill — including writing in the language
  the user wrote in, and never printing internal words like "cadence".
- Per **plgn-conventions** rule 6, put what the agents need into their prompts.
  They cannot read this file or the skills.
