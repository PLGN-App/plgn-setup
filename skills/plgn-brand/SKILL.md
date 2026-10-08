---
name: plgn-brand
description: "List, create, rename, archive or restore the brands in a plgn workspace. Use for \"add a brand\", \"switch brands\", \"archive this client\", \"which brands do I have\", or running several clients from one workspace."
---

`/plgn <name>` in this text means the plgn-<name> skill. In a tool without slash commands, ask for it by name.

# /plgn brand

Manage the brands in a workspace. Agencies live here; everyone else touches it
once.

## 1. Check the connection

Call `workspace_info`. If it fails, print the message from **plgn-conventions**
rule 2 and stop.

## 2. Default: show the list

With no argument, call `brand_list` and show what exists, including whether each
one is set up — a brand with nothing saved cannot produce on-voice posts, and
that is the most useful thing to know about it:

```
3 brands

  Acme Corp        ready
  Northwind        missing its voice and banned words
  Old Client       archived

Add, change or archive one? Or run /plgn knowledge <brand> to fill the gaps.
yes / pick / no
```

## 3. Create

**No tool creates a brand.** A new brand is made in the dashboard, because it
takes one of the plan's brand slots and that is a billing decision:

```
A new brand is made in your dashboard, not from here:
https://useplgn.com/settings/brands → New brand

Tell me when it's there and I'll set it up.
```

**Never call `brand_update` to "create" one.** It has no create mode: called
with a new name and no `brand_id`, it **renames the brand the user is on**, and
their real brand is gone from the list under a stranger's name.

When they say it is there, call `brand_list` again, find it by name, and use
its id from then on. If it is not in the list, say so — do not guess an id.

Then **offer to set it up straight away** — a brand with nothing saved is a
brand nothing else can use:

> It's there. Want to build its voice from a website now? That's `/plgn setup`.

Do not do it here. `/plgn setup` owns that, and copying it means two places to
fix when it changes.

## 4. Change

Call `brand_update` with only the fields that change. Show what will change
before saving:

```
Northwind → "Northwind Systems"

Rename it?
yes / edit / no
```

Renaming a brand does not touch its posts, topics or saved knowledge. Say so;
people reasonably worry that it might.

## 5. Archive and restore

**Archive** with `brand_archive`. Present it as **reversible**, because
`brand_restore` exists — that is the difference between a decision someone makes
quickly and one they put off for months:

```
Archive "Old Client"? Its posts, topics and saved knowledge are kept, and
/plgn brand restore brings it back.

Type the brand name to confirm.
```

**Confirm by name, never by number**, per **plgn-conventions**. A mistyped number
archives the wrong client; a mistyped name archives nothing.

**Restore** with `brand_restore`, confirmed the same way.

`--dry-run` shows what would change and changes nothing.
**`--yes` is not accepted.** This command removes things from view.

## Notes

- **No seam.** This user is already signed up.
- **Archive, never delete.** This command offers no deletion. A brand's history
  is the workspace's value, and archiving already does what the user wants — it
  is out of the way and it comes back.
- **Say what a change does not affect.** Most worry here is about breaking
  something else; naming what stays untouched settles it.
- Replies follow the **plgn-reply-style** skill, including the user's language.
