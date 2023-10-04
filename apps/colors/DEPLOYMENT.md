# Deployment of the Colors app

- Fly.io
- Cloudflare pages

## Fly.io

Host the server app

```bash

curl -L https://fly.io/install.sh | sh

export FLYCTL_INSTALL="/home/node/.fly"
export PATH="$FLYCTL_INSTALL/bin:$PATH"


fly auth login

fly secrets set OPENAI_API_KEY=sk-xxxxxx

fly deploy

```

## Cloudflare pages

Host the client html/Js app

Set up with the github repository.
Serve the `main` branch, apps/colors/src/public folder
