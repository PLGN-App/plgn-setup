---
name: plgn-campaign
description: "Create and manage campaigns — one thing a brand is saying for a while, with dates, a key message, and the words it must and must not use. Lists what is running, creates one from a sentence, links what it sells and the topics it covers, and marks it done or archived. Supports --dry-run. Use for \"start a Ramadan campaign\", \"what campaigns are running\", or \"mark the launch done\"."
---

`/plgn <name>` in this text means the plgn-<name> skill. In a tool without slash commands, ask for it by name.

# /plgn campaign

A campaign is one thing a brand is saying for a while: Ramadan, a launch, a
season. It carries dates, a key message, the words to reach for and the ones to
avoid — and every post inside it inherits them.

This command writes real data to a real account.

## 1. Check the connection

Call `workspace_info`. If it fails, print the message from **plgn-conventions**
rule 2 and stop.

The reply also carries the campaign cap, per the **plgn-brand-knowledge-map**
skill. Note what it says — it decides what step 4 is allowed to do.

## 2. With no argument: show what is running

Call `campaign_list`.

```
Running now

  Ramadan 2027        1 Feb → 2 Mar    12 posts (4 scheduled)
  Spring menu         draft            0 posts

Finished

  Winter blend        Nov → Dec        18 posts, all published
```

Then stop and ask what they want. Do not create anything on an empty argument.

## 3. With a subject: work out what they mean

Four shapes, and they are told apart by the words, not by a flag:

- **"start a Ramadan campaign"** → create. Go to step 4.
- **"mark the launch done"**, **"archive Ramadan"** → go to step 6.
- **"what's in Ramadan"** → `campaign_get`, print it, stop. That is a read and
  needs no confirmation.
- **"let's think about Ramadan"**, "ideas for Ramadan", "brainstorm Ramadan" →
  go to step 8.

**A subject that names a campaign that already exists is never a second one.**
Match on the name, say which one you found, and ask whether they meant to
change it. Two campaigns with the same name is the failure `/plgn month`
already avoids for topics, for the same reason.

## 4. Create: draft it, then ask once

**Dates first, and ask if they are missing.** A campaign with no window
never becomes current, per the **plgn-brand-knowledge-map** skill. "When does it
run?" is one question and it is the difference between a record that works
and one that sits there.

Read the brand with `context_get(role: "marketing_manager")`, then start
`plgn-role-strategist` to draft the campaign block: the key message, the
constraints, and the vocabulary. Per **plgn-conventions** rule 6 its prompt carries
what it needs — the brand's voice, what it sells, the subject and the dates —
because it cannot read this file or any skill.

Also read `offering_list` and `topic_list`, so the links can be offered rather
than typed.

Show the whole thing:

```
Ramadan 2027
1 Feb → 2 Mar

Key message
  One table, everyone welcome.

Always
  gathering · unhurried · shared

Never
  hustle · limited time only

Covers
  Signature blend, Barista training

Topics
  Sourcing, Behind the counter

yes / edit / no
```

`--dry-run` ends here: print the plan, write nothing, say so.

**`--yes` is not accepted.** A campaign changes what every post written during
its window says.

## 5. Save

`campaign_create` with the name, the window, the key message per language, the
constraints, the vocabulary, and the offering and topic ids.

Start it as `draft` unless the user says it is running now. `draft` and
`active` both count against the cap; `done` and `archived` do not.

**If the cap refuses it**, follow the **plgn-gate-recovery** skill. Say which
campaign is holding the slot and what finishing or archiving it would free.

Then say what to do next:

```
Ramadan 2027 saved · 1 Feb → 2 Mar

Plan posts inside it with:  /plgn month "Ramadan 2027"
Think it through first:  /plgn campaign think "Ramadan 2027"
```

## 6. Mark done, or archive

`campaign_update(status: ...)`.

- **done** — it ran and it is over. It stops being current, so nothing new
  inherits it, and its posts stay exactly where they are.
- **archived** — put away. Same effect, plus it leaves the default lists.

Confirm **by name**, per **plgn-conventions** rule 3:

```
Mark "Ramadan 2027" as done?
yes / edit / no
```

**Never offer to delete a campaign.** Deleting unlinks it from every post and
entry that named it, and cannot be undone. Archiving is what "we are finished
with this" means.

## 7. Linking

"add the blend to Ramadan" → `campaign_update(offering_ids: [...])`.

The list is **replaced**, not appended. Read the campaign first with
`campaign_get`, add to what is there, and send the whole list back. Sending one
id removes the rest.

Same for `topic_ids`.

## 8. Think: the campaign's big idea

The big idea is the one thing every post in the campaign starts from. It is
worked out with `plgn-role-content-creator`, before any post is written.

**Which campaign.** The one named. If only one is running, that one. If
several are, ask which. If none exists, create it in step 4 first.

Everything else follows the **plgn-creative-brief** skill, "The concept comes
first": the reads, the reference index, the line for a brand with no
references, the talk, and the pick. Run the `Job: ideas` talk until the person
picks, then `Job: platform`.

On a pick, show the big idea in plain words:

```
Big idea     Everyone brings one dish; the table does the rest.
World        Warm evening light, shared plates, hands reaching in.
Series       One empty chair in every picture.
Mood board   2 "Iftar table at dusk", 4 "Hands reaching in", 5 "Empty chair"
Headlines    A short promise, then the dish's name.

Save this as the big idea for Ramadan 2027?
yes / edit / no
```

Save it as plgn-creative-brief says, updating the one that exists instead of adding
a second. If the cap refuses, follow the **plgn-gate-recovery** skill.

`--dry-run` stops before the save: show the big idea, write nothing, say so.

Then point at `/plgn month "<campaign>"`, with the campaign's name.

## Notes

- **No seam.** This user is already signed up.
- The plan is written by `/plgn month`, not here. This command creates the
  container; that one fills it.
- Replies follow the **plgn-reply-style** skill, including the user's language.
