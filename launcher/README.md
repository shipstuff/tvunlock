# Launcher source

Vendored from [partridgeworks/webos-launcher](https://github.com/partridgeworks/webos-launcher), commit `1e2c39b9a988ceb1b258e40e3592bda84a2aa076`.

TV Unlock changes add Hulu/Peacock defaults, missing streaming-service logos, and an LG Home tile that uses the root integration's intentional-home helper when installed. Without that helper, the tile opens LG Home directly.

See the repository [README](../README.md), [home integration guide](../docs/HOME.md), [LICENSE](LICENSE), and [third-party notices](THIRD_PARTY_NOTICES.md).

```sh
npm ci --ignore-scripts
npm run build
npm run package
```

For a coordinated build of both apps, run `python3 tools/build.py` from the repository root. Keep local CLI config and per-TV catalogs in ignored storage. Never add a real host address or key to source.
