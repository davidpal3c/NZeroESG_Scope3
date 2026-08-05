import os
import time

import pytest

from domain.workspaces.sessions import SessionSigner
from persistence.workspaces import (
    QuotaExceededError,
    build_workspace_repository,
)


def test_repository_persists_isolated_quota_usage_and_revocation():
    repository = build_workspace_repository(os.getenv("DATABASE_URL"))
    signer = SessionSigner("test-secret-that-is-at-least-32-characters", ttl_seconds=3_600)
    first, _ = signer.issue(now=int(time.time()))
    second, _ = signer.issue(now=int(time.time()))

    repository.create(first)
    repository.create(second)
    assert repository.get(first.workspace_id).workspace_id == first.workspace_id
    assert repository.get(second.workspace_id).workspace_id == second.workspace_id

    for _ in range(10):
        repository.consume_quota(first.workspace_id, "analysis_runs_per_day")
    with pytest.raises(QuotaExceededError):
        repository.consume_quota(first.workspace_id, "analysis_runs_per_day")

    first_after_usage = repository.get(first.workspace_id)
    second_after_usage = repository.get(second.workspace_id)
    assert first_after_usage.quotas["analysis_runs_per_day"].used == 10
    assert second_after_usage.quotas["analysis_runs_per_day"].used == 0

    repository.revoke(first.workspace_id)
    assert repository.get(first.workspace_id) is None
    assert repository.get(second.workspace_id) is not None


def test_repository_purges_expired_workspace_records():
    repository = build_workspace_repository(os.getenv("DATABASE_URL"))
    signer = SessionSigner("test-secret-that-is-at-least-32-characters", ttl_seconds=5)
    issued, _ = signer.issue(now=int(time.time()) - 10)

    repository.create(issued)

    assert repository.purge_expired(now=int(time.time())) >= 1
    assert repository.get(issued.workspace_id) is None
