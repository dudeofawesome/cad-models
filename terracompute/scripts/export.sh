#!/usr/bin/env bash
# Export every reference part and layout view to gpu-shelf/output/ as STEP,
# then print a viewer link for each. The viewer must be running
# (pnpm --filter terracompute dev:layout) for the links to open.
set -euo pipefail

out=gpu-shelf/output
mkdir -p "$out"
dir=$(node -e 'console.log(encodeURIComponent(require("path").resolve(process.argv[1])))' "$out")

for f in gpu-shelf/references/*.brep.ts gpu-shelf/layout/*.brep.ts; do
  name=$(basename "$f" .brep.ts)
  # The CAD kernel prints transfer statistics on every export; keep them
  # in a log and show it only if the export fails.
  if ! brep verify "$f" --step "$out/$name.step" > "$out/$name.log" 2>&1; then
    cat "$out/$name.log"
    echo "failed: $f" >&2
    exit 1
  fi
  rm "$out/$name.log"
  echo "$name: http://127.0.0.1:7373/?dir=$dir&file=$name.step"
done
