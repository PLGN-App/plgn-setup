---
name: plgn-images
description: "Find posts with no image, plan and make one for each, and attach the results — with the points cost stated before anything is spent. Supports --dry-run and filters (campaign, platform, status, dates, title word). Use for \"generate images\", \"my posts need images\", or filling in artwork before a month goes out."
---

`/plgn <name>` in this text means the plgn-<name> skill. In a tool without slash commands, ask for it by name.

# /plgn images

Fill the empty image slots, on purpose and at a stated cost.

## 1. Check the connection

Call `workspace_info`. If it fails, print the message from **plgn-conventions**
rule 2 and stop.

Check the image setup from the same `workspace_info` result. Images are paid
for in **points**, and the cost depends on the image model — `workspace_info`
lists every model with its points, and the `Image points` line shows what is
used and what is left. Read both; never assume one picture costs one point. If
no points are left, say so and stop — point them at billing in the dashboard,
never ask for a key in the terminal. Same for Cloudinary (the `Integrations`
line): without storage, new images have nowhere to live.

## 2. Find the gaps

Call `post_list`. Every line ends with ` · images: N` — how many pictures that
post already has — so the posts with no picture are the lines that say
`images: 0`. Read it straight off the list.

Never pair the list against `list_images` to work this out: it returns at most
fifty pictures for the whole workspace, so on a busy board the pairing is
wrong, not only wasteful. `list_images` answers a different question — is
there a picture already in the workspace worth reusing — and that is
`/plgn month`'s reuse pass, not this command's job.

With no filter this fills the **whole board**. Pass `limit: 500` so a long
board is not silently cut at the tool's default of fifty.

### Narrowing the run

Filters combine — each one narrows what the last left. Read them off what the
user typed and pass them straight to `post_list`:

| Typed | Passed to `post_list` |
|---|---|
| `--campaign "Ramadan 2027"` | `campaign_id` |
| `--platform instagram` | `platform` |
| `--status draft` | `status` |
| `--from 2026-10-01 --to 2026-10-31` | `scheduled_from`, `scheduled_to` |
| a plain word | `search` — matches post titles only, case ignored |

`post_list` takes a campaign **id**, never a name. Resolve the name with
`campaign_list` first. If it matches none, or more than one, print what you
found and stop — do not pick one for them.

Stop on a filter you do not recognise, and say which one. A misread flag
spends points on the wrong posts.

Say what you found, and name the filter on the same line, so a narrowed run is
never read as an empty board:

```
7 posts have no image in "Ramadan 2027" · 24 points available
```

With no filter, the same line without the campaign clause.

## 3. Decide which deserve a picture

Not every post should have a picture. Ask plgn once for every candidate:

```
picture_need(post_ids: [<every candidate>])
```

Fifty ids at most per call; split a longer list. One line per post: `need`
or `skip`, a reason, and sometimes ` · asset: <id>` — one of the brand's own
things the post is about. plgn judges each post with its own campaign, so a
campaign post is weighed against that campaign, not only the brand's
permanent look. `skip` is the answer: that post gets no picture. Keep each
`asset:` id for section 5.

If the call answers `ERROR:`, say so in one line and treat every candidate as
needing a picture — section 4 still asks before anything is spent.

Say which ones you are skipping, rather than quietly leaving them out:

```
2 posts read better without a picture — long arguments where a stock-looking
image would cost more than it adds.
```

## 4. Say what it costs, then ask

**Before any thinking starts.** The frame count this bill uses is the frame
count section 5 will actually make — this command decides it, not reads it
back from somewhere else. Unless the user asked for a carousel when running
this command, every post left after section 3 is one frame. When they did
ask, use the count they gave for those posts (default 3, never more than
10) and say which posts are carousels.

The post's platform sets the real ceiling, and it is not ten everywhere —
one platform allows far fewer, and one takes no carousel at all. Look the
number up in **plgn-platform-specs** and clamp to it *before* the cost sentence,
so nobody is billed for frames that cannot be published. Where a platform
takes none, that post is one picture; say so rather than silently dropping
the request.

