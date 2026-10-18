# TV Unlock

A practical toolkit for cleaning up LG webOS TVs and installing a simpler home screen. Designed for a TV owner working with a coding agent.

It includes a minimal launcher, a rooted-TV home router, an LG Home escape shortcut, a read-only audit, and a plan-based cleanup tool. **It does not automatically root a TV.**

## Start here — for agents

**Read [AGENTS.md](AGENTS.md), then [docs/START_HERE.md](docs/START_HERE.md) before connecting to a TV or changing anything.**

An owner can give their agent this prompt:

> Read this repository's README, AGENTS.md, and docs/START_HERE.md. Help me audit and clean up my own LG webOS TV. Discover my exact model and firmware, ask which apps I use, and show me a specific cleanup plan. Keep my network details, credentials, account data, and device identifiers in ignored local state. Start with reversible ad settings. Treat rooting, deletion, and global home-screen changes as separate decisions, and carry out work I've already authorized without repeatedly asking.

Do not copy the reference TV's compatibility assumptions to a different model. Do not treat the optional-app recipe as a deletion list.

## What it can do

- Disable supported LG Home Promotion, Content Recommendation, Live Promotion, Screensaver Promotion, and Live Plus settings.
- List installed apps and remove only apps the owner explicitly selects.
- Identify large retail Store Demo videos and optionally remove the audited files after the owner's backup/deletion decision.
- Build a dark, remote-friendly launcher with configurable app and HDMI rows and proper app logos.
- On a compatible rooted TV, map **Home → Launcher** and **hold 1 → LG Home**.
- Open Launcher after startup, standby wake, and automatic returns to LG Home, including after AirPlay ends. Intentional visits to LG Home remain available.
- Restore the prior Home-key and hold-1 configuration.

The automatic home integration runs on the TV. The computer can be off afterward. LG's native Home may briefly appear before the router opens Launcher. An active casting session is exempt from startup redirection; screen-saver wake does not intentionally interrupt the foreground app.

This disables LG interface promotions. It does **not** remove video ads delivered by YouTube, Hulu, Peacock, or other streaming services. Freeing storage is measurable; a speed improvement is not guaranteed.

## Compatibility

The original integration was tested on **LG OLED65B2AUA**, firmware **33.31.75**, **webOS 25 / SDK 10.3.2**. See the [compatibility report](docs/COMPATIBILITY.md) for the rooting entry point and tested behaviors. Other models and firmware need their own capability checks.

| Access | Available workflow |
| --- | --- |
| Normal TV settings | Disable interface promotions and remove apps through LG's UI |
| LG Developer Mode | Sideload and manually open the launcher; sessions need renewal |
| Existing compatible root + Homebrew Channel | Root SSH audit/cleanup tools, global Home remapping, automatic return/startup routing |

The cleanup tools require Python 3.9+, SSH, and an existing owner-authorized root SSH connection. Home integration additionally needs SCP, compatible LG Input Hook, and the TV's Node runtime. Local launcher builds use Node 22+ and npm.

## Quick start

### 1. Establish your own connection

Read the agent guide first. Set `TV_HOST`, `TV_USER`, and `TV_SSH_KEY` in your shell using your own values; [.env.example](.env.example) documents the names. The tools do not load `.env` automatically or acquire root.

Verify the TV's SSH host fingerprint using your trusted pairing process and use the same private known-hosts file as the tools:

```sh
mkdir -p .private
ssh -i "$TV_SSH_KEY" -o UserKnownHostsFile=.private/known_hosts "$TV_USER@$TV_HOST" id
```

All local audits, plans, credentials, and backups belong in `.private/`, which is ignored. Never publish a real TV inventory or connection transcript.

### 2. Audit and make a cleanup plan

```sh
python3 tools/tv.py audit
python3 tools/tv.py plan --disable-lg-ads
```

Add `--remove-app APP_ID` for each app the owner selects. The audit supplies the IDs. Optional `--delete-retail-demos` includes only the audited `.lge` showroom videos, never Gallery images or arbitrary directories. It creates a deletion plan, not a backup. Decide whether to back those files up privately before applying it.

Review `.private/plan.json` with the owner. Apply only that authorized plan:

```sh
python3 tools/tv.py apply --confirm
```

The tool rechecks the model/firmware, app removability, settings, and demo files before writing. Before/after audits and the result stay in `.private/`. If a step fails, stop and audit again; don't blindly retry a stale plan. Read [the cleanup guide](docs/CLEANUP.md).

### 3. Optional custom home screen

```sh
python3 tools/build.py
```

For Developer Mode, install only the launcher with LG's CLI or webOS Dev Manager; use LG's documented pairing flow. The LG Home tile falls back to the system screen when the root-only helper is absent.

For compatible rooted TVs with Homebrew Channel and LG Input Hook already installed and verified:

```sh
python3 tools/home.py install \
  --launcher-ipk launcher/build/works.partridge.webos-launcher_1.0.2_all.ipk \
  --shortcut-ipk artifacts/local.tvrefresh.lghome_1.0.1_all.ipk \
  --confirm
```

This changes the Home key, hold-1, and startup behavior. It records the prior settings, preserves other key mappings, and doesn't create SSH keys or enable network services. See [home setup and recovery](docs/HOME.md) before using it.

```sh
python3 tools/home.py restore --confirm
```

Restore disables the automatic router and restores the saved Home/hold-1 behavior. It leaves root and installed apps in place.

## Checks and privacy

```sh
npm test
python3 tools/build.py
# After staging only intended source files:
python3 tools/privacy.py
```

The privacy check scans **indexed file contents**, including binary assets, and rejects local state, keys, literal network addresses, MAC addresses, device ESNs, personal home paths, and unapproved email addresses. It is a guardrail, not a guarantee: review the staged diff and commit metadata too. No real TV addresses, keys, account details, serial numbers, inventories, logs, or backups are included in this repository.

## Credits and licenses

- Launcher: [partridgeworks/webos-launcher](https://github.com/partridgeworks/webos-launcher), vendored from commit `1e2c39b9a988ceb1b258e40e3592bda84a2aa076` with local modifications. MIT code; see [launcher/LICENSE](launcher/LICENSE) and [third-party notices](launcher/THIRD_PARTY_NOTICES.md).
- Fonts and app/input icons keep their separate notices. Logos are trademarks of their owners, including the SVG assets from [selfh.st/icons](https://github.com/selfhst/icons).
- Root support depends on upstream [webOS Homebrew Channel](https://github.com/webosbrew/webos-homebrew-channel) and [LG Input Hook](https://github.com/Simon34545/lginputhook). Their source and binaries are not bundled.
- Rooting research is linked in the compatibility report. Exploit source, payloads, and device-specific pairing material are not bundled.

The toolkit's original code is MIT licensed. This is an independent project, not affiliated with LG or the streaming providers.

The inherited local build toolchain currently reports npm audit advisories, including a critical transitive dependency advisory. These require upstream dependency review; the toolkit does not claim a clean dependency audit. Build only trusted source and packages. The TV receives static launcher assets, not the npm tooling or development server.
