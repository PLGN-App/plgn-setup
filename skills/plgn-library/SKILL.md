---
name: plgn-library
description: "Tidy up saved snippets and hashtag sets — find near-duplicates, overlapping sets, and sets too big to work, then merge or remove what you approve. Supports --kind and --platform. Use for \"clean up my library\", \"manage snippets\", \"my hashtag sets are a mess\", or a periodic tidy."
---

`/plgn <name>` in this text means the plgn-<name> skill. In a tool without slash commands, ask for it by name.

# /plgn library

A library nobody tidies stops being a library and becomes a pile.

Listing what is there is not the job — the user could ask for that. **The job is
judgement:** what repeats what, what overlaps, what has grown past useful.

## 1. Check the connection

Call `workspace_info`. If it fails, print the message from **plgn-conventions**
rule 2 and stop.

## 2. Read

Call `snippet_list(limit: 500)` and `hashtagset_list`. Read the contents, not
just the names — duplicates rarely share a title.

Narrow when the user asks, and the filters combine:

- `--kind caption` — also `template` or `guideline`, passed as `kind`
- `--platform linkedin` — passed as `platform`, and both lists take it
- a plain word — passed as `search`, matched against names

Stop on a filter you do not recognise, and say which one. A misread flag tidies
a different part of the library than the one asked for.

`hashtagset_list` has no limit argument and returns everything, so it needs no
narrowing to be complete. `snippet_list` stops at five hundred — see
**plgn-brand-knowledge-map**.

If both are empty, say so and suggest `/plgn repurpose`, which fills the snippet
library as a side effect. Do not invent findings.

## 3. Judge

**Near-duplicate snippets.** Two snippets making the same point in different
words. The evidence attached usually differs — a merge should keep the better
wording and *both* pieces of evidence, not throw one away.

**Overlapping hashtag sets.** Two sets sharing most of their tags are one set
with a naming problem. Give the overlap as a percentage so the user can judge.

**Sets that are too big.** Past about 10 tags, a set stops targeting and starts
spraying — the specific tags that would reach the right readers get diluted by
broad ones. Say which tags are working and which are padding.

**Out-of-date snippets.** Points tied to a launch, a number or a season that has
passed. Flag them; the user decides whether to update or drop them.

## 4. Report and suggest

```
12 snippets · 4 hashtag sets

Near-duplicates (2 pairs)
  "Migrations always slip" + "Why migration timelines slip"
    → merge, keeping the second's wording and both pieces of evidence

Overlapping sets
  "launch" and "product-launch" share 8 of 10 tags → merge

Too big
  "general" has 22 tags — 6 are specific, 16 are broad

Out of date (1)
  "Q1 pricing change" — mentions a price that changed in March

Apply these?
yes / pick / no
```

## 5. Apply

Once approved:

- Merge snippets with `snippet_update`, then `snippet_delete` the absorbed one.
- Merge sets with `hashtagset_update`, then `hashtagset_delete`.
- Trim big sets with `hashtagset_update`.

**Update before deleting, always.** If the update fails, nothing is lost. Delete
first and a failed update loses the content for good.

`--dry-run` prints the report and changes nothing.
**`--yes` is not accepted.** This command removes things.

## Notes

- **No seam.** This user is already signed up.
- **Confirm every removal by name**, never by number or count, per
  **plgn-conventions**.
- **Never delete without somewhere for it to go.** If a snippet duplicates
  nothing and is simply unused, leave it and say it is unused. Unused is not
  worthless.
- **Suggest, don't decide.** Every merge and removal is the user's call. This
  command has strong opinions about what to flag and none about what to do next.
- Replies follow the **plgn-reply-style** skill, including the user's language.