A carousel planned earlier by `/plgn month` cannot be seen from here, so
unless the user asks for one in this run, a post is costed and made as one
picture:

```
8 pictures for 5 posts — one is a carousel on X, asked for in this run and
cut from 6 frames to 4, which is all X allows.
8 points at 1 point each, leaving 16.
yes / pick / no
```

Images spend from a real balance, and this states the whole run's bill, not
one post's. Work the bill out from the points `workspace_info` gives for the
model you will use — frames × that model's points. If the number is more than the workspace has, say so and offer to
do the most valuable posts rather than stopping halfway with no explanation.

`--dry-run` stops here and spends nothing.
**`--yes` is not accepted by this command.** It spends points.

## 5. Per post: read, think, check, save

Once the user says yes, work through the posts one at a time, in this order,
for each one. This is the **plgn-creative-brief** skill's four steps in two calls
— read it before changing anything here.

1. Read `context_get(role: "creative_director", campaign_id: <the post's
   campaign, if it has one>)`.
2. Send `plgn-role-creative-director` that block, the caption, the offering's
   benefits, the campaign's constraints and vocabulary if this post runs
   inside one, the `Already done` lines from the read, the **Assets**
   section of that same read, the `asset:` id `picture_need` gave this post
   if it gave one, the post's concept when its notes carry a `Concept:`
   line (read it with `post_get`), and the frame count settled in section 4, which beats the concept's shape. Per **plgn-conventions** rule 6, all of it goes in the
   prompt — the agent cannot see this file. End the prompt with the line
   `An art director takes this idea next.` A `question` answer (two
   directions) is put to the person in plain words, the director starts
   again with their answer, and later posts of this brand in the run get the
   same answer. A `missing` other than none is named in section 8.
3. Call `brief_create` with what it returned, naming only the six keys it
   takes (`benefit_label`, `meanings`, `candidates`, `concept`,
   `concept_why`, `slides`) and keeping the rest of the answer for the art
   director, plus `post_id` for the post
   being illustrated, its `campaign_id`, `offering_ids` and `topic_id`
   where the post has them, and `knowledge_used` copied from the end of the
   `context_get` read. **`post_id` is not optional in practice.** Without
   it the brief is never joined to its post: `/plgn why` finds nothing to
   read back, `/plgn queue` cannot name the posts that need a person, and
   what carries each frame gets resolved from the brand's whole catalogue
   instead of what this post is actually about. Keep the id the call
   returns — every step below needs it. If the reply carries
   `check: frame <n>: …` lines, plgn has already found a problem with those
   frames: skip step 4 this round and go straight to step 5, with each
   line's sentence as the objection for its frame. It counts as one of the
   three checks — see **plgn-creative-brief**.
