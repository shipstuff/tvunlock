# Custom Home, startup, and recovery

## Prerequisites

For a manually opened launcher, use [LG Developer Mode](https://webostv.developer.lge.com/develop/getting-started/developer-mode-app). Build with `python3 tools/build.py` and install the launcher package with LG's CLI or [webOS Dev Manager](https://github.com/webosbrew/dev-manager-desktop). Developer Mode expiry can remove sideloaded apps. Global remapping requires root.

For full integration, first verify owner-authorized root SSH, an elevated [Homebrew Channel](https://github.com/webosbrew/webos-homebrew-channel), and compatible [LG Input Hook](https://github.com/Simon34545/lginputhook). Use upstream release/source information to verify any package before installation; binaries aren't bundled here. The reference integration used Homebrew Channel 0.7.3 and LG Input Hook 1.5.1 on a B2. Don't assume those binaries fit a different CPU/firmware.

The home installer does not root a TV, enable SSH, change authorized keys, or remove LG Developer Mode. If a separate root method requires removing Developer Mode before reboot, follow its reviewed instructions and verify root persistence first.

## Install

Read the exact behavior in the README with the owner. Build the packages locally and run `tools/home.py install` with both artifact paths and `--confirm`.

The installer:

1. Checks Homebrew root and Input Hook availability and records private prior settings.
2. Installs Launcher and the small LG Home helper.
3. Elevates/starts the existing Input Hook service and merges a Home-key mapping into its JSON, preserving other key mappings.
4. Assigns LG's native `magicNum1` setting to the helper.
5. Installs the router and its Homebrew startup hook.

The reference remote uses Linux key code `773` for Home. Check Input Hook logs on the actual remote; if it differs, adapt the source before installation. Don't claim the physical button works based solely on a JSON setting.

## Why there is an LG Home helper

Directly assigning LG's hidden `com.webos.app.home` to Quick Access was unreliable on the reference firmware. The helper is a normal launchable app that first records an intentional-home marker through Homebrew Channel, then opens LG Home. Both hold-1 and Launcher's LG Home tile use it.

The router consumes the short-lived marker and allows LG Home until another app opens. Startup/wake clears that exception. Foreground and power-state subscriptions avoid continuous polling. No computer-side daemon or new listening server is needed.

## Files on the TV

| Path | Purpose |
| --- | --- |
| `/var/lib/webosbrew/tvrefresh-home/` | Router source, start script, private original-home baseline |
| `/var/lib/webosbrew/init.d/tvrefresh-home` | Router startup hook |
| `/home/root/.config/lginputhook/keybinds.json` | Physical Home mapping |
| `/tmp/tvrefresh-home-router.log` | Temporary transition log |
| `/tmp/tvrefresh-allow-lg-home` | Short-lived intentional-home marker |

`tvrefresh` is a generic internal path retained for compatibility with the original implementation, not a per-device identifier.

## Verify

Test ordinary app and HDMI launches, Home, hold-1, the LG Home tile, a real AirPlay session ending, standby off/on, a full reboot, and idle screensaver activation. Use the log to confirm transitions without collecting casting contents or account details. Keep any copied log private.

The router starts when Homebrew's boot hooks run. A cold boot can briefly display LG Home or a restored input first. This approach doesn't replace webOS's native Home implementation. An active AirPlay, Miracast, or Chromecast app is exempt from the startup redirect.

## Restore

```sh
python3 tools/home.py restore --confirm
```

This stops the router, disables its boot hook, restores the prior Home binding and hold-1 assignment, and removes Input Hook's boot hook only if it was absent before installation. It leaves unrelated key bindings, installed packages, and root intact. This is a home-behavior rollback, not an unroot procedure.

If the installer failed before completing, inspect the TV-local `original-home-state.json` and ignored `.private/home-before.json`. If the TV is reachable only over SSH, the router can be stopped by its recorded PID after confirming the process command line, and the startup hook can be removed. Restore the saved Home-key entry; don't delete the entire config if other remappings exist.

Never delete Homebrew's root startup script, flash firmware partitions, or factory-reset as a routine response to a UI routing issue.
