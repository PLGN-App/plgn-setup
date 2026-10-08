---
name: plgn-queue
description: "Go through everything waiting in your workspace — posts blocked by plgn's checks, posts missing an image, posts too short to be worth publishing, and posts ready to go — then fix what can be fixed. Use for \"check my queue\", \"what needs attention\", \"what's blocked\", or a weekly look before content goes out."
---

`/plgn <name>` in this text means the plgn-<name> skill. In a tool without slash commands, ask for it by name.

# /plgn queue

Look at everything waiting and say honestly what state it is in.

This is the command that makes a workspace trustworthy. It must never say
"all good" without having actually gone through the list.

## 1. Check the connection

Call `workspace_info`. If it fails, print the message from **plgn-conventions**
rule 2 and stop.

## 2. Read everything

Call `post_list(limit: 500)`. Read **every** post in the period, not a sample.

Each line already ends with what this command needs, so nothing is opened one
post at a time: `gate:` with `ok` or the worst check that would stop it,
`images:` with how many pictures it has, `first:` with its first 80
characters, and — once plgn has labelled it — `opening:` and `mix:`, plus
`teaser` for a post that only points somewhere else. When some lines have no
`opening:`, call `post_label(post_ids: [<those posts>])` — a hundred ids at most per call — then read
`post_list` again with the same arguments.

`post_list` filters by `campaign_id`. When the user names a campaign, narrow
to it and say so. When they do not, group what is blocked by campaign, so
"the Ramadan posts are the ones stuck" is visible without counting.

Call `brief_list` too, to find posts whose brief stopped after three failed
checks — see **plgn-creative-brief**. Ask it for 100, which is as many as it
gives: it has no date filter and returns only the newest 20 otherwise, so
the default read would quietly miss a month's worth on a busy workspace. If
100 come back, say that the "needs a person" group covers the most recent
100 briefs rather than everything ever attempted.

If nothing is waiting, say so plainly and suggest `/plgn month`. Do not invent
findings.

## 3. Sort into five groups

Every post lands in exactly one:

**Blocked** — plgn's checks won't let it out: its line says `gate:` with
anything but `ok`. A banned word, too long, or a missing field. These cannot
go out, so they come first.

**No image** — ready or scheduled, but `images: 0`. Not fatal; worth knowing
before it goes out.

**Says too little** — technically fine but too short or too vague to be worth
publishing. A post that says nothing passes every automatic check and still
costs the brand attention. Start from the line: a post marked `teaser`, or
whose first line says nothing, is a candidate. Open only those with
`post_get` before judging — a first line is not the whole post. Judge this
honestly: does it make a point, or just fill a slot?

**Needs a person** — its brief failed the check three times and stopped. This
is not something running the queue again fixes: the direction kept landing on
things the brand's rules rule out, and it needs someone to pick a different
idea by hand. Name every post in this group.

**Ready** — nothing to do. Count them; do not list them.

## 4. Report

Counts first, then the exceptions by name. Never a wall of every post.

```
34 waiting · 28 ready

Blocked (2)
  "Why migrations fail"    — uses "growth hack", a word you banned
  "Pricing, honestly"      — 3,240 characters, LinkedIn allows 3,000

No image (3)
  "Q3 launch notes", "The 90-minute review", "What we got wrong"

Says too little (1)
  "Big news coming"        — 40 characters, no point, nothing to click

Needs a person (1)
  "Why we cut prices"      — failed its check three times

Fix the blocked ones?
yes / pick / no
```

## 5. Fix what can be fixed

For each blocked post, open it with `post_get` — the list shows only its first
line — and suggest a **specific** fix: the actual replacement wording, not
"make this shorter". Then apply what they approve with `post_update`,
following **plgn-gate-recovery**. A scheduled post may come back with plgn's soft
refusal; the fix was already approved, so say what is still flagged and ask
before sending `accept_warnings: true`.

For posts that say too little, offer a rewrite that makes the point the slot was
meant to carry. If there is no idea underneath, say so and suggest removing the
slot rather than padding it — an honest gap beats filler.

For missing images, hand off: *"Run `/plgn images` to fill these three."* Do not
make images here; that spends points and belongs to a command the user chose
for it.

For posts that need a person, do not offer a fix — there is nothing this
command can rewrite its way out of. Point at `/plgn why` for the thinking
behind the attempt, and leave the idea for someone to rework by hand.

`--dry-run` prints the report and changes nothing.

## Notes

- **No seam.** This user is already signed up.
- **Never say the queue is clean without reading it.** The single most damaging
  thing this command could do is report "all good" from a partial look.
- **Ask before changing anything**, per **plgn-conventions**. Show the fix, then
  apply it.
- **Never delete a post to clear a problem.** A blocked post still holds a
  usable idea. Deleting only ever happens when the user asks, confirmed by name.
- **Judge by the point, not the length.** A 90-character X post can be
  excellent; a 600-character post that says nothing is not.
- Replies follow the **plgn-reply-style** skill, including the user's language.
