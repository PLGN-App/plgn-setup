---
name: plgn-topics
description: "Check how healthy your content topics are — which are repeating themselves, which need more posts, and what to add — then create the ones you approve, or narrow or retire the ones you have. Supports --yes. Use for \"what should I write next\", \"check my topics\", \"am I repeating myself\", or planning before a new month."
---

`/plgn <name>` in this text means the plgn-<name> skill. In a tool without slash commands, ask for it by name.

# /plgn topics

Are the topics healthy, and what is missing?

A list of topics is easy to read. What is hard — and what this command is for —
is noticing that a topic has been saying the same thing for six weeks.

## 1. Check the connection

Call `workspace_info`. If it fails, print the message from **plgn-conventions**
rule 2 and stop.

Call `context_get(role: "marketing_manager")` for the brand's voice and what
it stands for.

## 2. Read

Call `topic_list` first. It already hands you an exact, uncapped count for
every topic — `<n> ideas (<n> scheduled, <n> published)` — so the all-time
figure is settled before you read anything else. Do not spend a `post_list`
to recompute a number you already have.

Then call `post_list` for the two things `topic_list` cannot give you: the
posts themselves, and a count scoped to a campaign.

- To read the content — the hooks, the subjects, whether they repeat — call
  `post_list(topic_id: <the topic>, limit: 500)` for each topic you are
  judging in detail. Each line carries the post's first 80 characters and,
  once labelled, its `opening:` and `mix:` — enough to judge repetition
  without opening posts one by one. When lines have no `opening:`, call
  `post_label(post_ids: [<those posts>])` — a hundred ids at most per call — and read the list again.
- For a topic inside a campaign, add that campaign's window — `campaign_id`,
  `scheduled_from` and `scheduled_to` — so the count matches the rule below
  rather than counting all time.

**A window counts scheduled and published posts only.** A draft has no
scheduled date, so a date range drops every draft the topic has. For a topic
inside a campaign, make one more call with no window —
`post_list(topic_id: <the topic>, campaign_id: <the campaign>, status:
"draft", limit: 500)` — and report those drafts beside the windowed count.
Otherwise a topic with twelve drafts in a running campaign reads as zero and
gets flagged as starving.

The topic list alone does not show health —
what matters is how many posts each topic actually produced and whether they
moved the argument on.

A topic can belong to a campaign, and that changes what "needs more posts"
means. A topic inside a running campaign is not the same as a loose one. Say
which campaign a topic belongs to, and count its posts inside the campaign's window
rather than over all time — a topic with forty posts from last year and none
this month is a gap, not a surplus.

Use `topic_get` on any topic you are going to comment on in detail. The list
gives names and counts; `topic_get` gives the description and the posts.

## 3. Work out what's happening

**Repeating itself** — the topic keeps saying the same thing instead of moving
on. Signs: the same hook shape again and again, posts you could swap without
losing anything, unrelated subjects pulled in to fill slots. More posts will not
fix it; narrowing it or retiring it will.

Count the hook shapes rather than guessing them: the `opening:` labels say
how each post opens, and the `first:` text shows what it opens with. "9 of 14
open with a number" is a count off those labels. Say how many posts had no
label.

**Too few posts** — the topic exists but has almost nothing in it. Say *why*.
Often it needs proof the brand does not have yet — "this needs two customer
results before it can carry posts" is useful; quietly under-serving it is not.

**Healthy** — producing posts that each take the argument somewhere new. Count
them; do not list them.

**The mix.** Across recent posts, roughly: half that help whether or not the
reader buys, a third proof, a fifth direct asks. Flag a feed where nearly every
post asks for something, because that is what burns an audience.

Count the mix off the `mix:` labels, never by reading each post and deciding —
the same posts must give the same mix every run. Say how many posts it is out
of.

## 4. Report

```
3 topics · 34 posts over 8 weeks

Repeating itself
  Migration stories — 14 posts, 9 of them open with a number, and the last
  5 all say "legacy tools are expensive" without adding anything.
  → Narrow it to "migrations that broke after go-live", or retire it.

Too few posts
  Pricing without traps — 2 posts in 8 weeks. It needs a published pricing
  page to write against, and there isn't one yet.

Healthy
  Founder notes — 18 posts, each one going somewhere new.

Mix: 30% helpful / 20% proof / 50% asks — heavy on asks.

Add topics?
yes / pick / no
```

## 5. Create

Once approved, call `topic_create` for each agreed **new** topic. Check
`topic_list` first — never create one that already exists.

**Narrowing or retiring changes the topic you already have — never make a
second one.** A new topic next to the old one splits its posts in two and
leaves the old framing on the board. Use `topic_update` on the existing topic.
It takes `topic_id` and any of `title`, `description` and `order`; only what
you send changes.

- **Narrowing** → `topic_update(topic_id: <the topic>, title: <the narrowed
  title>, description: <what it now covers>)`. Its posts stay linked to it.
- **Retiring** → topics have no archived state, so mark it in its
  description: `topic_update(topic_id: <the topic>, description: "Retired
  <date> — no new posts. <why>")`, and leave it out of what you plan next.
  Only delete it if the user asks for that by name — `topic_delete` needs
  `confirm: true`, and it unlinks every post from the topic (the posts are
  kept, but lose their grouping).

Where a topic is repeating itself, suggest the **narrowed** version rather than
more of the old framing. The old framing is what produced the repetition.

Retiring a topic is a normal outcome, not a failure. Topics have a life, usually
a few months of regular posting. Say so when you suggest it.

`--dry-run` prints the report and creates nothing.
`--yes` skips the confirmation. Allowed here — creating or renaming a topic is
cheap and easy to undo. It never covers a delete.

## Notes

- **No seam.** This user is already signed up.
- **Never say "post more"** to fix a topic that repeats itself. Volume is what
  wore it out.
- **Judge from the posts, not the topic list.** A topic with twelve ideas and
  two posts is starved, whatever the list suggests.
- Replies follow the **plgn-reply-style** skill, including the user's language.
