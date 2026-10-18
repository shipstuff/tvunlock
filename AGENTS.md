# Instructions for agents using TV Unlock

Read `docs/START_HERE.md` before doing TV work. The owner is authorizing work on their own television; determine their intended scope and honor authorization already given.

## Privacy is part of the task

- Put per-TV state only in `.private/` or another explicitly ignored location. Network addresses, serial numbers, MAC addresses, ESNs, account information, SSH keys, pairing passphrases, inventories, logs, and backups never belong in a commit, PR, issue, or public example.
- Use environment variables for connections. Don't put real addresses into source, examples, recipes, test fixtures, or commit messages.
- Read only the identifiers needed for the task. Model, firmware, SDK version, app IDs, free-space measurements, and capability outcomes generally suffice. Avoid collecting serial numbers and account identifiers at all.
- Preserve upstream licensing. Do not copy a private work directory, history, or a downloaded exploit repository into this tree.
- Before publication, stage an explicit file list, run `python3 tools/privacy.py`, inspect the staged diff, and review commit author/email metadata. The scanner checks the Git index, not unrelated untracked files.

## Workflow

1. Audit first. Establish exact model and firmware and whether access is stock settings, Developer Mode, or existing root.
2. Ask which apps the owner actually uses; installed does not mean unused. Propose concrete app IDs, settings, and media files before deleting anything. Existing explicit approval covers the matching plan; don't ask repeatedly.
3. For rooting or a new persistent network service, explain the concrete change and obtain appropriate authorization. This toolkit neither roots a TV nor opens SSH/telnet ports.
4. Never force a firmware/model assumption or replay an exploit solely because another TV worked. A denied method is evidence about that app context, not proof that every root path is patched. Use a harmless capability check and current primary-source documentation.
5. Use supported settings and app-installer APIs. Protect the launcher/router, LG Home, AirPlay/casting, Homebrew/root access, HDMI behavior, and OLED protection. Do not edit or flash system partitions, delete system app directories, or clear streaming app/account data as generic debloating.
6. Ask the owner's preference before backing up large retail media; honor a decision to remove it without a backup. Don't mistake retail videos for Gallery art or screensaver assets.
7. Validate each change with fresh state. Report actual free space separately from speculative speed benefits.
8. For home integration, test Home, hold-1, the LG Home tile, real AirPlay start/stop, standby off/on, a full reboot, app/HDMI launches, and the idle screensaver. Distinguish a tested simulation from the real user flow.
9. Explain the brief stock-Home flash honestly. Our router reacts to webOS transitions; it does not replace the firmware's native Home implementation.
10. Keep a working recovery path and never claim an untested firmware or model is supported.

## Working on the repo

- `tools/tv.py` plans locally and only mutates a TV through `apply --confirm`.
- `tools/home.py` makes global remote/startup changes only with `--confirm`.
- Neither flag substitutes for owner authorization; it records that you already have it.
- Run `npm test` for changes to the plans, privacy guards, or router state machine. Run `python3 tools/build.py` for launcher/helper changes.
- Don't contact or alter a real TV as part of CI or routine source tests. Use explicit owner authorization for integration checks.
- Build artifacts, tool dependencies, and all `.private/` data stay out of Git.
