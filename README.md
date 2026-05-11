# AdTech + DevOps Interview Learner

Personal interview prep tool — AdTech (Undertone/Perion) + DevOps topics.

## How it works

The app calls `/.netlify/functions/claude` (a serverless proxy) which forwards to the Anthropic API server-side. This avoids CORS issues that block direct browser-to-Anthropic calls.

## Local dev

```bash
npm install
npm start
```

For AI features locally, install Netlify CLI:
```bash
npm install -g netlify-cli
netlify dev        # runs app + functions together on localhost:8888
```
Create a `.env` file:
```
ANTHROPIC_KEY=sk-ant-...
```

## Deploy to Netlify

1. Push to GitHub
2. Connect repo in Netlify → "New site from Git"
3. Build command: `npm run build` | Publish: `build`
4. **Environment variables → Add:**
   - Name: `ANTHROPIC_KEY`
   - Value: your key from console.anthropic.com
5. Trigger redeploy → done
