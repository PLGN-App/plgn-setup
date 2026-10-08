---
name: plgn-image-prompting
description: "Use when making images for plgn posts — writing the description, and handling the generate_image then check_generation waiting cycle including slow jobs and points cost. Covers what makes a usable social image and when a post is better with none."
---

`/plgn <name>` in this text means the plgn-<name> skill. In a tool without slash commands, ask for it by name.

# Making images

Two separate things: writing a description worth spending points on, and
handling the wait that follows.

## Read the brand's look first

Before writing any image description, read the brand's visual direction:

```
context_get(role: "art_director", campaign_id: <the post's campaign, if it has one>)
```

The **plgn-visual-identity** skill owns what a direction contains and how it is
stored — it is a `brand_identity` entry, not a separate lookup. A campaign can
carry a look of its own, saved against the campaign; only a read with that
`campaign_id` sees it. Read once per campaign, not once per post and not once
for the run, and give each post the block of its own campaign. A post in no
campaign gets the brand's permanent look — a running campaign's reference is
never borrowed for it.

Read it before writing the description, not after.

When one exists:

- On `/plgn month`'s quick path, put its **promptPreamble** in front of the
  description, before the subject. On the brief path the designer's text
  already starts with it, so never add it a second time.
- Apply its **never** list as exclusions.
- Once **plgn-visual-identity** says a canonical reference exists, use
  `generate_image_from_image` with the saved **canonicalReference** instead of
  describing the style in words again — a reference image carries detail no
  sentence does.

When a frame is built around one of the brand's own things — a character, a
place, a person with consent — pass its id as `asset_ids` on
`generate_image_from_image` and never its URL. The server adds the asset's
main picture and records it; an asset marked not for AI pictures is refused
before anything is spent. See **plgn-brand-assets**.

When none exists, say so once in the reply and carry on. Then suggest
`/plgn visuals`, which works the look out from pictures the brand has already
published, so the next batch does not have to guess.

## Where the description comes from

The text handed to `generate_image` or `generate_image_from_image` is no
longer written here. It is the final image text from a **finalized brief** —
the four steps of benefit, meanings, idea and direction, checked and settled
before any points are spent. **plgn-creative-brief** owns all four steps and the
two calls that save them.

This skill starts once that text exists: it owns the wait for the image
those words produce, and what it costs.

## Don't just draw the caption

A post about wasted planning time does not need a picture of a calendar. The
literal illustration is the first idea and almost always the weakest — it adds
nothing the reader just read.

On the brief path the work runs as a chain: idea, order, words, execution.
`plgn-role-creative-director` writes the literal picture first and rejects it, then
scores one idea from each of five lenses. `plgn-role-art-director` turns the idea
into the order. `plgn-role-typographer` styles and places the words a frame carries,
when it carries any, and keeps every word as written. `plgn-role-designer` writes the final text in seven parts, in this
order, with the brand colour as an accent:

1. the preamble, without quotation marks
2. the school and the finishing signature
3. the concept, in one line
4. the scene: camera, framing, where things stand, light, styling, materials and people, grade, space for the words
5. the product
6. the words, as the typographer's block places them
7. the rules, ending on the priority line

**plgn-creative-brief** owns those steps. The aim is the mood of the argument, or
what it leads to rather than what it is about. Empty chairs after a meeting says
more about wasted meetings than a clock does.

## Think in the form, write in prose

A professional picture brief covers a long form: camera, place, light,
surfaces, people, what matters most. It is the right checklist and the wrong
shape for a prompt. Image models read plain sentences; headings, labels and
brackets burn the budget (4,000 characters, and some models take only 1,000).

`plgn-role-designer` answers eight questions before it writes, then writes the
answers as sentences:

1. What is the frame of, and what does it do?
2. Where is the camera: height, distance, focal length as a number, and what
   is sharp? No camera or lens brand names.
