set shell := ["bash", "-cu"]

# --- Quality ---

format:
    pnpm format

format-check:
    pnpm format:check

lint:
    pnpm lint

# Types are checked by `next build`, so `build` is the typecheck; there is no separate recipe.
static-checks: format-check lint

# Everything that must be green before a push; CI's `check` job runs the same.
check: static-checks test build

# --- Site ---

dev:
    pnpm dev

build:
    pnpm build

# --- Testing ---

test:
    pnpm test

# --- Docker ---

# Builds the marketing app; another app via `--build-arg APP=<name>`.
docker-build image="skillsite:local":
    docker build -t {{ image }} .

docker-run image="skillsite:local":
    docker run --rm --env-file apps/marketing/.env -p 3000:3000 {{ image }}
