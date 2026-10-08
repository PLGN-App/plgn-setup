---
name: plgn-product-sheet
description: "Build a product variant's reference sheets — one picture that shows it from every useful side, one that shows how it opens and is used — check every cell against the real photo, and hand the sheet over for approval. The points cost is stated before anything is spent. Supports --dry-run. Use for \"make a product sheet\", \"check this product from every angle\", \"use our real product in pictures\", or when pictures keep inventing the product."
---

`/plgn <name>` in this text means the plgn-<name> skill. In a tool without slash commands, ask for it by name.

# /plgn product-sheet

A picture model that has never seen the back of a product will invent one.
A sheet is the answer: one reference picture of one product variant, every
cell checked against the real photo, approved by a person. Every later
picture takes the product from an approved cell instead of from the model's
memory.

## 1. Check the connection

Call `workspace_info`. If it fails, print the message from **plgn-conventions**
rule 2 and stop.

Read the `Image points` line and the `Integrations` line, as `/plgn images`
section 1 does. No points left: say so, point at
Plan & usage (useplgn.com/settings/plan), never ask for a key in a chat,
and stop. `cloudinary: missing`: say so in one line, because the sheet's
cells need storage, and stop.

## 2. Find the product

Call `offering_list`. Match the argument to one product offering (not a
service). One variant per run: when the offering has variants and the
argument names none, list them and ask which one, `yes / pick / no`. When
nothing matches, say so and stop. Never guess a product.

The offering must have at least one photo. With none, stop: the sheet
needs a real photo or official render of this exact variant. Point at
Knowledge › Offerings (useplgn.com/knowledge?tab=offerings). A sheet with
no source is a guess.

Call `sheet_list(offering_id: <the offering's id>)`. When an approved sheet of
this variant already exists, say that this run makes the next version, and
that the approved one stays in use until the new one is approved.
When it lists a draft of this variant, waiting for approval or not, say that
this run replaces it: plgn retires the older draft of the same variant and
kind when the new one is saved. A product draft goes when section 7 saves the
new Product Sheet; a use draft goes only when section 9 makes the Use Sheet,
so a run that stops before it (a `CANNOT:`, or a balance for one picture)
leaves the use draft as it is. Name the draft, or each draft, in the
question, variant and kind, and ask `yes / edit / no`:

```
Replace the draft "Ethiopia 250g · Product Sheet"? yes / edit / no
```

`edit` keeps the old draft and stops, so the person can approve it on the
Assets page first. `no` stops and changes nothing.

## 3. Draft the maps

Call `context_get(role: "designer")` and keep the brand's `never` lines.

Send `plgn-role-product-sheet` the plan job: `kind: "product"`, the offering's
name, the variant, the description, its photo links, the `never` lines, and
its dimensions when the offering's text or the brand's saved knowledge states
them. Never estimate one; with none, say so in the prompt.
Never a price, and never a price in the offering's text: leave it out.
Per **plgn-conventions** rule 6, all of it goes in the prompt. A `CANNOT:` is
said in plain words and the run stops.

Show the parts map and the cells in plain words, and what the agent said was
`missing`:

```
Parts: crimp, body with the label, flip cap.
Cells: front, 3/4, side, top, detail. No back: no photo shows it.
yes / edit / no
```

`edit` takes the person's changes and asks the agent again.

## 4. Say what it costs, then ask

Call `image_quote(pictures: 2, from_images: true)`. One picture is made now;
the second is made only if a cell fails its check. Say the model, the
points for both, and what is left, in plain words, and offer to switch the
model. If they name one, pass it as `model` here and on every picture of
this run.

When the balance covers only one picture, say so before the yes: this run
makes the Product Sheet's picture alone, a cell that fails its first look
is marked `needs_real_photo` with no second picture, and the Use Sheet
waits until there are points for it.

```
1 picture now, 1 more only if a cell fails — <model>, <n> points each,
2 at most, leaving <n>.
yes / pick / no
```

