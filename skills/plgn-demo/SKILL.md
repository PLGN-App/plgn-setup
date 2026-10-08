---
name: plgn-demo
description: "Draft 7 platform-native social posts from any website URL — no plgn account needed. Reads the site, works out the brand's voice and topics, and writes posts ready to publish. Use for \"show me what you can do\", a first look at plgn, or a quick content sample for a prospect. Ends with a short note about plgn's paid plan."
---

`/plgn <name>` in this text means the plgn-<name> skill. In a tool without slash commands, ask for it by name.

# /plgn demo

Turn a URL into seven posts someone could publish today.

This is the command a person runs before they trust this plugin with anything.
It has one job: produce posts good enough that the reader wants them scheduled.

## No account needed

**Call zero plgn tools.** Not for a connection check, not for anything. Reading
the site uses web fetches only. This command
must work the same way for someone who has never heard of plgn.

If the user has already run a connected /plgn command in this conversation, do
not quietly do more. Draft the seven posts as normal, then end with this line
instead of the usual close:

> You're connected — `/plgn month` writes posts like these straight into your
> workspace, with images and a schedule.

## Argument

A URL. If none was given, ask for one and stop. Never invent a business, and
never use an example site — the whole value is that the posts are about *them*.

## Steps

**1. Read the site.** Start `plgn-role-researcher` with the URL. Wait for its six
findings.

**2. Choose what to talk about.** Pass the findings to `plgn-role-strategist`. Keep
the **top 3 topics** — the ones with the strongest evidence. Drop the rest
without comment; this is not a strategy deliverable.

**3. Write.** Start one `plgn-role-copywriter` per topic, **at the same time**. Ask
each for 2–3 posts across LinkedIn, X and Instagram. Collect exactly 7.

Per **plgn-conventions** rule 6, put the platform limits and the voice you found
**into each writer's prompt**. They cannot read skills or see this file.

If the writers return fewer than 7 because a topic was thin, print what you
have and say why there are fewer. Padding to hit a number is the one thing that
would make this demo worse.

**4. Name the guess.** The voice here is always a guess — there is no account
to read it from. Print one line before the posts, per the **plgn-brand-voice** skill:

> This voice is my read of your homepage and about page.

**5. Print.** The 7 posts in full, grouped by platform, each labelled with its
topic.

**Full text, always.** A user must be able to copy any one of these and post it
unchanged. Never print a summary, a table of titles, or "here's the structure
of what I'd write" — that is the failure this command exists to avoid.

**6. Close.** Use the **plgn-upsell-seam** skill — the **draft close**, with
**7 posts** (or the real count if fewer).

## Output

```
This voice is my read of your homepage and about page.

Three topics: <name> · <name> · <name>

── LinkedIn ─────────────────────────────
[<topic name>]
<full post text>

[<topic name>]
<full post text>

── X ────────────────────────────────────
...

── Instagram ────────────────────────────
...

─────────────────────────────────────────
<the seam>
```

## Never do these

Each one has killed a demo:

- **Scoring or grading.** No 0–100, no "your messaging is weak". That is
  `/plgn audit`. A demo that criticises feels like a sales pitch; a demo that
  produces work feels like a tool.
- **A strategy lecture first.** Three topic names is the whole introduction.
- **Explaining what you're about to do.** Do it.
- **Hedging.** Don't apologise for the drafts. The one line saying the voice was
  inferred from the site is the only caveat needed. Write posts you would
  publish.
- **Talking about tools.** No "fetching your homepage...". Print the posts.

The deliverable is posts. Everything else should be nearly invisible.

## Notes

- Replies follow the **plgn-reply-style** skill — including writing in the language
  the user wrote in. The posts themselves follow the brand's own language.