4. Read `context_get(role: "art_director", campaign_id: <the post's
   campaign, if it has one>)` once per campaign (the read section 6 uses:
   make it here and reuse it) and send `plgn-role-art-director` a prompt whose
   first line is `Job B: write the order for this post.`, then that block,
   the **Assets** section of step 1's read, the director's whole answer, the
   post's `Concept:` line, what carries each frame as step 3 resolved it,
   and the platform. It answers with the order, `CANNOT:` or `QUESTION:`
   (two schools, asked of the person like the director's). Its PRODUCT and
   REFERENCES lines may name the brand's saved things and never one marked
   NOT for AI pictures. The order is written once for a campaign's first
   post in the run and reused for that campaign's later posts while what
   carries the frame stays the same. When it is reused, tell the designer
   so: "This order was written for an earlier post of this campaign;
   HERO & HIERARCHY, PRODUCT and DELIVERY are yours to restate", and send
   the post's platform.
4b. When a frame carries words (the creative director's image words for that
   frame are not empty), send `plgn-role-typographer` the order word for word
   (and say so when it was written for an earlier post of this campaign, as
   item 4 does for the designer), the director's concept and hierarchy, each
   such frame's direction and its words exactly as the director returned
   them, the `art_director` block from item 4 (palette and look) and the
   platform and ratio: one call per post, covering all its frames with
   words. A post
   whose frames carry none never calls it. A `question` answer (two type
   systems) is put to the person like the director's, in plain words, and
   the typographer starts again with the answer; later posts of this brand
   in the run get the same answer. A `fit` is asked of the person in plain
   words with the shorter line, for example: "The line 'Fresh coffee, roasted
   this morning, at your door' is too long to read at this size. Use 'Fresh
   coffee, at your door' instead? yes / edit / no". On yes that frame's words become
   the shorter line and 4b runs again with them; on edit the person's own line
   becomes that frame's words and 4b runs again with it; on no nothing
   changes. The words change only on the person's yes or edit.

   Then, for every post, words or not, read
   `context_get(role: "designer", campaign_id: <the post's campaign, if
   it has one>)` for the brand's identity and picture rules. Send
   `plgn-role-designer` the order word for word first, then the typography block,
   word for word, when the typographer ran, then the concept, the
   director's hierarchy and image words (the headline and support line it
   checked against the banned words), the frames, the designer read's block, the campaign's
   constraints from step 1 of this list — the designer's own read does not
   carry them — the **Assets** section of the designer read, and what
   carries each frame, as the `brief_create` call in step 3 resolved it,
   and the brand's languages from the record at the top of the designer
   read — the designer writes each frame's alt text in every one of them.
5. A frame that fails a check comes back as objections, not a picture, and
   each objection belongs to the frame it was raised against. Send
   `plgn-role-creative-director` the objections and the ideas it already scored,
   so it can pick a **different idea** and write fresh directions for it.
   That retry prompt ends with the same line
   `An art director takes this idea next.`, so the image words come back
   with the new idea. Call `brief_update` with the brief's id, the objections as `qa_findings`
   — grouped by frame, so an objection about frame 3 lands on frame 3 — and
   the new idea and directions the director returned. Then send the result
   back to `plgn-role-designer` — unless the `brief_update` reply carries
   `check: frame <n>: …` lines, which are another failed check, handled the
   same way without a designer round. Up to three checks per post — on the third
   failed check, stop working on this post, say which post and why, and
   carry on with the rest of the run. Never attempt a fourth. A `CANNOT:`
   is an objection against every frame, handled as this item says, and
   counts as a check. After any round that changes the idea, a `CANNOT:`
   included, send the new idea to `plgn-role-art-director` for a fresh order
   before the designer, in item 4's prompt with the first line
   `Job B: write the order for this post.`: the old order describes the
   rejected idea. A designer finding that starts `order: ` goes to
   `plgn-role-art-director` once for a corrected order, again in item 4's prompt
   with the first line `Job B: write the order for this post.`, then back to
   the designer, with no `brief_update` and no check. A second `order: `
   finding on the same post counts as a failed check. With both kinds, this
   item comes first and the order's findings go to the art director with
   the new idea. A round that changes the idea or a frame's words runs
   item 4b again before the designer.
6. No objections → call `brief_finalize` with the brief's id and, per
   frame, its `order`, the designer's `generation_prompt` and its
   `alt_text`. plgn copies each frame's alt text onto the picture when it is
   made. Keep each frame's `asset_ids` from the designer for
   section 6 — they are not part of the brief. `brief_finalize` is sent
   once: a `check:` line on its reply cannot be finalized away, so carry it
   to section 6, where plgn may stop that picture before any points are
   spent.

## 6. Make the pictures

Read the brand's saved look **once per campaign**: group the posts by
campaign and call `context_get(role: "art_director", campaign_id: <the
group's campaign>)` once per group, and once with no `campaign_id` for the
posts in no campaign. Not once for the whole run, for the reason
`/plgn month`'s image step sets out: a campaign's own look is held against
that campaign, and a read with no campaign cannot see it. Each group's block
is for that group's posts only; a post in no campaign gets the brand's
**permanent look**, never a running campaign's reference. If
nothing is saved, say so once for the run and offer `/plgn visuals`, which
works the look out from pictures the brand already published, then carry on
without it.

