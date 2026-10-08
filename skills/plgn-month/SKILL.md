---
name: plgn-month
description: "Fill a plgn workspace with a month of on-brand content — picks topics, writes posts in parallel, makes images, and schedules everything after your approval. Reuses topics you already have instead of creating duplicates. Supports --dry-run, --no-images and --max-images. Use for \"a month of content\", \"fill my calendar\", or \"plan next month\"."
---

`/plgn <name>` in this text means the plgn-<name> skill. In a tool without slash commands, ask for it by name.

# /plgn month

Take a subject and leave the workspace with a month of scheduled, illustrated,
on-brand posts.

This command writes real data to a real account. Everything below is built
around that: plan first, ask once, write carefully, report honestly.

## 1. Check the connection

Call `workspace_info`. If it fails, print the message from **plgn-conventions**
rule 2 and stop.

Then call `context_get(role: "marketing_manager")`.

That is one read and it returns the brand in a fixed order: the record — with
the **languages** and the **timezone** this command must not guess — then the
voice and audience, then what the brand sells, then any campaign running now.

The languages are the brand's, not the user's. Someone writing to plgn in
English may publish only in Arabic.

**If the brand has no Foundation, stop and send them to `/plgn setup`.** Do
not work a voice out from a website here. Guessing is the free layer's
compromise; a connected user has a real profile one call away, and thirty posts
in a guessed voice is thirty posts to redo.

## 2. Look at what's already there

**Call `topic_list` before deciding anything.** A workspace usually already
holds topics — campaigns, launches, themes — and this command must build on
them rather than making a second copy.

- **The subject matches an existing topic** → call `topic_get` on it. You now
  have its description and every post already in it. Plan around that: fill the
  gaps, do not repeat what is there. Say which topic you are adding to.
- **No argument was given** → show the list and ask which one:

  ```
  Which topic should I plan for?

    1  Ramadan 2026        12 posts (4 scheduled)
    2  Migration stories    8 posts (8 published)
    3  Something new

  yes / pick / no
  ```

- **Nothing matches** → say so, and say you will make a new topic.

**Never call `topic_create` for a name that already exists.** Running this
command twice must not leave two topics with the same name.

Note: `topic_list` returns names and counts, not descriptions. Use `topic_get`
on the one you are going to use.

**Call `campaign_list` too.** A subject that matches a campaign is planned
*inside* it, which changes three things:

- every post carries `campaign_id`
- every post inherits the campaign's offerings
- every writer is given the campaign's key message, the words it must not
  use, and the words to reach for

Say which campaign you are planning inside, in the plan, before anything is
written. A month planned inside the wrong campaign inherits the wrong
constraints thirty times.

Inside a campaign, read its big idea too:
`knowledge_get(type: "reference", campaign_id: <id>, keyword: "Creative platform")`.

If the subject matches no campaign, that is ordinary. Plan without one and
say so — do not offer to create one here. `/plgn campaign` does that, and
creating a container as a side effect of filling it is how a workspace ends
up with four half-empty campaigns.

## 3. Show the plan, and stop

Work out the shape of the month, then show it as a short table:

```
Topics:     <name> · <name> · <name>
Campaign:   <name, or "none">
Big idea:   <its one sentence, or "none yet — think first?">
Platforms:  LinkedIn, X, Instagram
Languages:  <the brand's, from its record>
Posting:    <n>/week — <n> posts total
Images:     <n> to make — <n> points, leaving <n>
Dates:      <start> → <end>, <timezone>
```

Four of those lines exist to be corrected. Languages and timezone come from the
brand, not from the conversation, and both are invisible when wrong. The points
line says what is left afterwards, because that is the number people decide on.
Work it out from `workspace_info`: the `Image points` line is the balance, and
each image model has its own points price — never assume one point a picture.

The `Images:` figure already reflects `--no-images` and `--max-images` — zero
with the first, no more than the number given with the second — and it is an
upper bound either way, because a picture reused from the workspace costs
nothing. Both controls are described in section 7; the number here is the one
being approved.

