# AdTech + DevOps Interview Learner

Personal interview prep tool covering Undertone/Perion AdTech and DevOps topics.

## Setup

```bash
npm install
```

## Run locally

```bash
npm start
```

## AI Features (Quiz + Interview Practice)

Requires an Anthropic API key.

1. Copy `.env.example` → `.env`
2. Add your key: `REACT_APP_ANTHROPIC_KEY=sk-ant-...`
3. Restart the dev server

Without the key, quizzes fall back to static questions.

## Deploy to Netlify

1. Push this repo to GitHub
2. Connect repo in Netlify → "New site from Git"
3. Build command: `npm run build`
4. Publish directory: `build`
5. Add env var: `REACT_APP_ANTHROPIC_KEY` → your key
6. Deploy!
