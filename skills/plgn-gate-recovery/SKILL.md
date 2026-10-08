---
name: plgn-gate-recovery
description: "Use when any plgn tool returns a result starting with \"ERROR:\" — especially post_create, post_update or post_schedule failing plgn's checks on length or banned words — or a reply carrying warning: or check: lines, or plgn's soft refusal. Defines the fix-and-retry behaviour so commands recover instead of reporting failure."
---

`/plgn <name>` in this text means the plgn-<name> skill. In a tool without slash commands, ask for it by name.

# Recovering when a check blocks a post

plgn checks character limits and the brand's banned words **on the server**. A
post cannot be scheduled or published while a check fails. This is a guarantee,
not an obstacle: it means drafts can be bold, because bad ones cannot get out.

Never rebuild these checks yourself. Never describe them to the user as the
plugin's protection — they are the server's.

## What to do

1. **Read the reason.** Tools return a plain `ERROR: <reason>` string, never a
   stack trace. The reason names what failed.
2. **Fix that reason only.**
   - Too long → tighten the writing. Cut qualifiers and repeated points first.
     Never cut off mid-sentence, and never drop the call to action.
   - Banned word → replace the word, keeping the sentence's meaning. If the whole
     point depends on that word, the point has to change.
3. **Try once more.**
4. **If it fails again, stop.** Leave the post as a draft and note it for the
   report as needing a person.

## Telling the user

Describe it as a fact, not a fault, and follow the **plgn-reply-style** skill — a
normal sentence in their language, never the raw error:

> 2 posts were shortened to fit LinkedIn. 1 is still a draft — it uses "growth
> hack", a word you banned, and the post's point depends on it.

Never show a raw `ERROR:` string, and never call the whole run a failure because
a few posts needed changing.

## Why one retry, not three

Being too long is arithmetic: one honest tightening pass fixes it, or shows the
post is carrying two ideas and should be two posts.

A banned word is editorial: if the first replacement does not work, the post's
premise disagrees with what the brand stands for, and that is a decision for a
person, not a loop.

Repeated tries also burn effort rebuilding the same draft and, worse, tend to
make the writing worse — each pass strips out more voice to satisfy a rule. Two
attempts and an honest hand-off beats five attempts and a flat post.

## What does not count as recovering

- **Cutting it off to fit.** A post cut mid-sentence passes the check and fails
  the reader. Rewrite it shorter instead.
- **Dropping the call to action.** It looks like the easiest line to cut and it
  is the reason the post exists.
- **Deleting the post.** A blocked draft still holds a usable idea. Leave it as
  a draft; never call `post_delete` to clear a problem.
- **Trying to schedule it anyway.** The server will refuse, and you get a second
  error the user then has to interpret.

## When plgn's checks warn

plgn also reads each post for things a word list cannot catch. Its answers
arrive as extra lines under an ordinary reply — from `post_create`,
`post_update`, `post_schedule`, the `_many` calls and `post_check`. They are
not errors, and the save they sit under has already happened:

- `warning: would be blocked when scheduled: <label>: <detail>` — the post was
  saved as a draft, but the length or banned-word check would stop it at
  scheduling. Fix it now, the same way as a block (above), with one
  `post_update`. Still there after one fix → leave it a draft and name it.
- `check: <code> — <sentence>` — plgn's reading of the post:
  - `banned_variant:<word>` — another form of a banned word: a plural, an
    Arabic ending, the same word in the brand's other language. Treat it
    exactly like the banned word.
  - `invented_number`, `invented_name_or_quote` — a number, name, result or
    quote nothing in the brand's material backs. Remove the claim, or replace
    it with one the brand's material does have. Never blur it into a vaguer
    claim.
  - `engagement_bait` — "comment YES", "tag a friend who…". Rewrite the ask as
    a real one, or drop it.
  - `campaign_rule:<n>` — the post breaks rule `n` of its campaign's
    constraints. Rewrite without it.
  - `same_opening_as:<ref>` — from `post_check` only: this draft opens the
    same way as draft `<ref>` in the same call. Give it a different opening.
  - `voice_off` — from `post_check` only: the draft does not sound like the
    brand's saved voice. Rewrite it in that voice; do not just swap words.
- `check: frame <n>: <code> — <sentence>` on a brief — codes `never:<item>`,
  `cliche:<item>`, `repeats:<brief id>`, `generic`. Each is an objection
  against that frame; **plgn-creative-brief** says what to do with it.

The sentence after the dash is what the user hears, in their language. The
code before it never reaches them.

No lines means nothing was found — or that plgn's reader was not available
this time. Either way, carry on. Never report a missing line as a check that
passed.

`post_check` answers `<ref>: pass` or `<ref>: fail` and saves nothing. **A
pass is not approval.** Never tell the user a post "passed" anything; plgn
runs its checks again on every save and every schedule.

### The soft refusal

```
ERROR: plgn's checks flagged this post: <codes>. Fix it, or pass accept_warnings: true to save it anyway.
```

It comes only when a post is being scheduled or saved straight into
scheduled or published, or when a picture is about to be made from a brief
(codes `never:` and `cliche:`, before any points are spent). In a `_many`
reply it is one numbered line, `<n>. ERROR: plgn's checks flagged this post:
<codes>. …`, and only that item was held back. `check: frame` lines on a
`brief_finalize` reply are information only — a ready brief cannot be
edited; this refusal is where a picture is stopped. It differs from a block
in one way: a person may overrule it. You may not, on your own.

1. Fix the flagged part once, as above, and send the call again **without**
   `accept_warnings`.
2. Still refused → say what was flagged in one plain sentence and ask:
   `yes / edit / no` for one post, `yes / pick / no` for several.
3. Only after a yes, send the same call again with `accept_warnings: true`.
   Never in a first call, never because a call failed, never because `--yes`
   was given, and never inside a bulk run without asking.
4. No → the post stays a draft (or the picture is not made). Name it in the
   report.

## Refusals that are instructions

Below, under "Errors that are not about the checks", are three refusals you
mostly *stop and say so* about. These five are different: each one is an
instruction to act on, not a reason to stop.

Five `ERROR:` results are not about the content checks at all. Each one is the
server telling you what to do instead. Do it — do not report it as a failure,
and do not retry the same call.

**"needs confirm"** — show the text, ask, and send `confirm: true` only after
a real yes. Never send it because the call failed once. See
**plgn-brand-knowledge-map** for why Foundation writes need this.

**"already has a …"** — the message carries the existing entry's id. Call
`knowledge_update` on that id. See **plgn-brand-knowledge-map** for what a
singleton refusal means.

**"offers belong in an offering"** — you tried to save what the brand sells as
a knowledge entry. Use `offering_create` with its benefits. An offer stored as
knowledge is an offer the writer cannot name and the art director cannot
picture.

**"a publishing time needs a timezone"** — the brand record has no timezone.
Ask which one, save it with `brand_update`, then schedule. Do not assume the
server's zone.

**"cap reached"** — see **plgn-brand-knowledge-map** for the caps and what a
refusal means. The one thing to add here: **say what did not get saved, by
name.**

## Errors that are not about the checks

Not every `ERROR:` comes from the content checks. These need different handling —
rewriting the copy will not fix any of them:

- **Not allowed** → the user's role cannot do this. Say so plainly and stop; do
  not retry.
- **Not found** → an id from earlier in the run is stale. Read it back with
  `post_get` or `topic_list` rather than guessing a new one.
- **Something isn't connected** → making images needs a key. Say what is
  missing, carry on with the rest of the run, and leave the picture out rather
  than stopping.