When the plan shows "none yet — think first?", answering **think first**
instead of yes runs the talk from **plgn-creative-brief**, "The concept comes
first". Inside a campaign it ends with the big idea saved after its own yes;
outside one it saves nothing: its five lines go into the concepts prompt as
`Big idea:` under `## The campaign`, for this run only. Then show the plan
again.

Where the topics are new, get them from `plgn-role-strategist` using the subject and
the brand's saved knowledge. Where you are adding to a topic that already
exists, say so.

**Wait for a clear yes. Nothing is written before this point.**

```
Create these <n> posts?
yes / pick / no
```

`--dry-run` ends here: print the plan, write nothing, and say so.

Stop on a flag you do not recognise, and say which one. A misread flag spends
points on the wrong posts — `--no-image` is not `--no-images`, and reading it
as nothing at all is a full month of pictures the user asked you not to make.

State the image cost in the plan, not afterwards. It spends real points, and
it is the part a user is most likely to want reduced.

**`--yes` is not accepted by this command.** It spends points and writes in
bulk.

## 4. Write, all at once

First start `plgn-role-content-creator` **once for the whole month**:
`Job: concepts`, one `## Posts` line per planned post with refs `t1-1`,
`t1-2`…, briefed as **plgn-creative-brief** says. Give it its own progress line. It
returns one concept per post, in order; if the count differs, run it once
more.

Then start one `plgn-role-copywriter` per topic, **at the same time**, each with
its posts' concepts. Tell each writer to write exactly one post per concept,
in order, on the concept line's platform. Match each draft back to its concept
by platform and hook, never by position. A draft that matches no concept is
saved without a `Concept:` line and named in the report.

Print one line before this starts and one before the images, per
**plgn-reply-style** rule 5b — writing and illustrating are the two phases long
enough that silence reads as a crash:

```
Writing 28 posts across 3 topics...
```

Per **plgn-conventions** rule 6, each writer's prompt carries what it needs, and
the way to build it is one call:

```
context_get(role: "copywriter", campaign_id: <the campaign, when there is one>)
```

That block holds the voice, the banned words, what the brand sells with each
benefit's meanings and clichés, and — when there is a campaign — its key
message, constraints and vocabulary. Pass it into the prompt verbatim,
alongside the topic, the platforms, their character limits, the brand's
languages, and how many posts to write. Add the concepts in order. Each post is
written to its concept: the hook opens it, the call to action closes it, and the
format decides its shape.

Agents cannot read skills or see this file. Whatever is in the prompt is the
whole world the writer works in.

A brand with two languages gets each post written in both, saved as captions
keyed by language — not one caption with a translation underneath.

If a writer returns fewer posts than asked because the topic was thin, take the
shortfall. Do not ask again — a thin topic is information about the plan, and it
belongs in the final report.

### Check the batch before saving

When every writer has returned, check the whole batch in one call — all
topics together:

```
post_check(drafts: [{ ref, captions, platforms, campaign_id }, ...])
```

`ref` is any label you can match back to a draft — `t1-3` for topic 1's third
post. `captions` is keyed by language, the way the post will be saved. Carry
`campaign_id` on every draft planned inside the campaign, so plgn checks it
against that campaign's rules. Fifty drafts at most per call; split a longer
month. It saves nothing. The reply is one block per draft: `<ref>: pass`, or
`<ref>: fail` with its `warning:` and `check:` lines — see **plgn-gate-recovery**
for what each one means. Because the whole batch goes in one call, plgn also
compares the drafts with each other: `same_opening_as:<ref>` marks a draft
that opens like an earlier one, and `voice_off` one that does not sound like
the brand. Both go back to their writer like any other problem.

For each draft that fails, send it back to the writer of its topic once, with
each problem quoted as the sentence after the dash — never the code. Then
call `post_check` again on the rewritten drafts only.

