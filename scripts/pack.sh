#!/usr/bin/env bash
set -euo pipefail

ncc build src/main.ts -m -q
ncc build src/post.ts -m -q -o dist/post
cp dist/post/index.js dist/post.js
rm -rf dist/post