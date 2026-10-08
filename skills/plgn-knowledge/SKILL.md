---
name: plgn-knowledge
description: "Check what plgn knows about a brand — voice, audience, offers, banned words — and fix what's missing, out of date, or contradicting itself. Use for \"check my brand profile\", \"update my voice\", \"my posts sound wrong\", or after a repositioning."
---

`/plgn <name>` in this text means the plgn-<name> skill. In a tool without slash commands, ask for it by name.

# /plgn knowledge

Everything this plugin writes rests on what is saved about a brand. This
command checks whether it still holds.

When someone says their posts "sound wrong", the cause is almost always here — a
voice saved from a site that has since changed, or two entries pulling in
different directions.

## 1. Check the connection

Call `workspace_info`. If it fails, print the message from **plgn-conventions**
rule 2 and stop.

## 2. What to report

Read `context_get(role: "all")`, then `offering_list` and `campaign_list`.

If nothing is saved, send them to `/plgn setup` and stop — that command owns
setting these up, and doing it here would mean two places to fix later.

### Foundation — four slots

Say **fine**, **thin** or **missing** for each:

```
Foundation
  Identity        fine
  Positioning     thin — two lines, and no market named
  Voice           fine
  Audience        missing
```

"Thin" is a judgement and it must carry its reason. "Missing" is a fact.

### Business and Creative

Count them, then name what is stale or in conflict:

```
Business        7 entries
  Two competitor entries describe the same company under different names
  The SEO terms have not changed since March

Creative        3 references, 1 approved post
```

### Offerings

```
Offerings       2 · 1 without benefits
```

"1 without benefits" is the single most common gap and the one worth leading
with — a benefit-less offering gives every writer a name and nothing to say
about it.

### Campaigns

```
Campaigns       Ramadan 2027 running until 2 Mar
                Spring menu still a draft with no dates
```

A draft with no dates is never current, so nothing inherits it. Say so.

## 3. Fixing what you find

For each gap, suggest specific replacement text — not "add more detail".

Where a website is available, offer to read it again with `plgn-role-researcher` and
draft entries from the current copy, exactly as `/plgn setup` does. A brand that
repositioned six months ago needs a fresh read, not an edit.

**Show every suggested entry in full and ask before saving.** Then:

- `knowledge_add` for an entry that does not exist at all — with `confirm: true`
  when it is a Foundation slot, sent only after the user's yes.
- `knowledge_update` for one that exists but is thin, out of date or wrong —
  the same `confirm: true` rule applies when it is Foundation.
- `offering_update` for offerings.

One fix at a time, each one confirmed.

Where two entries disagree, do not pick a side. Show both readings and ask which
is true — only the user knows.

`--dry-run` prints the report and changes nothing.
**`--yes` is not accepted.** These are the brand's own words.

## 4. Explaining a change

When something looks wrong and the user asks why, `knowledge_history` shows
every stored version of that entry, newest first, with who changed it and the
note they left. Use it to answer "when did this change?" — never to undo
something without being asked.

## Deleting

`knowledge_delete` needs a clear confirmation **naming the entry**, per
**plgn-conventions**. Never delete as part of an update; update in place so nothing
is lost if the write fails.

## Notes

- **No seam.** This user is already signed up.
- **One brand per run.** Checking four brands at once produces a report nobody
  acts on.
- **Where each entry is stored** is the **plgn-brand-knowledge-map** skill's job.
  Some of what a brand knows does not live in knowledge at all.
- **A missing look is filled by `/plgn visuals`**, not here. This command can
  say it is missing; that command works it out from real pictures.
- **Missing assets are filled by `/plgn assets`**, not here. The logo, a
  character, people and places are not knowledge entries — see
  **plgn-brand-assets**.
- **Never invent a voice.** If the site is gone and the user cannot describe the
  brand, say the entry cannot be filled responsibly.
- **Specific beats complete.** A sharp entry beats a vague one — vague guidance
  is worse than none, because it reads like direction and gives none.
- Replies follow the **plgn-reply-style** skill, including the user's language.
