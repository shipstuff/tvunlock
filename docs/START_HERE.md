# Start here: an agent-assisted TV session

## 1. Understand the request

Ask what the owner wants: fewer LG ads, fewer apps, more free space, a custom home screen, or global remote/startup behavior. Ask which apps, inputs, and casting features they need. You do not need a serial number, MAC address, ESN, or an LG password.

Get the model and the **Software Version**, not just the marketed webOS year. If connecting, keep the owner-supplied host address and keys in environment variables/private state. Verify local-network permission and SSH host identity. A sandbox denial, an operating-system local-network denial, and a TV-side permissions error are different problems; diagnose the actual layer.

## 2. Choose the available access level

**Stock settings:** start with LG's visible ad toggles and app deletion UI. Current primary references: [LG app management](https://www.lg.com/us/support/help-library/how-to-install-delete-apps-on-your-lg-tv--20155331395481) and [home-screen recommendations](https://www.lg.com/np/support/product-help/CT40009243-20153529296849OLT/).

**Developer Mode:** the launcher can be sideloaded without root. Follow [LG's Developer Mode guide](https://webostv.developer.lge.com/develop/getting-started/developer-mode-app), including session renewal. Keep passphrases and SSH keys private. This does not grant global Home-button control or root cleanup access.

**Existing root:** verify `id`, Homebrew Channel root status, and the supported API responses. The cleanup tool requires the TV's Node runtime and root SSH. Global Home integration also requires a compatible, elevated LG Input Hook. Read [compatibility](COMPATIBILITY.md) and [home setup](HOME.md).

**Root requested but unavailable:** research the current upstream methods for that exact firmware. Explain persistent changes and recovery before attempting them. The compatibility report records one successful host-app path, not a promise for every TV. Do not silently install an exploit or enable a root network service.

## 3. Audit without changing the TV

Run `python3 tools/tv.py audit` only over an existing authorized root connection. Store results in `.private/`. It collects selected model/version fields, sanitized app metadata, storage totals, known ad settings, and candidate retail video files. It does not read cookies, credentials, personal media, or streaming-account contents.

Compare storage usage to app-file estimates. An app's logical folder size can include compressed or shared data. Large factory videos can matter more than dozens of tiny promotional shortcuts. Don't infer a CPU benefit merely from deleting storage files.

## 4. Review a concrete cleanup plan

Use the [cleanup guide](CLEANUP.md). Give the owner an understandable list of app titles with exact IDs behind it. Preserve their streaming services and casting. Explain that LG ads and streaming-service video ads are different.

For retail video deletion, identify the actual candidate files and ask whether they want a private backup. Don't upload media to Git. Skip unsupported settings; don't guess keys or disable OLED protections to remove screensaver ads.

Use `plan` to produce `.private/plan.json`, then `apply --confirm` after the requested actions are authorized. If the owner already approved those exact actions, continue without another confirmation loop.

## 5. Optional home screen

Build the source packages locally. For Developer Mode, install the launcher alone. For compatible root, use `tools/home.py install` after the owner chooses the global behavior:

- Home opens Launcher.
- Hold-1 and the LG Home tile open the original home screen intentionally.
- Startup/wake open Launcher, including when the TV restores an input.
- Automatic LG Home returns redirect to Launcher.
- Active casting stays active; ending a cast can return through LG Home and then to Launcher.
- Screensaver wake does not itself count as a full power-on.

The native screen can flash during a transition. The computer is not needed once the TV-local router is installed. The router's log is temporary TV-local state; keep any downloaded copy private.

## 6. Verify and hand over

Inspect a fresh app inventory and storage measurement. Confirm ad-toggle values. Have the owner test the real remote, AirPlay start/stop, standby cycle, and screensaver. A full reboot is needed to test boot hooks; a standby cycle alone isn't proof. Keep the rollback procedure available in `.private/` notes and explain that software updates can change root compatibility.

Report what was changed, what was actually tested, and any remaining uncertainty. Publish only generalized source and model-level findings after a staged privacy scan.
