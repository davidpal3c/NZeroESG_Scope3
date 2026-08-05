"""Fail when versionable files contain common credential formats or deploy hooks."""

from __future__ import annotations

import os
import re
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PATTERNS = {
    "OpenAI/OpenRouter API key": re.compile(
        r"\bsk-(?:(?:proj|or-v1)-)?[A-Za-z0-9_-]{20,}\b"
    ),
    "GitHub token": re.compile(
        r"\b(?:gh[pousr]_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,})\b"
    ),
    "AWS access key": re.compile(r"\b(?:AKIA|ASIA)[A-Z0-9]{16}\b"),
    "Google API key": re.compile(r"\bAIza[0-9A-Za-z_-]{30,}\b"),
    "Stripe live secret": re.compile(r"\b(?:sk|rk)_live_[A-Za-z0-9]{16,}\b"),
    "Slack token": re.compile(r"\bxox[baprs]-[A-Za-z0-9-]{20,}\b"),
    "Render deploy hook": re.compile(r"https://api\.render\.com/deploy/\S+\?key="),
    "private key": re.compile(r"-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----"),
}


def versionable_files() -> list[Path]:
    """Return tracked and non-ignored untracked files from the working tree."""
    result = subprocess.run(
        ["git", "ls-files", "-z", "--cached", "--others", "--exclude-standard"],
        cwd=ROOT,
        check=True,
        capture_output=True,
    )
    paths = (ROOT / os.fsdecode(path) for path in result.stdout.split(b"\0") if path)
    return sorted(path for path in paths if path.is_file())


def main() -> int:
    findings: list[str] = []
    for path in versionable_files():
        try:
            content = path.read_text(encoding="utf-8")
        except UnicodeDecodeError:
            continue

        for label, pattern in PATTERNS.items():
            for match in pattern.finditer(content):
                line = content.count("\n", 0, match.start()) + 1
                findings.append(f"{path.relative_to(ROOT)}:{line}: possible {label}")

    if findings:
        print("\n".join(findings))
        return 1

    print("No common credential patterns found in tracked or non-ignored files.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
