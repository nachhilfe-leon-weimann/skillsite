set shell := ["bash", "-cu"]

# --- Quality ---

format:
    pnpm format

format-check:
    pnpm format:check

lint:
    pnpm lint

typecheck:
    pnpm typecheck

# Design ratchet: counts of design-system bypasses may only fall (design-ratchet.json).
ratchet:
    node scripts/design-ratchet.mjs

ratchet-update:
    node scripts/design-ratchet.mjs --update

# `next build` type-checks the apps; `typecheck` covers the packages it does not (incl. stories).
static-checks: format-check lint typecheck ratchet

# Everything that must be green before a push; CI's `check` job runs the same.
check: static-checks test build smoke

# --- Site ---

dev:
    pnpm dev

build:
    pnpm build

# --- Testing ---

test:
    pnpm test

# Functional smoke test against the production build (needs `playwright install chromium` once).
smoke:
    pnpm smoke

# --- Docker ---

# Builds the marketing app; another app via `--build-arg APP=<name>`.
docker-build image="skillsite:local":
    docker build -t {{ image }} .

docker-run image="skillsite:local":
    docker run --rm --env-file apps/marketing/.env -p 3000:3000 {{ image }}