3. Where does each thing stand, and what must not move or double?
4. Where does the product sit on the grid, and where do the words go (where
   the typographer's placement lines put them)?
5. What is the light?
6. What is each surface?
7. Who is in it, and what one thing are they doing?
8. What gives first? The priority line, word for word, last.

When the model takes only 1,000 characters, the designer cuts in this order:
style words, then materials, then people detail, then light detail. Never the
label, the words, the product or where things stand, and the priority line
stays last.

## When to make nothing

Ask plgn first, for every candidate in one call:

```
picture_need(post_ids: [<the posts>])
```

Fifty ids at most per call. One line per post: `<id> · need|skip · <reason>`,
sometimes ` · asset: <asset id>` — one of the brand's own things the post is
about. plgn judges each post with its own campaign. Take `skip` as the answer.
The reasons, in plain words: `shows_offer` shows what the brand sells,
`shows_place_or_person` shows a place or a person, `steps_or_before_after`
shows steps or a before and after, `text_argument` is a written argument that
reads stronger plain, `stock_only` would only ever look like stock.

Skip the image, and say why, when:

- plgn said `skip` — say its reason in plain words.
- The only description you can write is generic, and the result would look like
  stock. A stock-looking image costs points *and* some credibility.
- The brand has no image setup. Say so; do not retry.

Spending no points is a valid outcome. Report it as a decision, not a failure.

## The waiting cycle

`generate_image` **returns a job number, not an image.** Treat it as a job to
check on.

1. Call `generate_image` — keep the job number it returns.
2. Check with `check_generation` every **5 seconds**.
3. Stop checking after about **90 seconds** (about 18 checks) per image — but
   read what the last check said before deciding what that means.

`check_generation` reports `pending` with a **phase**. `waiting` or `queuing`
means the job is in line at the image service and can take several minutes;
`generating` means it is nearly done. A job that is still `pending` after 90
seconds **has not failed** — the points are already committed and the picture
will usually arrive. Only a `failed` result is a failure.

If it is still pending when you stop checking:

- Leave the post's picture slot empty for now, and keep the job number.
- Report it as **still running** — "still running, check again later" — never
  as failed. Give the post and the job number so it can be checked later with
  `check_generation`.
- **Carry on.** A missing image never blocks scheduling — a post that goes out
  text-only is fine; a month that stalls waiting on a picture is not.

If it failed, leave the slot empty and note the post and the reason for the
report.

Never wait forever, and never abandon a job without saying so. A silent stop
looks exactly like a post nobody wanted a picture for.

## Doing many at once

When making images for several posts, start **all** of them first, then check on
them. Going make → check → make → check one at a time turns a 90-second worst
case into half an hour.

Apply the same 90-second check window per image from the moment *that* image started,
not from when you began checking.

## Points are real money

Making images draws down the workspace's **points**. The cost is not one point
a picture: each image model has its own price. Call `workspace_info` and read
the `Image points` line (used, included, purchased) and the `Image models`
list (each model's points) — never assume a cost or a balance.

- **Say the cost before making anything**, in the plan, not after — frames ×
  the points of the model you will use.
- Where the number is more than they have, say so and make images for the most
  valuable posts rather than stopping partway with no explanation.
- Never remake an image just because the first one was dull; that is a second
  payment for a small gain. Remake only when one genuinely failed. A picture
  that is physically wrong (a leak, a floating object, six fingers) is a failed
  picture and may be remade, once its points are said and the person says yes;
  a dull one is not.

## Alt text

Every image gets alt text. It describes what is visibly in the picture in one
sentence, starts with the subject, leaves out "image of", and never repeats the
post. On the brief path `plgn-role-designer` writes it per frame, `brief_finalize`
saves it, and plgn copies it onto the picture when `check_generation` reports
it done — no `post_update` is needed for it. `/plgn month`'s quick path has no
brief, so there the command writes it and passes it as `alt_text` on the
generate call; plgn copies it onto the picture the same way.
