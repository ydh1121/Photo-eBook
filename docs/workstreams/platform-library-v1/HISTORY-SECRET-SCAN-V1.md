# Full Git History Secret Scan V1

Status: active

The repository is public, so secret review must cover the complete Git history rather than only the current tree.

The canonical scan runs in GitHub Actions with a full-depth checkout and pinned Gitleaks version. Findings are redacted in logs. A clean scan is required before this task can be marked complete.

Workflow owner: `.github/workflows/git-history-secret-scan.yml`.

Do not copy any detected secret value into workstream notes, issues, pull requests or chat summaries. Record only finding type/path/commit metadata needed for remediation.