With a balance for one picture the first line reads instead
`1 picture now, none more: the balance covers one — <model>, <n> points,
leaving <n>.`

`--dry-run` stops here and spends nothing.
**`--yes` is not accepted by this command.** It spends points.

## 5. Make the grid

Only after the yes, call `generate_image_from_image(prompt: <grid_prompt>,
input_urls: <the photo links>, aspect_ratio: <the agent's aspect_ratio>)`.
Then follow the **plgn-image-prompting** skill's waiting cycle with
`check_generation`. The grid's address is the finished picture's `url` and
`public_id`: where the client waits for the picture, `check_generation`
reports them; where a sheet job makes the picture, the job's answer
carries them. Keep both; section 7 sends the `url` as `secure_url`.

## 6. Check every cell

Send the agent the check job: the grid link, the photo links, the parts map,
the `never` lines, the cells, and "first look". It opens the pictures with
`image_view` and returns the cells as it measured them on the real grid,
and a mark for each.

Any cell it marks `failed`: make one more picture whose prompt is the
agent's `retry` text alone (it is the whole new sheet text; never add it to
`grid_prompt`), and send the check job again as "second look", unless
section 4 said the balance covers one picture: then that cell is
`needs_real_photo` and no second picture is made. On the second look a cell
that still fails is `needs_real_photo`.
Never a third picture. A second picture is paid for with the points the quote
stated.

## 7. Save

Call `sheet_create(offering_id, kind, grid: { secure_url, public_id }, cells:
<the measured cells>, parts_map, never)`, adding `variant`
only when the offering has variants and `use_map` only for a use sheet. `grid`
is the picture the last look checked (the second picture after a retry), and
`cells` are that look's measured cells. Then
`sheet_mark(sheet_id, marks: [{ cell_id, mark, note }])` with the agent's
marks and notes. Then `sheet_cut(sheet_id)`.

An `ERROR:` is said plainly, with the points already spent. A refusal for a
price or a missing cell is fixed and sent again, not skipped. The picture
that was made stays in the workspace.

## 8. Hand it over

Call `sheet_get(sheet_id: <the sheet's id>)`, then print the sheet in this
form, one line per cell, the mark in capitals (SOURCE-MATCHED, INFERRED ·
CHECKED, NEEDS REAL PHOTO):

```
Bunduq Coffee Ethiopia 250g · Product Sheet v1 · draft
  Front          SOURCE-MATCHED
  3/4            INFERRED · CHECKED
  Top            INFERRED · CHECKED
  Back           NEEDS REAL PHOTO
Approve? yes / pick / no
```

- `yes`: call `sheet_approve(sheet_id)`.
- `pick`: the person names the cells to leave out. Call `sheet_mark` for
  them as `needs_real_photo` with the note "left out by the person", then
  `sheet_cut(sheet_id)`, then `sheet_approve(sheet_id)`.
- `no`: it stays a draft on the Assets page, and nothing uses it.

A refusal because the person is a member: an owner or admin approves it on
the Assets page. Say so and stop there.

## 9. The Use Sheet

Send the agent the plan job again with `kind: "use"` and the sources a use
map needs: the offering's text and benefits, its photo links, and the
designer read's lines about who uses it (never a price). Go on only when the
`use_map` it returns documents the opening or set-up step (the sheet needs
`use_1`); then run sections 3 to 8 again with that `use_map`, with its own
quote and its own yes. When it answers `CANNOT:` or the opening is not
documented, say there is no use sheet and why: nothing in the source shows
how it opens or is set up.

## 10. Say what happened

Points spent, the sheet ids and versions, the cells that can be used, the
cells that need a real photo, and whether the sheet is approved or waiting
for a person.

## Notes

- **Never spend before asking.** `image_quote` and the person's yes come
  before `generate_image_from_image`.
- **No price on a sheet.** Not in a cell, not in a map.
- **One variant per run, one picture per cell.** Never fill a cell from
  memory.
- **No seam.** This user is already signed up.
- Replies follow the **plgn-reply-style** skill, including the user's language.
