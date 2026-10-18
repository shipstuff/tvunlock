#!/bin/sh
# Packages dist/ into an .ipk in build/ using the webOS CLI (installed as a dev dependency).
# `--no-minify` because ares' legacy minifier cannot parse modern bundler output.
set -e
cd "$(dirname "$0")/.."
[ -d dist ] || { echo "dist/ missing — run 'npm run build' first" >&2; exit 1; }
# Ship this project's own licence next to the third-party ones (public/licenses/).
mkdir -p dist/licenses
cp LICENSE dist/licenses/LICENSE.txt
mkdir -p build
rm -f build/*.ipk
npx ares-package dist --no-minify -o build
echo "Packaged: $(ls build/*.ipk)"
