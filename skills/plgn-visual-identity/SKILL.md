---
name: plgn-visual-identity
description: "Use inside /plgn visuals, /plgn brandkit or /plgn images — reading a brand's reference pictures, writing the visual direction, saving it to the plgn workspace, and applying it before a plgn image is generated. Covers what a direction contains, how to see an image at a URL with image_view, and what to do when references disagree."
---

`/plgn <name>` in this text means the plgn-<name> skill. In a tool without slash commands, ask for it by name.

# How a brand looks

A brand that has a voice and no look produces posts that read right and look
like stock. This is the other half.

A **visual direction** is a written record of how a brand's pictures work,
taken from pictures it has already published. It is not a mood board and not a
preference. Like voice, it is read off real material.

## What a direction contains

Ten fields. Each carries the evidence it came from.

| Field | What it records |
|---|---|
| **palette** | The colours, as hex values, with rough proportions and how backgrounds are treated. The proportions are of the brand's own things (the pack, the type, a set the brand built), not of the whole scene |
| **composition** | Where the subject sits, how tight the crop is, how much empty space, where text can safely go |
| **light** | Direction, hardness, warm or cool, how shadows behave |
| **medium** | Photograph, illustration, 3D render or collage — and the camera feel: wide or long lens, shallow or deep focus, grain |
| **subject** | What actually appears. When there are people, who they are and what they are doing |
| **finish** | Matte or glossy, flat or gradient, texture, the colour grade |
| **textInImage** | Whether words appear at all, where, how heavy, upper or lower case |
| **never** | What these pictures never contain |
| **promptPreamble** | A block put in front of every later image description, plus what to exclude. It names the palette as an accent, never as what the picture is "anchored in" |
| **canonicalReference** | The one image that best represents the set |

**The `never` field carries more weight than it looks.** A brand whose pictures
never show a face, never use pure white, or never contain a logo has an
identity built on those refusals. Getting a refusal wrong is what makes a
generated image feel like a different company.

**The school.** After the ten fields the art director names the school the
look belongs to: one school, several approved worlds, or per campaign, taken
from its library of schools. It is saved as `metadata.school` and named in
`content`. When the art director writes the order for a post, it looks there
for the post's school.

## Reading the references

At least three. Fewer than three is a sample, not a pattern — say so rather
than dressing a guess up as a direction.

**Where the pictures come from.** The brand's own posts are the best source:
`social_fetch` lists every picture of each post under `pictures:`, a
carousel's included. Take about **12** of the brand's pictures, spread over
its recent posts rather than twelve from one carousel. For a competitor,
about **6** is enough: you want its look, not its archive. Files the user
names, and images already in the workspace (`list_images` returns them as
URLs), count too.

**One art director per account.** When the brand and its competitors are
read together, start one `plgn-role-art-director` per account, all at the same
time, each with only that account's links. Two accounts' pictures in one
reading come back as an average of two looks.

**A picture at a link** is opened with `image_view`: up to 6 links per call,
and it shows the pictures themselves. Twelve pictures is two calls. A link it
could not open is named in its reply. `social_fetch` links expire after a
few days, so when most fail, run `social_fetch` again for fresh ones.

**A local file or a screenshot** is read directly with `Read`, which shows the
image.

**When plgn is not connected**, there is no `image_view`. An image at a URL
then takes two steps:

1. `WebFetch` the URL. It will answer **"NO IMAGE VISIBLE"**. That is not a
   failure. It saves the binary to a local file and names that path in its
   result.
2. `Read` that saved path. The image is now visible.

Both steps are needed. `WebFetch` alone never sees a picture, and `Read` cannot
take a URL.

**If a reference cannot be seen, say so and leave it out.** Never describe an
image from its filename, its alt text, or the caption of the post it belongs
to. A direction built from a picture nobody looked at is worse than no
direction, because everything downstream trusts it.

## When the references disagree

They will, and it usually means something real: a rebrand, a new designer, or
two people posting without a shared rule.

**Never average them.** Averaging two identities produces a third that belongs
to nobody, and every generated image afterwards is slightly wrong in a way
nobody can name.

Report the clusters instead:

```
Your references split in two.

  Six images — flat illustration, two colours, no photography
  Three images — warm photography, shallow focus, people

Which is current?
yes / pick / no
```

Then build the direction from the chosen cluster, and note what was set aside.

## Where a direction is stored

One entry, of type `brand_identity` — a Foundation singleton, per the
**plgn-brand-knowledge-map** skill.