A draft still failing after that one rewrite is **held back**: it is saved as
a draft in step 5 but never scheduled in step 8, and the report names it with
the issue in plain words. A draft flagged `invented_number` or
`invented_name_or_quote` is held back unless the rewrite removed the claim
entirely.

A pass is not approval. Never tell the user a post "passed" a check. plgn runs
its checks again on every save and every schedule.

## 5. Save

Call `topic_create` **only for topics that do not already exist**. Then save
every post in one call, as drafts:

```
post_create_many(posts: [{ ...one post_create's arguments... }, ...])
```

Each item takes exactly what `post_create` takes. Fifty at most per call;
split a longer month. One failed item never stops the others.

`post_create` also takes `campaign_id` and `offering_ids`. Set the campaign
when the month is planned inside one, and set the offerings from each post's
own `offeringNames`, matched against the offerings you were given, never
invented. Carry `knowledge_used` on every `post_create` too, copied from the
end of the `context_get(role: "copywriter", …)` read that briefed the writer
who wrote this post — it is the only record of exactly what the writer was
told, and dropping it here is not a shortcut, it is the record going missing.
Carry each post's concept in `notes`, as **plgn-creative-brief** says (`Concept:`
line).

When the plan marked a topic's format as a carousel — a `postType` carrying
`plannedSlides` — pass that number as `planned_slides` on posts written to
that format. When you cannot tell which draft was written to that format, do
not guess: save the post with no `planned_slides` and name it among the
report's exceptions — a missing frame count is a visible gap someone can add
later; a carousel bound to the wrong post is invisible, and nothing
downstream ever catches it.

**Stamp every post in this run with the same run marker**, per the
**plgn-brand-knowledge-map** skill. It costs nothing, the reader never sees it, and
it is the only thing that makes `/plgn undo` able to take this run back. A
month saved without it can only be undone by hand, thirty posts at a time.

**Record the ids the reply returns.** It has one line per item, numbered in
the order you sent them — `<n>. ok <id>` or `<n>. ERROR: <reason>` — with that
item's `warning:` and `check:` lines indented under it. Match each id to the
n-th post you sent, and never guess one. If a later step needs a post you
cannot identify, read the run back with `post_list(run: <this run's marker>)`.

Nothing is scheduled until step 8.

## 6. Handle anything that fails

On any `ERROR:` — for the whole call or for one numbered item — follow the
**plgn-gate-recovery** skill. A failed item is fixed and saved on its own with
`post_create`; the others are already saved. A
`warning: would be blocked when scheduled` line under a saved item is fixed
now with one `post_update`, per the same skill, or the post is held back.
Describe the outcome using **plgn-reply-style** rule 6 — a normal sentence, never
the raw error.

**Never stop the whole run for one post.** Twenty-nine good posts and one honest
hand-off is a successful run. Track anything left as a draft for the report.

## 7. Images

Say the phase is starting and how long it takes, per **plgn-reply-style** rule 5b:

```
Making 24 images — this takes a few minutes...
```

### How many pictures to make

`--dry-run` spends nothing at all. Between that and a full run there are two
controls, and they combine:

- `--no-images` — plan, write and schedule, and make no pictures. The posts
  are saved without media and `/plgn images` can fill them later, with a brief
  behind each one.
- `--max-images 8` — make at most this many, best candidates first, and say in
  the report which posts went out without one.

Say the number you are about to spend before spending it, not after.

### Look for a picture that already exists

Call `list_images(max: 50)` before generating anything. **Reuse costs nothing
and a new picture costs points**, so a usable match already in the workspace
is always the better answer.

Make this call **once for the run, not once per post**: `list_images` takes no
search word, so every post would get the same list anyway. Hold what comes
back and match each post against it. Pass `folder` only when the brand keeps
its pictures in a named subfolder — the read is already scoped to this brand,
so a brand name or id passed here matches nothing at all.

The default is twenty-five and fifty is the ceiling, so `max: 50` is as much
as this check can ever see — a genuine check, not a guarantee — see
**plgn-brand-knowledge-map**. When nothing matches, say so in one line and carry on
to generate.

