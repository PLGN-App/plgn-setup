---
name: plgn-creative-brief
description: "Use inside /plgn campaign, /plgn post, /plgn month or /plgn images — the concept that comes before any copy or picture, how the content creator is briefed and the campaign's big idea is saved, then the four steps that decide what the picture shows, the brief calls that record them before any image points are spent, and the limit that stops a picture getting busier every round. Covers carousels as one idea over several frames. Not for image requests outside plgn."
---

`/plgn <name>` in this text means the plgn-<name> skill. In a tool without slash commands, ask for it by name.

# The creative brief

A **brief** is the record of the thinking behind a picture, saved before any
image is made. It answers "why does this look like this" months after the
post went out. It stops the same idea being offered to the same brand twice.
And it gives a failed check somewhere to go back to, instead of a picture
that just gets busier each round.

## The concept comes first

A **concept** is what one post is doing, settled before any caption or
picture: format, hook, visual idea, reference or asset, story shape, call to
action, series device, product role. `plgn-role-content-creator` writes it; the
copywriter and designer carry it out.

**Briefing the content creator.** Jobs: `Job: ideas`, `Job: platform`,
`Job: concepts`. The agent cannot see this file; the whole prompt goes in, the
job line first, then

- `## The brand`: the
  `context_get(role: "creative_director", campaign_id: <id>)` block, verbatim.
- `## References`: from `knowledge_get(type: "reference", limit: 20)`, keep
  entries with no `[campaign: …]` tag or this campaign's, leave out the big
  idea, number from 1:
  `<n>. <title> · take: <metadata.take, else intent> · leave: <metadata.leave, else "not read yet"> · pictures: <metadata.pictures, else "none"> · <metadata.source: given or found; else found>`.
- `## The campaign`: key message, constraints, `Big idea: …` when saved.
- `## Posts` (concepts only), one line per post:
  `<ref> · <topic> · <platform> · <the person's idea> · <format>`. Always give
  `single` or `carousel with N frames` (month: the plan's `plannedSlides`;
  post: the count agreed in step 2). The concept keeps the count.
- `## So far`: ideas shown and the person's words, in order.
- `## Where the brand ends`, last, these five lines:

```
Colours: <palette>, as accents on the brand's own things; everything else is the real world.
Packs: <each product offering>, exactly as its photo shows it.
Assets: <each saved asset the AI may use, by name>; no other logo, mascot or named person. Unnamed people from the audience are welcome.
Words it never uses: <the record's list>.
This campaign: <its constraints, or "none">.
```

**No references saved.** Say so; offer stand-ins from `web_search` and
`social_fetch` on the category's best accounts (`S1`, `S2`, never saved) or
`/plgn brandkit` first.

