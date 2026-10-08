---
name: plgn-help
description: "Show every plgn command in one list, split into the ones that need an account and the ones that don't, with a one-line description each. Use for \"what can plgn do\", \"list commands\", \"plgn help\", or when you can't remember a command's name."
---

`/plgn <name>` in this text means the plgn-<name> skill. In a tool without slash commands, ask for it by name.

# /plgn help

Print the command list. Call no tools. Answer nothing else.

This exists because twenty-seven commands is more than anyone remembers, and the
README is not open while someone is working.

## Rules

- **Call zero tools**, including `workspace_info`. This command works whether
  or not the user has an account.
- **No seam.** This is not a sales surface.
- **Print the list and stop.** Do not offer to run anything, and do not ask a
  follow-up question.
- Follow the **plgn-reply-style** skill — in particular, print this in the language
  the user wrote in. Command names stay in English.

## Output

```
plgn — marketing content from your terminal


NO ACCOUNT NEEDED

  /plgn demo <url>          7 ready-to-post drafts from any website
  /plgn audit <url>         Score a brand's content out of 100
  /plgn strategy <url>      Positioning and 3-5 topics to post about
  /plgn voice <url>         A brand voice guide you can paste into setup
  /plgn competitors <url>   What 3-5 rivals say, and what none of them say
  /plgn calendar <subject>  A 30-day plan: date, platform, topic, hook


NEEDS AN ACCOUNT

  Setting up
  /plgn setup               Connect, then teach plgn how a brand sounds
  /plgn brandkit <url>      Learn a brand fully — voice, look, references,
                            its real things, and what is still missing
                            before campaigns
  /plgn brand               Add, rename, archive or restore a brand
  /plgn knowledge           Check and fix what plgn knows about a brand
  /plgn assets              Save the brand's real things — logo, character,
                            people, places — so pictures use them
  /plgn import-store <url>  Bring products in from a Shopify, WooCommerce
                            or EasyOrders store
  /plgn product-sheet <product>
                            Check a product from every side and approve it,
                            so pictures show the real thing

  Making content
  /plgn campaign <subject>  Start a campaign, see what's running, mark one done
  /plgn month <subject>     A month of posts: written, illustrated, scheduled
  /plgn post <idea>         One idea, one post
  /plgn repurpose <url>     Turn one article into a set of posts
  /plgn visuals <refs>      Work out how a brand's pictures look, and save it
  /plgn images [filters]    Add images to posts that have none

  /plgn undo                Take back the last batch — unschedule or delete

  Keeping it healthy
  /plgn queue               What's blocked, what's missing, what's ready
  /plgn topics              Which topics are tired, and which need more
  /plgn library [filters]   Tidy up saved snippets and hashtag sets
  /plgn refresh [filters]   Rewrite good old posts and run them again
  /plgn report              What went out, and how the plan held
  /plgn why <post>          The thinking behind one picture, read back


/plgn visuals decides how pictures should look. /plgn images makes them.

New here? Try /plgn demo with your website. It needs no account.

Just installed or updated plgn? Restart your AI tool first, or the commands
won't be there yet.
```

## Notes

- **Keep the grouping.** The three groups under "needs an account" tell someone
  where they are in the process. A flat list does not.
- **One line each, and no more.** If a description needs two lines, the command
  needs a better description.
- If the user asks about one command by name, print that command's line plus
  two or three sentences on what it does. Do not print the whole list again.
