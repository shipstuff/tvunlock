# Compatibility report

## Reference platform

- Model: **LG OLED65B2AUA**, US B2 OLED.
- Software Version: **33.31.75**.
- webOS: **25**, SDK **10.3.2**.

Only model-level information is recorded. There are no device addresses, serial numbers, MAC addresses, ESNs, account details, or raw device logs in this report.

## Verified integration behavior

The original setup verified sideloading the custom launcher, native app/HDMI launches, Home remapping, hold-1 returning to LG Home, root/remapper persistence, full-boot launcher selection, standby wake, AirPlay playback and return, and screensaver operation. LG promotional settings and owner-selected app/media cleanup were also verified with fresh inventories and actual free-space checks.

The generalized packaging and installation tools were added afterward and have local tests/build checks. They are not a certification of unattended installation on every model. Other models/firmwares remain unverified.

## Rooting entry-point finding

Upstream [SlopBro](https://github.com/throwaway96/slopbro), reviewed at commit `21023d56ca424607bb03d2939609cc658c655fc7`, initially selected ad overlay apps that did not load its page on the reference TV. `tinybrowser` loaded the page but denied its download call because that app context lacked the required permission.

A harmless diagnostic page loaded successfully in `com.webos.app.voiceweb` on the actual SDK 10.3.2 firmware and could make privileged metadata queries. The same reviewed root payload subsequently ran through that context; root identity and installer logs confirmed success.

At that upstream revision, `--webos-version` selected candidate host apps; it did not install firmware or change the payload. The table placed `voiceweb` under major version 11, although it existed and worked on this reference SDK 10 TV. This is an app-selection observation, **not a recommendation to misidentify another TV or force a version flag**.

Agents should inspect the current upstream source, verify the host app and permissions without system writes, and obtain informed authorization before any root attempt. Root installation changes persistence/security behavior, and enabling SSH is a separate network-access decision. Never bypass a rejected approval by hiding the same action in another command.

Exploit code and payloads are intentionally not bundled. See [webOS Homebrew's rooting guide](https://www.webosbrew.org/rooting/) and the original projects for current compatibility and requirements. Firmware updates can change or remove root support.
