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

# The full suite, green before every push; CI scopes pull requests to the areas they change (ci.yml).
check: static-checks test build smoke widgets

# `check` with every browser test three times, to surface flaky tests (CI on the release PR).
check-repeat: static-checks test build
    pnpm --filter @skillsite/marketing e2e --repeat-each=3
    pnpm --filter @skillsite/portal e2e --repeat-each=3
    pnpm --filter @skillsite/ui widgets --repeat-each=3

# --- Apps ---

# Both apps: the site on http://localhost:3000, the portal on http://localhost:3001.
dev:
    pnpm dev

build:
    pnpm build

# --- Testing ---

test:
    pnpm test
    node --test .claude/hooks/

# Functional smoke test of both apps against their production builds (needs `playwright install chromium` once).
smoke:
    pnpm smoke

# Browser checks against a fresh static Storybook build (shares the installed Chromium).
widgets:
    pnpm widgets

# --- Docker ---

# Builds the marketing app; the portal via `just docker-build skillsite-portal:local portal`.
docker-build image="skillsite:local" app="marketing":
    docker build --build-arg APP={{ app }} -t {{ image }} .

docker-run image="skillsite:local":
    docker run --rm --env-file apps/marketing/.env -p 3000:3000 {{ image }}