Reuse a match only when it actually fits this post's subject. A picture that
is merely on-brand is not a picture of the right thing, and a wrong reuse
costs more than points — it costs the post.

### Which posts get a picture

Ask plgn once for the whole run, with the ids saved in step 5:

```
picture_need(post_ids: [<every post saved in step 5>])
```

Fifty ids at most per call; split a longer run. One line per post: `need` or
`skip`, a reason, and sometimes ` · asset: <id>`. plgn reads each post with
its own campaign, which is why step 5 saved `campaign_id` first. Take `skip`
as the answer and spend no points on that post — name it in the report with
its reason in plain words (see **plgn-image-prompting**). With `--max-images`, the
best candidates first are `need` posts whose reason is `shows_offer`,
`shows_place_or_person` or `steps_or_before_after`.

If the call answers `ERROR:`, say so in one line and treat every post as
needing one; the plan's image number is still the ceiling.

### The brand's look, once per campaign

Group the posts that need a picture by campaign, and read the look
**once per group**:

```
context_get(role: "art_director", campaign_id: <the group's campaign>)
```

and once with no `campaign_id` for the posts that belong to no campaign.

Not once for the whole run: two posts in different campaigns want different
references, and a campaign's own look — a `reference` saved against that
campaign by `/plgn visuals` — is held against that campaign, so a read made
without its `campaign_id` cannot see it at all. Use each group's block for
that group's posts only. A post in no campaign gets the brand's
**permanent look**: in the no-campaign read, a reference listed under a
running campaign belongs to that campaign's posts, never to this one.
`/plgn images` reads the look the same way, for this reason.

For each post that needs one, **write the image description yourself** — it is
not written anywhere else on this path. One paragraph: the subject, the
composition, the light, the medium, the brand colour on one or two things, and
what must not appear. Never the caption drawn: write it from the post's
concept — its visual idea, its product's role, and the take and leave of the
reference it cites — rather than restating the post's words, put the preamble
of the `art_director` block read for this post's campaign group in front of
it, and carry that block's `never` list as exclusions.

