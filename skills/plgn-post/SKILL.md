---
name: plgn-post
description: "Draft one on-brand post from an idea, show it, and save it to your plgn workspace once you approve — scheduled if you want. Supports --yes to skip the confirmation. Use for \"post about X\", \"write a post\", or turning a single thought into content."
---

`/plgn <name>` in this text means the plgn-<name> skill. In a tool without slash commands, ask for it by name.

# /plgn post

One idea in, one post out. This is the command someone runs ten times a day, so
it stays fast and quiet.

## 1. Check the connection

Call `workspace_info`. If it fails, print the message from **plgn-conventions**
rule 2 and stop.

Call `context_get(role: "copywriter")`. One read: the voice, the banned
words, what the brand sells, and the campaign running now. If the brand has
no Foundation, send them to `/plgn setup` and stop — a single post still goes
out in the brand's name.

The brand record it returns carries the **languages** it publishes in, too.
Write the post in those languages — they are not necessarily the language of
the conversation. Someone writing to plgn in English may publish only in
Arabic.

Print nothing for this call. A check that passes is silent.

## 2. The idea

In the user's own words. If none was given, ask for one line.

**Which platform:** if they did not say, ask — one short question with the
brand's usual platforms as the choices. Do not pick one quietly; the same idea
is a different post on each platform.

**If the request names a campaign** — "a post for Ramadan" — call
`campaign_list`, match it by name, and pass `campaign_id` to both
`context_get` and `post_create`. The post then inherits that campaign's
offerings, and its writer is given the key message it has to say
differently.

A name that matches no campaign is a question, not a new campaign: say what
you found and ask. `/plgn campaign` is where one gets created.

**If they asked for a carousel** — "a carousel about X" — ask how many
frames if they did not say, defaulting to 3, never more than 10. The
platform decides the real ceiling, and it is not 10 everywhere: look it up
in **plgn-platform-specs** and clamp to it. One platform takes no carousel at
all, and there the answer is one picture, said plainly rather than a request
quietly ignored. Say the number back, and say it again when you run
`/plgn images` — that command costs and makes the frames asked for in its
own run, and cannot see a carousel decided here.

### The concept

Before any copy, settle the post's concept with `plgn-role-content-creator`,
briefed as **plgn-creative-brief** says: `context_get(role: "creative_director")`
(with `campaign_id` when matched), the reference index, and inside a campaign
its big idea. One `Job: concepts` call, ref `1`, its format `single` or
`carousel with N frames` from step 2. Run the talk first only when the
person's words ask for ideas; if they pick a carousel concept there, agree the
frame count as step 2 does. When the talk picked an idea, pass that idea's
format (quote card, before/after, reel cover, meme) with the agreed frame
count.

## 3. Write it

Start `plgn-role-copywriter` with the idea, its concept and the platform. Ask for
**one** post, written to the concept.

Per **plgn-conventions** rule 6, pass the `context_get` block from step 1 into
the prompt verbatim — the one read with `campaign_id` when a campaign was
matched — alongside the idea, the platform and its character limit. The
writer cannot read skills or this file.

Where the idea plainly suits more than one platform, write one and offer the
others afterwards. Do not quietly produce three.

### Check it before showing it

Call `post_check` with the one draft — `ref: "1"`, its captions keyed by
language, its platform, and `campaign_id` when one was matched. It saves
nothing and takes about a second.

- `1: pass` → carry on. Say nothing about it.
- `1: fail` → send the draft back to the writer once, with each problem as
  the sentence after the dash, never the code, and check the rewrite again.
  Still failing → show it in step 4 anyway, with the problem on a line under
  the post, so the user decides with it in view:
  `⚠ "40% faster" — nothing in your brand profile backs this number`.

A pass is not approval: never tell the user the post "passed". See
**plgn-gate-recovery** for what each line means.

## 4. Show it, then ask

Print the draft in full, with its length against the platform's target:

```
Idea: <visual idea> — <what it cites, by the reference's title, not its number>

LinkedIn · 1,140 characters

<full post text>

Save this post?
yes / edit / no
```

**Wait.** `edit` means take their change and show it again; do not argue with
it.

`--yes` skips this step. It is allowed here because one post is cheap, easy to
delete, and this command runs many times a day.

`--dry-run` stops here and writes nothing.

## 5. Save it

Call `post_create` as a draft. Carry `knowledge_used`, copied from the end of
the `context_get` read in step 1 — it is the only record of exactly what the
writer was told, and dropping it here is not a shortcut, it is the record
going missing. If the idea was a carousel, carry `planned_slides` too, from
the frame count agreed in step 2. Carry the concept in `notes`, as
**plgn-creative-brief** says (`Concept:` line).

The reply may carry `warning:` or `check:` lines — see **plgn-gate-recovery**. A
`warning: would be blocked when scheduled` line is fixed now, with the change
shown, so the post can go out when asked.

On `ERROR:`, follow the **plgn-gate-recovery** skill. Show the change and what moved
before trying again — for a single post the user is right there, and a silent
rewrite is worse than a visible one:

> "growth hack" is on your banned words list — I've used "shortcut" instead.

## 6. Schedule it, if asked

Only if the user asks, or says yes to one short offer. Call `post_schedule`
with their time, or the next sensible slot from the **plgn-posting-cadence** skill —
naming the slot you picked.

If plgn's checks stop it here, nothing is scheduled: say what was flagged in
one sentence and ask `Schedule it anyway?` with `yes / edit / no`. Only after
a yes, send the same call with `accept_warnings: true` — never on your own,
and never because `--yes` was given. See **plgn-gate-recovery**.

An unscheduled draft is a fine outcome. Never schedule without being asked.

## 7. Confirm in one line

```
Saved as a draft · LinkedIn · going out Tue 09:00
```

That is the whole report. No summary of what was written — they just read it.

## Notes

- **No seam.** This user is already signed up.
- **Speed is the feature.** Silent check, one draft, one question, one line
  back. Anything else added here gets paid for ten times a day.
- **Never batch.** Several posts from one idea is `/plgn repurpose`; a month is
  `/plgn month`.
- Replies follow the **plgn-reply-style** skill, including the user's language.
