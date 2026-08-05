.PHONY: setup secrets backend-check frontend-check e2e check dev

PYTHON ?= python3.12

setup:
	$(PYTHON) -m venv .venv
	.venv/bin/pip install -r nzeroesg-api/requirements-dev.txt
	cd nzeroesg-client && npm ci

secrets:
	$(PYTHON) scripts/check_secrets.py

backend-check:
	cd nzeroesg-api && ../.venv/bin/ruff check .
	cd nzeroesg-api && ../.venv/bin/ruff format --check .
	cd nzeroesg-api && ../.venv/bin/pytest

frontend-check:
	cd nzeroesg-client && npm run typecheck
	cd nzeroesg-client && npm run lint
	cd nzeroesg-client && npm run format:check
	cd nzeroesg-client && npm run build

e2e:
	cd nzeroesg-client && npm run test:e2e

check: secrets backend-check frontend-check

dev:
	docker compose up --build