**4b. Words in a picture.** This quick path draws no words, except for a post
whose concept format is made of words — a quote card, a reel cover or a meme.
That picture carries the concept's hook exactly as saved, and nothing else.
For it, send `plgn-role-typographer` the group's `art_director` block in place of an
order (a look that names no type system counts as TYPE NOTES "designer to
propose"), the hook, the post's `Concept:` line (its visual idea and the
product's role), and the platform and ratio. Write its system, styling, concept
and each placement line, with the hook in quotes, into the image description as
given. For Arabic, add a letter-by-letter line for each easily confused
letter, unquoted, and say it is not to be drawn. If it answers with a
`question` (two type systems), ask the person once for the whole run, before
the first such picture, and use the answer for every one. A `fit` never stops
the run: the hook stays as saved, and step 9 names the line and the shorter
one.

Write the post's **alt text** at the same time, one per language the brand
publishes in: what the picture will show, in one sentence, starting with the
subject, leaving out "image of", never repeating the post. This quick path
has no brief, so nothing else writes it; it travels on the generate call.

The same read lists the brand's **Assets**. When the post is plainly about
one of them — the mascot's tip of the week, a day at the shop, or the one
`picture_need` named on the post's line — and the asset's line in the read
says the AI may use it, build the picture around it: refer to it by its role
("the character from the reference image"), carry its own `never` list, and
pass its id as `asset_ids` on `generate_image_from_image`. At most one or
two on this quick path. Never invent one the read does not list. See
**plgn-brand-assets**.

This is the quick path, on purpose. A picture worth working the idea out
for first — every idea considered, the ones that lost kept with their
reasons, and a check against the brand's rules before any points are spent —
is what `/plgn images` is for. Point at it in the report; do not rebuild it
here.

The reference path is brand-level, not per-agent: when the brand holds a
canonical reference, call `generate_image_from_image` with it. Otherwise
call `generate_image`. See **plgn-visual-identity** for why the two are
different.

Carry `post_id` and `alt_text` on every call — `alt_text` keyed by language,
as written with the description. plgn then puts the finished picture on the
post by itself, with its alt text, whether `check_generation` or plgn's own
finish gets there first.

**Making an image takes time.** `generate_image` and `generate_image_from_image`
both return a job number, not an image. Check with `check_generation` on the
schedule in the **plgn-image-prompting** skill.

If it takes too long, leave the image out for now, note the post for the
report as **still running** (never as failed, while the check still says
waiting, queuing or generating), and **carry on** — a missing image never
blocks scheduling. A post that goes out text-only is fine; a month that stalls
waiting on a picture is not.

**Every picture gets alt text.** A new picture carries it from the generate
call — plgn puts it on the post with the picture, so there is nothing to save
afterwards. A picture reused from the library is not generated, so it is the
one case that needs a save: `post_update` with `media` holding that picture —
its `secure_url` and `public_id` from `list_images` — and the alt text in its
`alt` field. `media` replaces the post's list, which is safe here because a
post saved in step 5 held no picture before. This is the plugin's busiest
image path, so an image saved here without alt text is most of a month
unreadable to anyone using a screen reader.

## 8. Schedule

Work out a date and time for every post across the agreed dates, following
the **plgn-posting-cadence** skill for spacing and platform mix, then schedule
them in one call:

```
post_schedule_many(items: [{ post_id, at }, ...])
```

Fifty at most per call. Posts held back in step 4 stay drafts and are not in
the list. The reply has one numbered line per item, like step 5's. An item
plgn's checks flag comes back as its soft refusal — see **plgn-gate-recovery**: it
stays a draft, and nothing else stops. Never add `accept_warnings` on your
own.

When some were flagged, ask once, after the rest are scheduled:

```
2 posts were held back by plgn's checks — "Ramadan hours" says "40% off"
and nothing in your brand profile backs that number.
Schedule them anyway?
yes / pick / no
```

On yes, send those items again with `accept_warnings: true`. On no, they stay
drafts and the report names them.

Do not put one topic all in the same week. If there are fewer good posts than
slots, schedule fewer — cutting beats padding, and the plan already told the
user how many to expect.

## 9. Report

Counts first, then the exceptions by name, then the link. Step 7 makes **one
picture per post**, carousel or not — so count pictures, never frames this
run did not make, and name every post whose carousel is unfinished: the ones
that got a cover and still need their other frames, and the ones saved with
no frame count at all because step 5 could not tell which draft they were.

```
28 posts scheduled across 4 weeks · 3 topics · 24 images — one per post

  1 was planned as a carousel and has its first picture only — run
    /plgn images and ask for a carousel to make the rest
  1 was planned as a carousel but I couldn't tell which draft it was, so it
    was saved with no frame count — worth setting by hand
  2 were shortened to fit LinkedIn
  1 is still a draft — it uses "growth hack", a word you banned, and the
    post's point depends on it
  1 is still a draft — it says "40% faster onboarding" and nothing in your
    brand profile backs that number
  1 has no image — that one took too long; the post goes out without it
  1 quote card's line "<the hook>" is long for its frame (<post title>) — a
    shorter one: "…"; /plgn images can remake it

Review at useplgn.com
```

Never print a raw `ERROR:`. Never call the run failed because a few posts
needed a person.

## If the run stops halfway

If a tool goes down, the user interrupts, or a limit is hit — **say exactly
what is in the workspace right now**: what was created, what was scheduled,
what is still a draft.

A user must never have to guess what was saved. That is the difference between
a run they can pick up from and one they have to clean up by hand.

## Notes

- **No seam.** This user is already signed up.
- **Ask once, not thirty times.** Confirm the plan in step 3, then run. Do not
  stop for each post — that is what the plan was for.
- Replies follow the **plgn-reply-style** skill, including the user's language.
