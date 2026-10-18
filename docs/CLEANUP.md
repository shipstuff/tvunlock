# Cleanup without guessing

## LG promotions

These settings were verified on the reference webOS 25 firmware:

| Category | Key | Purpose |
| --- | --- | --- |
| `general` | `homePromotion` | Sponsored Home content |
| `other` | `contentRecommendation` | Home recommendation rows |
| `general` | `screenSaverAd` | Screensaver advertising, separate from screensaver protection |
| `option` | `livePromotion` | Live promotional content |
| `option` | `livePlus` | Viewing analysis/recommendation feature |

The toolkit reads before writing and only plans supported values currently set to `on`. It sets them to `off`. Unsupported or missing keys are skipped. It does not revoke unrelated user agreements, change the service country, block streaming/CDN domains, disable the screensaver, or remove AirPlay services.

These settings do not filter ads within streaming providers' videos. Some LG promotional components can remain installed even when their settings are disabled.

## Apps

Use LG's app-removal API for approved removable apps. The toolkit protects casting, native Home, the launcher/helper, Homebrew Channel, and LG Input Hook. It refuses absent and non-removable app IDs. Essential system apps must not be deleted by removing directories.

`recipes/lg-webos25.json` is a list of **discussion candidates**, not a universal bloat list. YouTube TV, Twitch, Pluto TV, Fubo, and games are useful to some owners. Confirm preferences before including their IDs in a plan. Removal can discard that app's sign-in and data; reinstalling from the store may be necessary to recover its use.

Example using a placeholder app ID from your own audit:

```sh
python3 tools/tv.py plan --remove-app APP_ID_FROM_YOUR_AUDIT --disable-lg-ads
```

Review the plan, then apply only the owner's authorized selection. If execution stops midway, inspect `.private/before-apply.json`, take a new audit, and make a new plan for remaining changes. Don't assume a failed batch made no changes.

## Retail demo videos

On the reference B2, `.lge` files in `/mnt/lg/appstore/preload/storedemo` were factory retail display loops. They occupied roughly a gigabyte and could be removed to free app storage. Other models may ship different assets or use them differently.

Before deletion:

1. Confirm the TV is used in Home mode and identify the files as showroom videos.
2. Get the owner's deletion and backup preference. A backup is optional; never continue copying media after the owner declines it.
3. If a backup is wanted, copy only the selected files into ignored `.private/` storage and verify the copy before deletion. Never commit the media.
4. Include `--delete-retail-demos` only after that decision.

The tool limits candidates to regular `.lge` files directly inside the known demo directory. It rejects changed sizes and unexpected/symlinked paths before applying the plan. It keeps the directory/version marker and does not touch Gallery squashfs images, personal media, system partitions, or arbitrary preload directories.

## Caches and speed

The default cleanup does not clear streaming-app cookies, local storage, IndexedDB, session storage, or shared browser profiles. Those can contain sign-ins and settings. Compiled-code caches can improve startup performance; deleting them indiscriminately may make the next launch slower.

Compare actual free storage before and after. Removing unused apps and factory media reduces storage pressure, but speed depends on running services, app behavior, memory, and hardware. Report speed measurements only if you actually measured them.
