# Deployment

```
npm install
npm run dev
```

```
npm run deploy
```

# Sercrets

Set `.dot.vars` file for local development

On production, set the following environment variables:

```bash
wrangler secret put <KEY>
```

# Cloudflare Workers

Use the wrangler CLI to deploy the worker.

```bash

npm install -g @cloudflare/wrangler

wrangler login

wrangler init

wrangler deploy

wrangler secret put OPENAI_API_KEY

```
