# Wingman

A texting coach for men. Practice real conversations with realistic, AI-played women,
get graded like a test, and learn what actually works: being yourself, curiosity,
charisma, leading with clear plans, reading signals, and respect.

## Features
- **5 scenarios**: new match (you first / she first), met at a bar, friend set you up, after the first date.
- **11 personalities**, each with a hidden interest level, hidden life circumstances and sometimes a red flag.
- **Realistic behavior**: she can reply slowly, leave you on read, ghost, unmatch or block.
  Replies always arrive within a few seconds, and a note says how long she really took ("Replied 2 hours later").
- **Two skins**: a dating-app chat and a phone text thread.
- **Timeout**: a mid-chat read from your coach, based only on what is visible.
- **Results**: letter grade, 7 skill scores, outcome (with "on you / not on you"), annotated replay,
  her private thoughts, interest graph, friendship vs. romance read, red and green flags (hers and yours), rewrites.
- **Progress** tracking and a **Playbook** of short lessons.

## Run it on your phone
It is a static web app with no build step. The easiest host is GitHub Pages:
1. Push this folder to a GitHub repo.
2. In the repo, go to **Settings → Pages**, set **Source: Deploy from a branch**, **Branch: main / (root)**, then Save.
3. Open the Pages URL on your iPhone in **Safari**, tap **Share → Add to Home Screen**.
4. Open Wingman from the home screen and paste your Claude API key (from console.anthropic.com → API Keys).

Run locally: `python3 -m http.server 8000` in this folder, then open http://localhost:8000.

## How it works
- `js/ai.js`: all Claude calls (Claude Opus 5.5 by default) using structured JSON outputs.
  Three roles: **setup** (invents her), **her** (plays her turn by turn with a hidden interest score),
  and **coach** (timeouts and final grading). She and the coach use separate prompts so she never helps you.
- `js/data.js`: scenarios, personalities, circumstances, red flags, grading categories and Playbook lessons.
- `js/app.js`: screens and the chat engine. `js/store.js`: on-device storage.
- `js/vendor/anthropic.js`: the official Anthropic TypeScript SDK (v0.131.0) bundled for the browser.

## Before the App Store
The personal version calls Claude directly from the phone with your own API key. A public release needs a small
backend that holds the API key, handles accounts and subscriptions, and rate-limits usage, plus a native wrapper
(e.g. Capacitor) to submit to the App Store.
