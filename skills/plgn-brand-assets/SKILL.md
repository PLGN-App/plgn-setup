---
name: plgn-brand-assets
description: "Use inside /plgn assets, /plgn brandkit, /plgn setup, /plgn images or /plgn month — the real things a brand owns (logo, character, people, places, elements, templates, badges), how each is saved to the plgn workspace, the consent rule for a real face, and how a picture is built around one instead of inventing it. Not for the look of pictures in general; that is plgn-visual-identity."
---

`/plgn <name>` in this text means the plgn-<name> skill. In a tool without slash commands, ask for it by name.

# The real things a brand owns

A brand's **voice** is how it sounds. Its **look** is how its pictures work.
Its **assets** are the things those pictures are *of*: the logo, the mascot,
the founder, the shop, the pattern on the bag.

The first two can be described. An asset cannot — it has to be **shown**. A
paragraph about a mascot produces a new mascot in every picture. The
mascot's own picture, handed to the image model, produces the mascot.

## The shelves

Seven kinds are saved as assets. Two more sit on the same page in plgn and
are saved somewhere else, so nothing is stored twice.

| Kind | What goes here |
|---|---|
| `logo` | the primary logo and its versions — icon, wordmark, one colour, on dark, watermark |
| `character` | a mascot or a recurring figure, ideally from more than one side |
| `person` | a real face: founder, team, spokesperson, ambassador |
| `place` | shop, office, kitchen, venue — also the delivery van and the uniform |
| `element` | pattern, texture, shape, icon set, sticker, frame |
| `template` | a post frame, story frame, carousel cover or quote card |
| `badge` | a certificate, an award, a partner or press logo, a store badge |

| Shown with them | Saved as |
|---|---|
| Product shots | pictures on the **offering** (`offering_update`), per **plgn-brand-knowledge-map** |
| Reference pictures | the `brand_identity` entry's first picture and every `reference` entry, per **plgn-visual-identity** |

Never save a character, a logo or a place as a `reference` entry, however
it is titled. A reference says "look like this"; an asset says "this is ours,
show *it*". Older brands hold characters as references titled "Character:
<name>" — `/plgn assets` moves them.

Never save a product shot as an asset. The brief decides what carries a
frame from the offering's own pictures; a second copy on an asset is a copy
that can disagree.

## Saving one

Upload first, then save. An asset is built around pictures already in the
workspace.

```
upload_image_from_url(...)          → { secure_url, public_id }
asset_create(
  kind: "character",
  name: "Plugo",
  variant: "front view",
  description: "A small lime robot with one antenna. Friendly, a little clumsy.",
  usage: "Tips and how-to posts. Never on a price or an apology.",
  never: ["never angry", "never holding a phone"],
  images: [{ secure_url, public_id }, ...],
  is_primary: true
)
```

**`images[0]` is the main picture** — the one an image model is handed. Put
the clearest, most neutral view first: front-on, plain background, the whole
figure. At most twelve.

**`never` is the part people forget and the part that matters.** A logo is
never stretched, never recoloured, never on a busy photo. A mascot is never
angry. Ask for these; do not invent them.

**One primary per kind.** Setting a second demotes the first, and the reply
says which. The primary is what a picture reaches for when nothing narrower
was asked for.

**Ask before saving**, per **plgn-conventions** rule 3. Show the name, the kind,
the rules and which picture is first.

**Found, not handed over.** `/plgn brandkit` can find a logo on the site, a
face on the about page, the shop on Google Maps. It may save one only when
the plan named it, with where it came from, and the user said yes. A found
face is saved with `consent` left out — the owner-only block asks by name
afterwards. An SVG logo cannot be uploaded; ask for a PNG.

## A real face needs consent

`kind: "person"` carries `consent`. It is `true` **only** when the user has
said, in this conversation, that the person agreed to AI pictures of
themselves. Never infer it from the person being the founder, being on the
website, or being the user.

Without it the server saves the asset with AI use off and refuses it in a
generation. That refusal is correct. Do not route around it by passing the
picture's URL another way — say who needs to agree, and carry on without the
face.

## Whether the AI may be given it

Every asset says `AI may use it` or `NOT for AI pictures`.

Logos, templates and badges start as **not for AI**. Image models redraw
them: wrong letters, wrong proportions. A wrong logo is worse than none, so
the default is that an image model is not given the logo file. The owner can turn it on for one asset
after checking the results; nothing turns it on for them.

Characters, places, elements and people with consent start as usable.

## Building a picture around one

Read what exists before writing a frame:

```
context_get(role: "creative_director" | "designer" | "art_director")
```

Each returns an **Assets** section: the id, kind, name, rules and main
picture of every asset. `asset_list` returns the same in full.

The writing roles read them too. `context_get(role: "copywriter")` and
`"marketing_manager"` list characters, people, places and badges by name
with their rules — no ids, no pictures — so a caption about the mascot uses
the mascot's real name. Pass that section to `plgn-role-copywriter` with the rest
of the read.

When a frame is built around an asset, pass its id — not its URL:

```
generate_image_from_image(
  prompt: <the frame's final image text>,
  asset_ids: ["<the character's id>"],
  input_urls: ["<the look's canonical reference>"],   // optional, alongside
  post_id, brief_id, slide_order
)
```

The server adds each asset's main picture to the inputs, first, and records
which assets the picture was built from. `input_urls` is optional when
`asset_ids` is given. At most four assets — a picture built around
everything is a picture of nothing.

Three rules for the text that goes with it:

1. **Name the asset's role, do not redescribe it.** "The character from the
   first reference image, sitting on the counter" — not a fresh description
   of a lime robot, which invites a second robot.
2. **Carry its `never` list as exclusions**, beside the brand's own.
3. **An asset that is not there is not invented.** When the Assets section
   says none are saved, a frame that needs a mascot does not get one made
   up. Say the shelf is empty and offer `/plgn assets`.

## When a generation refuses an asset

The reply names the asset and the reason: archived, a person with no
consent, or marked not for AI. None of these is a fault to retry. Say which
asset and why in one line, make the picture without it, and carry on — per
**plgn-gate-recovery**.

## Honest limits

- An image model keeps a character *recognisable*, not identical. Say so
  the first time, and suggest saving the best result as another view.
- One flat picture of a logo tells a model its shape, not its rules.
- Twelve pictures is the ceiling; three good views beat twelve similar ones.
