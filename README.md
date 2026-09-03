# TGA ICP Analyzer

Ideal Customer Profile (ICP) analysis tool for [The Global Associates](https://theglobalassociates.com). Analyze B2B companies against a centralized ICP Knowledge Base with GPT classification, weighted scoring, and bulk CSV upload.

## Tech Stack

- **Next.js 15** (App Router)
- **TypeScript** + **Tailwind CSS**
- **OpenAI** — industry classification & ICP evaluation
- **Apollo.io** — optional firmographic enrichment
- **Netlify Blobs** — persistent storage in production

## Local Development

```bash
npm install
cp .env.example .env.local
# Add your OPENAI_API_KEY (and optional APOLLO_API_KEY) to .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Local data is stored in `/data/*.json`.

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `OPENAI_API_KEY` | Yes | OpenAI API key for GPT analysis |
| `OPENAI_MODEL` | No | Default: `gpt-4o-mini` |
| `APOLLO_API_KEY` | No | Apollo.io enrichment |

## Deploy to Netlify (via GitHub)

### 1. Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit — TGA ICP Analyzer"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/tga-icp-analyzer.git
git push -u origin main
```

> **Do not commit** `.env` or `.env.local` — they are gitignored.

### 2. Connect Netlify

1. Go to [app.netlify.com](https://app.netlify.com) → **Add new site** → **Import from Git**
2. Select your GitHub repo
3. Netlify auto-detects settings from `netlify.toml`:
   - **Build command:** `npm run build`
   - **Plugin:** `@netlify/plugin-nextjs`
   - **Node version:** 20

### 3. Set Environment Variables on Netlify

In **Site settings → Environment variables**, add:

- `OPENAI_API_KEY`
- `OPENAI_MODEL` (optional)
- `APOLLO_API_KEY` (optional)

### 4. Deploy

Click **Deploy site**. Netlify will build and deploy automatically on every push to `main`.

### Production Storage

On Netlify, the serverless filesystem is read-only. The app uses **Netlify Blobs** to persist:

- ICP Knowledge Base (`icp-current`, `icp-history`)
- Analysis results (`analyses`)

On first deploy, ICP data is seeded from `data/icp-current.json` and `data/icp-history.json` in the repo.

## Project Structure

```
src/
  app/              # Pages & API routes
  components/       # UI components
  lib/
    icp/            # ICP types, scoring engine, storage
    analysis/       # Analysis pipeline & CSV
    integrations/   # OpenAI, Apollo, website extractor
data/
  icp-current.json  # ICP seed (committed)
  icp-history.json  # Version history seed (committed)
```

## License

Private — The Global Associates

**Designed & Developed By Mohammad Aquib**
