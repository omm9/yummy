# Yummy

A kitchen co-pilot for **planning recipes as a timeline**, not a static ingredient list.

Each recipe is a list of steps with start time, duration, heat, and activity. Parallel work (soak rice while you chop vegetables) is first-class: time is a start offset from `0:00`, and the recipe total is the last step to finish.

Live data stays in the browser (`localStorage`) for now. Interactive cooking mode (audio guidance, timers) is stubbed and not built yet.

## What you can do

- Browse sample recipes (Alu Dum Biryani, Tomato Dal, Jeera Rice, Garlic Scrambled Eggs) or create your own
- Rename and delete recipes
- Edit a **scrollable timeline** per recipe:
  - Step number
  - Flame / heat (high, medium, low, or off)
  - Activity (pick a group, then a leaf such as soaking, chopping, tadka, simmering)
  - Start **time** and **duration**
  - Per-step timeline bar from `0:00` to recipe end
  - Ingredients (one item per line) and alternatives
- Add, drag-reorder, and delete steps (delete has undo)
- See a merged **All ingredients** list derived from every step
- Lock editing while Interactive Mode is on (placeholder for the co-pilot)

## Stack

- Vite, React, TypeScript
- Tailwind CSS
- Zustand (state + `localStorage`)
- @dnd-kit (step reorder)
- Sonner (toasts)
- Cloudflare Workers static assets (`wrangler.jsonc`) for hosting

## Run locally

Needs Node.js 20+ (this repo was developed on Node 20).

```bash
git clone https://github.com/omm9/yummy.git
cd yummy
npm install
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`).

```bash
npm run build    # production build → dist/
npm run preview  # serve the production build locally
npm run lint
```

## How timing works

- **Time** = when the step **starts**, relative to recipe begin (`0:00`)
- **Duration** = how long that step runs
- A new step defaults to the **latest finish** among existing steps (so it follows the longer of two parallel tasks)
- You can edit Time to overlap steps (chop during a soak)
- A warning appears if a step starts **before** the previous step’s start
- Recipe total = latest `start + duration`, not the sum of durations

## Activity picker

Activities are grouped (pre-prep, knife work, dry heat, moist heat, oven/grill, mixing, finishing). Open **Group…**, hover a group (tap on mobile) to see activities on the right, then choose one. The selected leaf is shown next to the group control.

## Deploy (Cloudflare)

This is a static Vite app. Cloudflare’s current Git flow uses:

| Setting | Value |
|--------|--------|
| Build command | `npm run build` |
| Deploy command | `npx wrangler deploy` |

`wrangler.jsonc` publishes `./dist` as a single-page app.

After you push to `main`, Cloudflare can rebuild automatically if the GitHub repo is connected.

## Product notes

- Recipes **do not sync** across devices until a backend exists
- Clearing site data resets local recipes (samples are re-seeded on migrate)
- Spec for later interactive/audio behaviour: `PRD_Specification.pdf`

## License

Private / unpublished unless you add a license file.