**Talking it through.** Say once that nothing is saved or spent while you
talk. Before the first ideas, print the numbered reference titles, one line
each (never call it an "index"). Print ideas as returned. Every steer runs the
agent again with `## So far`; it remembers nothing. Words that start a talk:
ideas, options, brainstorm, let's think, think, «أفكار», «نفكر». Words that
end one with a pick: this one, do it, a number, "3 and 7 together", «نفذ». A
pick runs `Job: platform` when the talk is for a big idea (`/plgn campaign`,
and `/plgn month`'s think first) or `Job: concepts` (in `/plgn post`),
with the pick in `## So far`.

**The big idea.** Save the platform reply's five lines once per campaign:

```
knowledge_add(type: "reference", title: "Creative platform", campaign_id: <id>,
  content: <prose for a person>, metadata: { kind: "creative_platform",
    intent: "<the big idea's one sentence>; every post in this campaign starts here; not a look to copy",
    big_idea, visual_world, series_devices,
    mood_board: [<entry ids of its numbers>], headline_system })
```

Read first with
`knowledge_get(type: "reference", campaign_id: <id>, keyword: "Creative platform")`;
a second one is a `knowledge_update`. To the person, say "big idea", never
"platform".

**Where the concept is kept.** On the post, in `notes`, one line in the
brand's first language:
`notes: { <first language>: "Concept: <format> · <product_role> · <visual> (<reference title or asset name>) · hook: <hook> · shape: <shape> · series: <device> · cta: <cta>" }`.
Cite by title, not number.

**The concept is the brief's source.** The director still writes the literal
and five lens ideas, scored, as the record. The concept's visual idea is the
pick even when another scores higher; `concept_why` says the person chose it.
A concept that needs something outside the brand comes back as the one-line
"cannot" with the reason. A check round that drops it is named in the run's
report, never swapped quietly.

## The four steps

**1 · benefit → meanings.** `plgn-role-creative-director` takes the post's
benefit — the one thing it promises — and works out what that benefit could
mean to someone. A benefit has several meanings; naming more than one is the
point of this step.

**2 · ideas → the one.** `plgn-role-creative-director` turns each meaning into an
idea for the picture, then picks one. Every idea is kept, including the
losers, each with the reason it lost. The chosen idea is kept too, with why.
When the post carries a concept, the one is the concept's visual idea.

**3 · what carries the frame → direction.** `plgn-role-creative-director` writes
one direction per frame. What carries the frame is not this agent's call —
the server decides it from what the brand sells. See below.

**Between 3 and 4 · the order.** `plgn-role-art-director` turns the idea into the
order: the school, the world, the light, the hierarchy, where the product
comes from, and what never changes. One order per post, for every frame of it.
Inside a campaign it is written once per run, for the campaign's first post,
and reused while what carries the frame stays the same. The order is not saved
in the brief; the command hands it to the designer as written. Bunduq Coffee,
a hero post, looks like this:

```
SCHOOL: Product beauty / still life
FIELD: food
REFERENCES: Bunduq Coffee's latest tin post — take: one tin, warm side light — leave: the busy shelf
WORLD: a Cairo kitchen counter at 7 am, morning in autumn; the coffee is real
HERO & HIERARCHY: 1 the tin · 2 steam rising from the cup · 3 the counter
PRODUCT: sheet <asset id> · cell three_quarter · role: hero · scale: a hand-sized tin beside a small cup
LIGHT: soft window light from the left, warm, one source
CAMERA: table height, 1 to 1.5 m from the tin, an 85mm look, the tin sharp and the window soft
COLOUR: cream and walnut brown dominate; the brand's red only on the tin
FINISHING SIGNATURE: matte-soft
FIXED: the tin's shape, its label, the logo, the brand palette
FREE: the cup, the angle, the steam
TYPE NOTES: the brand's geometric Kufi, heavy headline, light support
DELIVERY: Instagram feed, 4:5, keep 10% clear at the edges
NEVER: stock-looking beans, hands holding the tin, the brand's banned words
```

**Between the order and 4 · the words.** `plgn-role-typographer` is the fifth role,
and it runs only when a frame carries words: the director's image words for
that frame are not empty. It styles and places the words, one call per post for
all its frames, and never changes, cuts or drops a word. If a line cannot fit
at a readable size it says so in `fit` and proposes a shorter one; the words
change only when the person says yes. A frame with no words never reaches it,
and the designer then writes none. Like the order, its block is not saved in
the brief; the command hands it to the designer. For the Bunduq Coffee hero
order above, with one frame, a headline and a support line, in the order's
Kufi:

```json
{
  "typography": {
    "system": "Geometric Kufi, heavy for the headline, light for the support line, 3:1 in size; Western digits",
    "styling": "The headline in walnut brown, the support line in walnut brown on a cream plate; plain, size steps 96 and 32",
    "concept": "The headline is a painted shop sign above the counter, the support line a small tag under the cup",
    "placement": [
      { "text": "قهوة تصحّيك", "where": "top third, right-aligned, inside the safe area, clear of the 10% edge", "near": "keeps off the tin's label and the steam" },
      { "text": "من أول رشفة", "where": "lower right, under the cup, right-aligned", "near": "keeps clear of the bottom trim" }
    ],
    "fit": null
  }
}
```

**4 · check → final text.** `plgn-role-designer` checks the direction and the order
against the brand and the brief, then writes the final image text, taking the
typography block as given, in the prompt order (see **plgn-image-prompting**) and
the alt text per frame — or raises objections if the direction or the order
doesn't hold up.

For that hero frame and that block, the designer's text reads:

```text
Bunduq Coffee is a small Cairo roaster that sells one dark roast in a red tin, warm and unhurried, never loud. Product beauty still life, matte-soft finish. The idea: the first cup of the day is the reason to get up. The camera is at table height, about 1 to 1.5 metres from the tin, with an 85mm look and a shallow depth: the tin is sharp and the window behind it is soft. The frame is a quiet close shot of a kitchen counter at 7 am, cropped just above the counter edge. The tin stands on the left third and takes about a third of the width. A white cup on a saucer stands to the right of the tin and a little behind it, with steam rising. One tin, one cup, nothing else on the counter. The light is a single window on the left, soft and warm. The setting is a real Cairo kitchen in autumn, a plain tiled wall, nothing imported-looking. The tin is matte printed metal, the cup is glazed white ceramic, the counter is oiled walnut. There are no people and no hands. The grade is cream and walnut brown, with the brand's red only on the tin. The top third and the lower right of the frame are empty and calm, where the words go. The tin is the product from the first reference image: its own label, exactly as in the product photo, copied exactly, never redrawn or restyled. The words follow the type system: geometric Kufi, heavy for the headline and light for the support line, 3:1 in size, Western digits. Styling: the headline in walnut brown, the support line in walnut brown on a cream plate; plain, size steps 96 and 32. The headline is a painted shop sign above the counter, the support line a small tag under the cup. The headline "قهوة تصحّيك" goes in the top third, right-aligned, inside the safe area, clear of the 10% edge, and keeps off the tin's label and the steam. The support line "من أول رشفة" goes at the lower right, under the cup, right-aligned, and keeps clear of the bottom trim. Letter by letter, not to be drawn: ق، ه، و، ة, then ت، ص، ح with a shadda، ي، ك, then م، ن، أ، و، ل، ر، ش، ف، ة. Write only these two texts, with no other words, no extra logo and no stock-looking beans. Never show hands holding the tin. If anything must give, keep in this order: the label and the words, the product, where things stand, the light, the style.
```

## Two calls, not four

Four steps, two calls. `brief_create` saves steps 1 through 3 in one call:
the benefit, the meanings, every idea and why each won or lost, and the
direction per frame. `brief_finalize` saves step 4, and only when step 4
passed: the final image text and the alt text per frame, nothing else. It is
refused while any frame has no text, so it is not somewhere objections can
go. It is sent once — a brief that is ready cannot be finalized again.

plgn reads the brief too. A `brief_create` or `brief_update` reply may carry
`check: frame <n>: <code> — <sentence>` lines — something on the brand's
`never` list, an offering's cliché, an idea already used, or an idea that
could belong to any brand. Each line is an objection against that frame,
exactly like one from `plgn-role-designer`.

A failed check does not go back to `brief_create`, and it does not go to
`brief_finalize` either. It calls `brief_update` with the objections and a
**different idea**, taken from the ones already saved in step 2. Never the
same idea with more elements bolted on — that is exactly the pattern this
record exists to stop.

## Three checks, then stop

The command stops at three. On a third failed check it does not attempt a fourth
`brief_update` — it names the post that needs a person and carries on with
the rest of the run. A round failed by plgn's own `check: frame` lines counts
as one of the three, the same as a round failed by the designer.

The server enforces the same cap as a backstop: a fourth `brief_update` is
refused, and the brief is marked failed. The two only have to agree; the
server is what actually enforces it.

Write the reason down, because it is not obvious: with no record of the
ideas that already lost, the only way left to answer an objection is to add
another element to the same idea. That is how a picture gets busy — one
small addition per round until nothing in it is doing any work.

## What makes a real idea

An idea is a lens, a metaphor and a territory — a concrete thing the picture
could actually show, that stands for the benefit without stating it. It
carries a score, and every idea that was rejected carries the reason it lost,
not just its name.

The literal picture of the caption is written first and always loses. The
other ideas come one from each of five lenses, and the lens is written at the
front of the territory.

"A nice photo of the product" is not an idea. It names no metaphor and no
territory — it is the absence of one, dressed up as a starting point.

## What carries the frame is not yours to choose

The server resolves what carries the frame from what the brand actually
sells — not from what reads best or what's easiest to generate. Four
answers, and only one applies to a given brief:

- **A real photo** — the brand has a product with a photo of it. The real
  pack, from its photo, is in the picture or behind it, as hero, detail,
  result or in use, the director's choice for each frame. It does not mean a
  hand holding the pack.
- **A built object** — the brand has a product but no photo. The picture is
  made rather than shot, and the missing photo is a real gap to name back to
  the brand.
- **A scene** — a service brand with a written process. There is nothing to
  photograph, so the picture shows the process happening.
- **Type alone** — nothing to photograph and no process. The picture is words.

A service brand has nothing to photograph, and that is not a problem to work
around — it is the answer.

What carries the frame is about the **offering**. The brand's other real
things — a character, the shop, the founder — are its **assets**, and an idea
may be built around one whatever carries the frame. The director names the
asset, the designer checks it against the asset's own rules and lists its id,
and the command passes that id when the picture is made. See **plgn-brand-assets**.

## Carousels

A carousel is one idea carried over several frames, each frame with its own
job: hook, proof, how, ask. A single picture is a brief with exactly one
frame, so there is never a second way of building this — a carousel is not a
different procedure, it is the same one with more frames.
`plgn-role-creative-director` picks the order of the frames from six story shapes
and names the shape in `concept_why`; the jobs keep their four names.

Default to 3 frames when someone asks for a carousel without saying how
many, and never more than 10.

## Cost

Every frame is a picture, and every picture is a charge. State the total
before the first call — frame count times the cost of one image, said
plainly, so nobody finds out how many frames they paid for after the fact.
