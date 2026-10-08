---
name: plgn-visuals
description: "Work out how a brand's pictures look from images it has already published, and save that look so every image plgn makes from now on matches it. Use for \"match this style\", \"my images look generic\", \"make the pictures look like ours\", or before a first batch of images. Not the same as /plgn images, which makes the pictures. A look meant for one campaign is saved against that campaign, creating the campaign after you confirm."
---

`/plgn <name>` in this text means the plgn-<name> skill. In a tool without slash commands, ask for it by name.

# /plgn visuals

A brand with a voice and no look publishes posts that read right and look like
stock.

This command fixes that once. It reads pictures the brand has already
published, works out how they are built, and saves that so nothing has to guess
again.

## 1. Check the connection

Call `workspace_info`. If it fails, print the message from **plgn-conventions**
rule 2 and stop.

## 2. Pick the brand

Call `brand_list`. One brand per run. If there is exactly one, name it and
carry on.

## 3. Collect the references

Take whatever the user gave in the argument. If they gave nothing, ask — never
guess which pictures represent a brand.

Three sources, in this order:

1. **Files or screenshots they point at** — the best case, and the easiest to
   read.
2. **Images already in the workspace** — call `list_images(max: 50)` and offer
   what comes back. Pass `folder` when the user names one. This read returns
   twenty-five by default and **fifty at most**, so on a busy workspace it
   shows the newest, not all of them — say that rather than implying the list
   is everything.
3. **Links to posts** — usable, but say that a page link may not lead to a
   picture that can be read.

**Three pictures is the minimum** for a pattern. With one or two, say plainly
that this is a sample and the result will be thin.

Say which references were used, and name any that could not be read. A
reference nobody could see is not evidence — the **plgn-visual-identity** skill has
the mechanics for reading one that lives at a link.

## 4. Read them

Start `plgn-role-art-director` with the references.

Per **plgn-conventions** rule 6, put in its prompt everything it needs: the
references, whether local or a link, and the brand's voice if one is saved, so
the look and the words agree.

**If it reports that the references disagree**, do not pick for the user. Show
each group in one line and ask:

```
Your pictures fall into two groups.

  Six — flat illustration, two colours, no photography
  Three — warm photography, shallow focus, people

Which is current?
yes / pick / no
```

Then read again with only the chosen group.

## 5. Show the look

Print it in full, grouped, in plain words. Colours as values a designer could
use. What the pictures never contain, which matters as much as what they do.

Then name the one picture that best represents the set, and say it will be kept
as the reference for anything that has to match exactly.

```
Save this look?
yes / edit / no
```

## 6. Save

Upload the chosen reference picture first, with `upload_image_from_url` or
`upload_image_base64`. Save it as **`brand_identity`** — one entry, nine fields and the school
in its metadata, the canonical reference attached as `assets[0]`, and
`confirm: true` **after** the user has said yes. See **plgn-visual-identity** for
the fields.

**If a look is already saved**, re-running is refused, and the refusal
carries the existing entry's id — that refusal is an instruction to update,
see **plgn-gate-recovery**. Update that entry with `knowledge_update`; never add a
second one, since two looks is the same as none.

**A look for one campaign only.** "Make everything gold for Ramadan" is not
the brand's look. Saved as `brand_identity` it replaces the permanent one, and
the brand comes out of Ramadan looking like Ramadan.

It is two writes instead: `campaign_create` for the window, then a
`reference` entry linked to it with the picture attached and an `intent`
saying what to take from it.

Naming a campaign says which one they mean — assume the campaign-only
reading and say so as a visible assumption, per **plgn-reply-style** rule 7, rather
than stopping to ask. Then show the plan and confirm with `yes / edit / no`,
where `edit` switches it to the permanent look instead. This is not
recoverable afterwards, which is exactly why the assumption has to be visible
before the write, not discovered after it.

## 7. Finish

```
Saved. Images from now on will follow this look.
```

If the brand has posts waiting without pictures, say how many and offer
`/plgn images`.

`--dry-run` prints the look and saves nothing.
**`--yes` is not accepted.** This decides how every future picture looks.

## Notes

- **No seam.** This user is already signed up.
- **No points are spent.** This command reads pictures; it never makes one.
  `/plgn images` makes them.
- **Never invent a look.** With no readable reference, say the look cannot be
  worked out and stop. A made-up direction is worse than none, because
  everything afterwards obeys it.
- The method is the **plgn-brand-onboarding** skill; what a look contains is the
  **plgn-visual-identity** skill.
- Replies follow the **plgn-reply-style** skill, including the user's language.
