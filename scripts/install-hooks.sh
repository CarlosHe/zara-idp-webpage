#!/usr/bin/env bash
# install-hooks.sh — wires scripts/hooks/* into .git/hooks via symlink.
# No-op if the webpage folder is not a git repo.

set -u
set -o pipefail

repo_root="$(git rev-parse --show-toplevel 2>/dev/null || echo "")"
if [[ -z "${repo_root}" ]]; then
  echo "[install-hooks] not inside a git repo; skipping."
  exit 0
fi
cd "${repo_root}"

hooks_src="${repo_root}/scripts/hooks"
hooks_dst="${repo_root}/.git/hooks"

for src in "${hooks_src}"/*; do
  name="$(basename "${src}")"
  dst="${hooks_dst}/${name}"
  if [[ -f "${dst}" && ! -L "${dst}" ]]; then
    echo "[install-hooks] skipping ${name}: real file present in .git/hooks (remove it first)."
    continue
  fi
  chmod +x "${src}"
  ln -sfn "${src}" "${dst}"
  echo "[install-hooks] linked ${dst} -> ${src}"
done
