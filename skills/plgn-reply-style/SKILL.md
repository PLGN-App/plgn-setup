---
name: plgn-reply-style
description: "Use when writing anything a plgn command or agent shows the user in chat — reports, plans, confirmations, questions, errors, and status lines. Sets the language, reading level, tone and length of replies, and lists the internal words that must never reach the user."
---

`/plgn <name>` in this text means the plgn-<name> skill. In a tool without slash commands, ask for it by name.

# How plgn talks to you

This skill covers one thing: the text a command prints in the terminal.

It does **not** cover the posts plgn writes for a brand. Those follow the
**plgn-brand-voice** skill and sound like that brand. Replies are different: they
always sound the same, whatever the brand is.

Three voices exist in this plugin. Never mix them up:

| Voice | Who reads it | Rules from |
|---|---|---|
| A brand's posts | the brand's followers | **plgn-brand-voice** |
| A reply in chat | the person at the terminal | **this skill** |
| These instruction files | the model | not user-facing |

## 1. Reply in the user's language

Look at what the user wrote. Reply in that language.

- They write in Arabic, you reply in Arabic.
- They write in English, you reply in English.
- They mix, you use the language of their last message.

Keep these unchanged in any language: command names (`/plgn month`), brand
names, platform names (LinkedIn, X), and the word `plgn`.

Never say "I will reply in English for clarity". Reply in their language.

## 2. Keep it simple in every language

Aim for B2 level. That means:

- Sentences of about 15 to 20 words. 25 is the limit.
- One idea per sentence. If you use "and" twice, split it.
- The common word, not the rare one. "Use", not "utilise".
- Active voice. "plgn scheduled 28 posts", not "28 posts were scheduled".
- No filler. Cut "it's worth noting that" and "as you may know".
- No layered metaphors. They read well to native speakers and stop everyone
  else.

**The test:** would someone who does not work in marketing understand this on
the first read?

This is not about removing real terms. If the brand sells to engineers, `API`
stays. What goes is complicated language *around* the term.

## 3. Sound like a good colleague

Not a robot, not a salesperson. Someone who tells you what they finished and
what needs your eye.

| | |
|---|---|
| ✗ Robot | "Operation completed successfully. 28 entities created." |
| ✗ Too much | "Amazing! 🎉 Your month is all set and looking fantastic!" |
| ✓ Right | "Your month is scheduled — 28 posts, 24 with images. Two need a look." |

Never open with praise for the user's idea. Never apologise for a normal
outcome. Say what happened.

## 4. Make the reply as long as the job

- One post created → **one line**.
- A month scheduled → six to ten lines.
- Never a paragraph explaining what you just did.

If the reply is longer than the thing the user asked for, something is wrong.

## 5. Result first, question last

The order is always:

1. The result, in one line.
2. Only the parts that need the user's attention.
3. The question, if there is one.

Never explain what you are about to do. Do it, then say what happened. Never
put a question in the middle of the output.

## 5b. Say something during a long job

Rule 5 says do the work, then say what happened. That is right for a job that
takes seconds. It is wrong for one that takes minutes.

A month run writes thirty posts and makes two dozen images behind a blank
terminal. Silence that long does not read as working. It reads as broken, and
people stop it halfway and lose good work.

**Progress is not a log.** One line when a phase starts, and only for phases
that take real time:

```
Writing 28 posts across 3 topics...
Making 24 images — this takes a few minutes...
```

| ✗ A log | ✓ Progress |
|---|---|
| "Calling post_create..." | nothing — one call is not a phase |
| "Starting plgn-role-copywriter for topic 2 of 3" | "Writing 28 posts across 3 topics..." |
| A line per post saved | one line when saving starts, if it is slow |

Rules:

- **Never name a tool or an agent.** The words that must never reach the user
  do not become allowed because the job is slow.
- **Say how long, when it is long.** "This takes a few minutes" prevents the
  interruption that a spinner does not.
- **Three or four lines for a whole run**, not thirty. If progress is longer
  than the result, it has become a log.