```
knowledge_add(
  type: "brand_identity",
  title: "Visual direction",
  content: <the direction, written out for a person to read>,
  metadata: {
    palette: [{ name: "ink", hex: "#1A1033" }, ...],
    composition: "...",
    light: "...",
    medium: "...",
    subject: "...",
    finish: "...",
    textInImage: "...",
    never: ["stock smiles", "pure white backgrounds"],
    promptPreamble: "...",
    school: "product beauty / still life"
  },
  assets: [{ secure_url: ..., public_id: ... }],
  confirm: true
)
```

Three things about that call are not obvious and all three matter.

**`content` is for a person.** It is what someone reads on the Knowledge page
to understand the look. Write it as prose.

**`metadata` is for the machine.** Nine of the ten fields live here as keys, with `school` beside them.
An art director reads them back through `context_get`; a field written into
`content` instead is a field no image generation will ever use.

**`assets[0]` is the canonical reference** — the one image that best represents
the set. Upload it first with `upload_image_from_url`, then attach what that
returns. It is `assets[0]` specifically, not "one of the assets": the command
that generates a matching image reaches for the first one.

**`confirm: true`, and only after the user has said yes.** Show the direction,
get a real yes, then save. (Why Foundation needs this at all is the map's rule,
not restated here.)

**A second one is refused — the map's singleton rule, applied here.**
Re-running `/plgn visuals` on a brand that already has a look updates the
existing entry rather than adding a second one.

## Rules that are refusals, not descriptions

The `never` list is a refusal, and a refusal is not the same shape as a
description. Keep it in `metadata.never` on the `brand_identity` entry.

Rules that are about **pictures in general** rather than about this brand's
look — "no faces of real customers", "no competitor logos" — belong in a
separate `visual_rules` entry, also Foundation, also with a `never` list. The
split matters because a direction can be replaced when the brand is
redesigned; those refusals usually survive it.

## Reading it back before making an image

```
context_get(role: "art_director")
```

That returns the palette, the `never` list, the picture rules, and an **anchor
hint** — the one product picture a new image should sit next to. It is one
read, and it is the read to make before every generation.

Never rebuild the direction by reading entries one at a time. `context_get`
puts Foundation first, which is the order that matters: the `never` list has to
be in hand before the description is written, not applied to it afterwards.

## Making a picture that matches

`generate_image_from_image` takes the canonical reference — `assets[0]` on the
`brand_identity` entry — and a description. That pairing is what makes a new
picture look like the same brand rather than like the same words.

Use it when there is a canonical reference. Fall back to `generate_image` when
there is not, and say in the reply that the match will be looser. Prepend the `promptPreamble` on /plgn month's
quick path; on the brief path the designer's text already starts with it, so send it as it is.

What carries the frame — a real photo, a built object, a scene or type
alone — is not chosen here. The server resolves it from what the brand
sells, per **plgn-creative-brief**. This skill's part of that starts once the
frame's subject is settled: the reference path above is unchanged either
way.

The **plgn-image-prompting** skill owns the mechanics of generating. This skill owns
what the picture should look like before that starts.

What the picture is **of** — the brand's own logo, mascot, people or place —
is a third thing, owned by **plgn-brand-assets**. A look and an asset travel on the
same call: the canonical reference in `input_urls`, the asset in `asset_ids`.

## A look for one campaign only

"Make everything gold for Ramadan" is not the brand's look. Saved as
`brand_identity` it **replaces** the permanent one — a singleton has no second
slot — and the brand comes out of Ramadan looking like Ramadan.

It is two things instead:

1. A **Campaign** — `campaign_create(name: "Ramadan 2027", starts_at, ends_at)`
   — which carries the dates and ends on its own.
2. A **`reference`** entry linked to it, with the picture attached and an
   `intent` in its metadata saying what to take from it.

```
knowledge_add(
  type: "reference",
  title: "Ramadan look",
  content: "...",
  campaign_id: <the campaign>,
  assets: [...],
  metadata: { intent: "the warm gold and the low light, not the lanterns" }
)
```

`intent` is required — the server refuses a `reference` without one. That is
deliberate: a reference with no stated intent is a template, and a template is
how every brand's Ramadan post ends up identical.

## Many references at once

`/plgn brandkit` can find a dozen pictures worth learning from. Saving each
as its own entry spends a dozen knowledge entries. Group them instead: **one
`reference` entry per thing to take** — light, colour, layout, people,
product styling — with 2–4 pictures attached and one `intent` for the group
("low warm side light, one subject, dark wood"). The strongest picture of
the group goes first.

When the knowledge cap cannot take every group, save the groups that carry
the most of the look first, and name the rest as not saved.

## Honest limits

- Colours read off a compressed screenshot are close, not exact. Say "about
  this" rather than publishing a hex value as though it came from a brand book.
- A direction from three references is thinner than one from twelve. Say which.
- A picture nobody could see is not evidence.