When the brand holds a canonical reference, call
`generate_image_from_image` with it, for every frame. Otherwise call
`generate_image`. See **plgn-visual-identity** for why the two are different.
Either way, carry `post_id`, `brief_id` and `slide_order` on the call, and
use each frame's finalized image text from section 5.

**A frame built around the brand's own things names them.** When the
designer gave a frame `asset_ids`, call `generate_image_from_image` with
those as `asset_ids` — alongside the canonical reference in `input_urls`
when there is one, and on their own when there is not. The server adds each
asset's main picture itself; never paste an asset's URL into `input_urls`.
See **plgn-brand-assets**. If the call refuses an asset, it says which and why:
say so in one line, make that frame without it, and carry on.

**A product from a sheet.** When the order's PRODUCT names `sheet <id> ·
cell <cell>`, call `sheet_get(sheet_id: <id>)` and use the cell only when
the header says the sheet is approved and that cell's line has a usable mark
and a picture link. Otherwise say so in one line and make that frame without
the product, as "needs a product photo". A cell's link goes first in
`input_urls`, before the canonical reference. The server puts the pictures of
the frame's `asset_ids` before all of `input_urls`, so the cell is reference
image number (`asset_ids` count + 1), and the first only when the frame has
no `asset_ids`; the designer names it that way. It is the one exception to the rule above about asset
links, because a sheet's main picture is only its front view. A sheet never
goes in `asset_ids`. A frame carrying a sheet cell always uses
`generate_image_from_image`, with or without a canonical reference. When an order says "needs a product photo" for a
product, name `/plgn product-sheet` once in section 8.

If the read shows no assets at all and the brand plainly has some — a logo
on its site, a mascot in its posts — say so once for the run and offer
`/plgn assets`.

**plgn may stop a picture before it is paid for.** A call carrying a
`brief_id` is refused when the brief is not finished — finalize it first,
and never make a picture from a brief that stopped after three checks. It
answers with plgn's soft refusal when a frame still shows something on the
brand's `never` list or an offering's cliché. Nothing is spent either way.
Start the rest, then ask once for all the flagged ones, in plain words:

```
1 picture was stopped — frame 2 of "Why we cut prices" shows a stack of
coins, which your brand never uses.
Make it anyway?
yes / pick / no
```

On yes, send those same calls again with `accept_warnings: true`. On no,
skip them and name them in section 8. See **plgn-gate-recovery**.

Then follow the **plgn-image-prompting** skill's waiting cycle exactly — point at
it, do not restate it here.

## 7. Attach

plgn attaches each picture itself when `check_generation` reports it done:
onto the post the call carried in `post_id`, in frame order — `media[0]` is
the cover — and with the alt text `brief_finalize` saved for that frame.
Do not send the pictures again with `post_update`.

Once a post's frames are made, call `post_update` once for it with only
`brief_id` set to the brief these pictures came from. The `brief_id` is the
only thing that joins the post to its thinking: leave it off and `/plgn why`
reads back nothing for a picture this command just made, and approving the
post records nothing about what worked.

## 8. Say what happened

Counts first: pictures made, points spent, posts skipped and why, posts
that needed a person. Then, for each post that got a picture, print its idea
in one sentence — that is the part a user can actually agree or disagree
with.

```
7 pictures made across 4 posts · 7 points spent, 17 left

  "The 90-minute review" — a rope under tension, for the strain of a
  packed calendar

  1 needed a person — "Why we cut prices" failed its check three times
  2 skipped — they read better plain
```

## Notes

- **No seam.** This user is already signed up.
- **Never remake an image because you don't like it.** A second payment for a
  small improvement is waste. Remake only when one actually failed.
- **Never spend before asking.** Points are money.
- **Alt text always.** Every attached image carries it.
- Replies follow the **plgn-reply-style** skill, including the user's language.
