#!/usr/bin/env python3
"""Audit and explicitly plan supported LG webOS cleanup over existing root SSH."""
import argparse
import base64
import json
import os
from pathlib import Path
import shlex
import subprocess
import sys

ROOT = Path(__file__).resolve().parent.parent
PRIVATE = ROOT / '.private'
PROTECTED = {
    'airplay', 'com.webos.app.home', 'com.webos.app.browser',
    'com.webos.app.miracast', 'com.webos.chromecast',
    'org.webosbrew.hbchannel', 'org.webosbrew.inputhook',
    'works.partridge.webos-launcher', 'local.tvrefresh.lghome',
}
AD_KEYS = {
    'general': ['homePromotion', 'screenSaverAd'],
    'other': ['contentRecommendation'],
    'option': ['livePromotion', 'livePlus'],
}

def save(path, data):
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, indent=2) + '\n')
    path.chmod(0o600)

def make_plan(audit, remove=(), disable_ads=False, delete_demos=False):
    installed = {a['id']: a for a in audit['apps']}
    selected = []
    for app_id in dict.fromkeys(remove):
        app = installed.get(app_id)
        if app_id in PROTECTED or not app or app.get('removable') is not True:
            raise ValueError(f'Not an installed, removable, unprotected app: {app_id}')
        selected.append({'id': app_id, 'title': app['title']})
    settings = []
    if disable_ads:
        for category, keys in AD_KEYS.items():
            for key in keys:
                before = audit.get('settings', {}).get(category, {}).get(key)
                if before == 'on':
                    settings.append({'category': category, 'key': key, 'before': before, 'after': 'off'})
    return {
        'schema': 1,
        'system': audit.get('system', {}),
        'removeApps': selected,
        'disableSettings': settings,
        'deleteDemoFiles': audit.get('demoFiles', []) if delete_demos else [],
        'notes': ['App removal can delete app data and sign-ins.',
                  'Demo deletion is permanent unless separately backed up.',
                  'Logical app sizes can include shared/compressed data; compare actual free space afterward.'],
    }

def ssh_options(args):
    if not args.host or args.host == 'YOUR_TV_HOST' or args.host.startswith('-') or any(c.isspace() for c in args.host):
        raise ValueError('Set TV_HOST to your own TV host or use --host.')
    if not args.user or not all(c.isalnum() or c in '_-' for c in args.user):
        raise ValueError('Invalid SSH user.')
    PRIVATE.mkdir(exist_ok=True, mode=0o700)
    cmd = ['ssh', '-o', 'BatchMode=yes', '-o', 'ConnectTimeout=8',
           '-o', f'UserKnownHostsFile={PRIVATE / "known_hosts"}']
    if args.identity:
        cmd += ['-i', str(Path(args.identity).expanduser()), '-o', 'IdentitiesOnly=yes']
    return cmd

def remote(args, action, payload=None):
    cmd = ssh_options(args)
    encoded = base64.b64encode(json.dumps(payload or {}).encode()).decode()
    cmd += [f'{args.user}@{args.host}',
            '/usr/bin/node - ' + shlex.quote(action) + ' ' + shlex.quote(encoded)]
    result = subprocess.run(cmd, input=(ROOT / 'tools/remote.cjs').read_text(),
                            text=True, capture_output=True, timeout=900)
    if result.returncode:
        raise RuntimeError(result.stderr.strip() or result.stdout.strip() or 'SSH operation failed.')
    return json.loads(result.stdout)

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--host', default=os.getenv('TV_HOST'))
    parser.add_argument('--user', default=os.getenv('TV_USER', 'root'))
    parser.add_argument('--identity', default=os.getenv('TV_SSH_KEY'))
    subs = parser.add_subparsers(dest='command', required=True)
    audit_cmd = subs.add_parser('audit', help='Read system version, apps, storage and known ad settings.')
    audit_cmd.add_argument('--out', type=Path, default=PRIVATE / 'audit.json')
    plan_cmd = subs.add_parser('plan', help='Create a local plan; performs no TV writes.')
    plan_cmd.add_argument('--audit', type=Path, default=PRIVATE / 'audit.json')
    plan_cmd.add_argument('--out', type=Path, default=PRIVATE / 'plan.json')
    plan_cmd.add_argument('--remove-app', action='append', default=[])
    plan_cmd.add_argument('--disable-lg-ads', action='store_true')
    plan_cmd.add_argument('--delete-retail-demos', action='store_true', help='Include only audited showroom .lge media; requires separate approval of deletion/backup choice.')
    apply_cmd = subs.add_parser('apply', help='Apply a reviewed cleanup plan over existing root SSH.')
    apply_cmd.add_argument('--plan', type=Path, default=PRIVATE / 'plan.json')
    apply_cmd.add_argument('--confirm', action='store_true', help='Confirm the TV owner approved this exact plan.')
    args = parser.parse_args()
    if args.command == 'audit':
        data = remote(args, 'audit')
        save(args.out, data)
        print('System:', json.dumps(data['system']))
        print(data['storage'].strip())
        print('\nRemovable apps (logical size estimates):')
        for app in data['apps']:
            if app['removable']:
                print(f"  {app['id']} — {app['title']} ({app.get('sizeKiB', 0)} KiB)")
        print(f"\nFactory demo files: {len(data['demoFiles'])}; audit saved privately.")
    elif args.command == 'plan':
        data = make_plan(json.loads(args.audit.read_text()), args.remove_app,
                         args.disable_lg_ads, args.delete_retail_demos)
        save(args.out, data)
        print(json.dumps(data, indent=2))
        print('\nReview this plan with the TV owner before using apply --confirm.')
    else:
        if not args.confirm:
            parser.error('apply requires --confirm after the TV owner approves the exact plan.')
        plan = json.loads(args.plan.read_text())
        save(PRIVATE / 'before-apply.json', remote(args, 'audit'))
        result = remote(args, 'apply', plan)
        save(PRIVATE / 'last-result.json', result)
        save(PRIVATE / 'after-apply.json', remote(args, 'audit'))
        print(json.dumps(result, indent=2))

if __name__ == '__main__':
    try:
        main()
    except (ValueError, RuntimeError, OSError, subprocess.SubprocessError) as exc:
        print(str(exc), file=sys.stderr)
        sys.exit(1)
