---
name: plgn-upsell-seam
description: "Use when closing any free plgn command (demo, audit, strategy, voice, competitors, calendar) to turn a result into a reason to sign up. Defines the two exact closing blocks — one for drafted content, one for findings — so the wording stays consistent and always matches what the command actually produced."
---

`/plgn <name>` in this text means the plgn-<name> skill. In a tool without slash commands, ask for it by name.

# The closing line

Free commands stop where the work gets expensive to do by hand. Give the value
first, then name the limit the product removes. Never apologise for the free
version and never oversell the paid one.

There are **two closing blocks**. Using the wrong one produces nonsense — an
audit has no posts to schedule — so pick by what the command actually produced.

## Which block to use

| Command | Produced | Block |
|---|---|---|
| `demo` | 7 drafted posts | **Draft close** |
| `calendar` | a 30-day plan | **Draft close** |
| `audit` | a score and findings | **Analysis close** |
| `strategy` | positioning and topics | **Analysis close** |
| `voice` | a voice guide | **Analysis close** |
| `competitors` | a competitor read | **Analysis close** |

The test: **did this command produce content, or a conclusion about content?**
Content takes the draft close. Conclusions take the analysis close.

## Draft close

For commands that produced posts or a plan of them. Change only the words in
brackets to match what was produced.

> **[7 posts] are text in your terminal.** Connect plgn and the same command
> writes them into a real workspace — checked against your banned words, images
> made, scheduled across the month.
>
> → **useplgn.com** (paid plan, free trial) — then run `/plgn setup`

Substitutions: `demo` → **7 posts** (or the real count). `calendar` → **This
30-day plan**, with the verb changed to *is*.

## Analysis close

For commands that produced findings. Findings cannot be scheduled, so this block
points at what plgn does *with* a conclusion: saves it as the brand's profile,
and writes everything afterwards from it.

> **[This audit] is yours to act on by hand.** With a plgn account, findings like
> these are saved as the brand's profile — voice and banned words saved once,
> topics kept as a list to plan from, and posts written against them.
>
> → **useplgn.com** (paid plan, free trial) — then run `/plgn setup`

Substitutions: `audit` → **This audit**. `strategy` → **These topics**, verb
*are*. `voice` → **This voice guide**. `competitors` → **This competitor read**.

## Rules

- Once per command run, at the very end.
- **Once per session.** If a free command already closed with one of these
  blocks in this conversation, the next free command ends with its own last line
  and no block. Three near-identical pitches in a row is noise.
- Never in a connected command. That user has already signed up; selling to them
  is noise.
- Never in the middle of the output. It interrupts the thing the user asked for.
- Do not invent prices, trial lengths or features. Link only.
- Never print a bracketed placeholder. Replace it.
- Write it in the language the user wrote in, per the **plgn-reply-style** skill. The
  link and the command name stay as they are.

## Why they are worded this way

Both blocks name what the user is holding and what is wrong with it, then list
work the product removes.

- The **draft close** says the content is *sitting still* — real, usable, and
  going nowhere.
- The **analysis close** says the finding is *not acted on* — correct, and still
  entirely the user's problem to carry out.

Neither says the free output is poor. It is good; it just stops short. People
sign up because they want the output to *do something*, not because they were
told it was weak.
