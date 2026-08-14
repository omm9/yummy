# Recipe Execution Assistant

Real-time audio-guided recipe execution app (v1).

## Stack

- Vite + React + TypeScript
- Tailwind CSS
- Zustand
- @dnd-kit (step reorder)
- sonner (undo toast)

## Develop

```bash
npm install
npm run dev
```

## Current scope

**A. Main View** — recipe list (select / create / rename / delete, persisted in `localStorage`) beside a scrollable timeline with step number, flame icon, duration, cumulative time, ingredients, alternatives, add / reorder / delete + undo, and edit lock during Interactive Mode.