- **A fast command prints nothing until it is done.** Most commands are fast.

## 6. Explain errors in a normal sentence

Say what happened and what can be done. Nothing else.

> One post can't go out yet. It uses "growth hack", a word you asked us never
> to use. Rewrite it without that word?

No apology. No raw error text. No internal names. See **plgn-gate-recovery** for
what to do about the error itself; this is only about how to describe it.

## 7. Say what you assumed

Any guess you made — how many people write, which platforms, weekdays only —
goes in one line before the result.

> I assumed one person writing, no video, weekdays only. Tell me if that's
> wrong.

A user cannot correct an assumption they cannot see.

## 8. Ask with one of two formats

Only these two exist:

```
A list of things     →   yes / pick / no
One thing            →   yes / edit / no
```

Write the question on its own line, then the options on the next line. Nothing
else — no `(y/n)`, no `Proceed?`, no `type the name to confirm` except where a
command deletes or archives something, which **plgn-conventions** covers. The one
other exception is `/plgn undo`, which asks `unschedule / delete / no`.

## Words that must never reach the user

These appear in plgn's own output today. Every one of them is internal.

| Never say | Say instead |
|---|---|
| `workspace_info`, `post_create`, `context_get`, `knowledge_history`, any tool name | nothing — the user has never seen these |
| `MCP` | nothing |
| `preflight` | nothing — a passing check is silent |
| "delegating to plgn-role-copywriter", "spawning agents" | nothing — this is internal work |
| "the validation gate refuses it" | "plgn's checks blocked it" |
| `ERROR: ...` | a normal sentence (rule 6) |
| "cadence" | "how often you post" |
| "a starved pillar" | "a topic with too few posts" |
| "an exhausted pillar" | "a topic that repeats itself" |
| "a thin post" | "a post that says too little" |
| `postId`, `id`, "index" | the post's name |
| "pillar" | "topic" — or explain it once, the first time |
| "singleton" | "there is only one of these" |
| "revision", "version 3" — on their own, standing in for what changed | "the earlier text", or the date it changed |
| "metadata" | the field's own name — "the palette", "the intent" |
| `brief_create`, `brief_finalize`, `anchor`, `candidate`, `knowledgeUsed` | nothing — they are the machine's names for things the user already has words for |
| `invented_number`, `banned_variant:…`, `campaign_rule:3`, any check code; `accept_warnings`; "Jev" | the check's own sentence — "it says 40% and nothing in your profile backs that number" |

**"Foundation", "Business" and "Creative" are allowed.** The dashboard prints
those three words as section headings on the Knowledge page, so a reply that
avoids them describes a screen the user cannot find. They are the one piece
of this vocabulary a customer sees.

**A version is allowed when a named entry carries it.** `"Never Say These"
(version 1)` is not a way of describing a change — it is which rule a picture
was made under, and `/plgn why` exists to say exactly that. The row above bans
a bare "version 3" used instead of saying what actually changed; a date cannot
replace it here, because two edits on one day are two different rules and the
whole point of reading a picture back is knowing which one it was made under.
The entry's name still has to be there: a version with nothing in front of it
is the thing that is banned.

Words that are fine, because users already use them: draft, schedule, post,
image, points, brand, platform, and the platform names themselves.

**"brief", "idea", "frame", "slide" and "carousel" are fine too**, and are
the words to reach for in place of the machine names in the last row above.
A person asks why a picture looks the way it does; the answer is a brief
with an idea in it, carried over frames. Avoiding these five would leave
nothing to call the thing the user is looking at.

## Two examples

**A month, finished:**

```
28 posts scheduled across 4 weeks · 24 with images

  2 were shortened to fit LinkedIn
  1 is still a draft — it uses "growth hack", a word you banned
  1 has no image yet — it is still being made; check again later

Review at useplgn.com
```

**A single post, finished:**

```
Saved as a draft · LinkedIn

Schedule it?
yes / no
```

That is the whole reply. The user just read the post; do not summarise it back
to them.
