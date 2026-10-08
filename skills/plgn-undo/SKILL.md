---
name: plgn-undo
description: "Take back the last batch of posts plgn created — unschedule them, or delete them entirely — after showing exactly what will go. Use for \"undo that\", \"take that month back\", \"I didn't want those\", or right after a run that came out wrong. Never touches anything already published."
---

`/plgn <name>` in this text means the plgn-<name> skill. In a tool without slash commands, ask for it by name.

# /plgn undo

`/plgn month` writes thirty posts on one keystroke. This is the way back.

Without it, a run that came out wrong costs half an hour of deleting things by
hand, and people stop trying runs at all. That is the real damage — not the
thirty posts, but the caution afterwards.

## 1. Check the connection

Call `workspace_info`. If it fails, print the message from **plgn-conventions**
rule 2 and stop.

## 2. Find the last run

Every command that writes in bulk stamps its posts with a run marker — see
**plgn-brand-knowledge-map**. `post_list` filters on it with `run`, and plgn has
two calls that act on a whole run at once.

1. **Find the marker.** If the user named a run, use that one. Otherwise
   find recent candidates the way `post_list` allows, twice, once per
   status. Only the scheduled call carries the recent window:

   ```
   post_list(status: "scheduled", scheduled_from: <30 days ago>, limit: 500)
   post_list(status: "draft", limit: 500)
   ```

   The two calls differ because a draft has no scheduled date, so a window
   would hide every one of them. A bulk run that needs undoing is almost
   always the last one. Each line prints ` · run: <marker>` when the post
   has one — read it off the lines, never open posts one by one. Markers are
   dated (`plgn-run-2026-09-07-1`): the latest date is the last run. If no
   line carries one, widen the scheduled call once — thirty days to sixty —
   and if that still finds nothing, drop `scheduled_from` and read the whole
   board.
2. **Read the whole run.** `post_list(run: <the marker>, limit: 500)` returns
   every post in it, each line with its status, its `images:` count and, when
   it has one, its ` · topic: <title>`.

**Published posts are never candidates.** They are out in the world; taking
them out of plgn changes nothing and loses the record. Say plainly that
published posts are excluded and how many there were.

If nothing carries a marker, say so — older posts were written before runs
were stamped, and those have to go one at a time by name.

## 3. Show exactly what would go

Never a count on its own. "Delete 28?" is not something anyone can agree to
safely.

```
Last run: 28 posts, saved 7 September

  24 scheduled · 4 still drafts
  22 have images
  none published

  Migration horror stories      9 posts
  Pricing without traps         8 posts
  Founder notes                11 posts
```

Every number comes off the `post_list(run: …)` lines: the status on each,
`images:` above zero for "have images", and the `topic:` field for the
per-topic lines. A post with no topic is counted under "no topic".

Then offer the two ways back, because they are very different:

```
Unschedule these 28 posts, or delete them?
unschedule / delete / no
```

- **Unschedule** — the posts stay, nothing goes out, the writing survives. This
  is what most people mean by undo, and it is the safe default. Offer it first.
- **Delete** — the posts are gone permanently. Their images stay in the
  workspace's image library.

**Recommend unscheduling.** Someone undoing a run is usually reacting to
timing, not to the writing, and rewriting thirty posts to fix a date is a bad
trade.

## 4. Do it

**Unschedule** — `post_unschedule_run(run: <the marker>)` first, without
`confirm`: it lists what would move. If that differs from what step 3 showed,
show the difference and ask again. Then the same call with `confirm: true`.
Every scheduled post in the run goes back to draft; nothing is lost and the
posts can be scheduled again later.

**Delete** — `post_delete_run(run: <the marker>, confirm: true)`, one call for
the whole run. Per **plgn-conventions**, deleting is confirmed by **name**, not by
number: name the run and say how many, and take a yes on that — before the
call, because this one has no preview.

Neither call touches a published post; plgn refuses to.

Deleting posts does not delete the images they used. Say how many images are
now unused, and that they can be removed from the plgn dashboard.

## 5. Report

```
28 posts unscheduled · nothing was published

They're still here as drafts. Reschedule with /plgn month, or delete them with
/plgn undo again.
```

If anything failed, name it and say what state it is in now. A half-undone run
is worse than none, so be exact about which posts are still scheduled.

`--dry-run` shows what would go and changes nothing.
**`--yes` is not accepted.** This removes work.

## Notes

- **No seam.** This user is already signed up.
- **One run per invocation.** Undoing three runs at once is how people lose
  work they meant to keep.
- **Never touch a published post.**
- **Never undo silently.** Even with `--dry-run` off, the list comes first and
  the answer comes second.
- Replies follow the **plgn-reply-style** skill, including the user's language.
