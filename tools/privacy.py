#!/usr/bin/env python3
"""Scan the Git index for private device data and accidentally staged local state."""
import argparse
import ipaddress
from pathlib import Path
import re
import subprocess
import sys

PATTERNS = {
    'MAC address': re.compile(rb'(?i)(?<![0-9a-f])(?:[0-9a-f]{2}:){5}[0-9a-f]{2}(?![0-9a-f])'),
    'private SSH key': re.compile(rb'-----BEGIN (?:OPENSSH|RSA|EC|DSA|ENCRYPTED) PRIVATE KEY-----'),
    'SSH public key': re.compile(rb'ssh-(?:rsa|ed25519) [A-Za-z0-9+/]{24,}'),
    'personal home directory': re.compile(rb'/(?:Users/[A-Za-z][A-Za-z0-9._-]+/|home/(?!root/)[A-Za-z][A-Za-z0-9._-]+/)'),
    'device ESN': re.compile(rb'LGTV[0-9]{4,}[-=][0-9]{5,}'),
}
IPV4 = re.compile(rb'(?<![0-9.])(?:[0-9]{1,3}\.){3}[0-9]{1,3}(?![0-9.])')
EMAIL = re.compile(rb'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b')
PRIVATE_PARTS = {'.private','.tv-config','.tools','.ssh','backups','node_modules','dist','build','artifacts','__pycache__'}
PRIVATE_NAMES = re.compile(r'(?i)(?:known_hosts|\.key$|\.pem$|^audit.*\.json$|^apps-.*\.json$|^plan\.json$|^OPERATIONS\.txt$|^\.env$)')

def scan_blob(name, data):
    findings=[]
    path=Path(name)
    if any(part in PRIVATE_PARTS for part in path.parts) or PRIVATE_NAMES.search(path.name):
        findings.append('private/generated file')
    if path.name.startswith('.env.') and path.name!='.env.example': findings.append('environment file')
    for label,pattern in PATTERNS.items():
        if pattern.search(data): findings.append(label)
    for match in IPV4.finditer(data):
        try: ipaddress.IPv4Address(match.group().decode())
        except ipaddress.AddressValueError: continue
        findings.append('literal network address');break
    # Preserve legally required upstream font/library attributions, not personal contacts.
    legal = path.name in {'LICENSE','LICENSE.txt'} or 'licenses' in path.parts
    if not legal and EMAIL.search(data): findings.append('email address')
    return findings

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.parse_args()
    root=Path(__file__).resolve().parent.parent
    files=subprocess.check_output(['git','ls-files','-z'],cwd=root).decode().split('\0')
    files=[file for file in files if file]
    if not files:
        print('No indexed files. Stage the explicit public file list first.',file=sys.stderr);return 1
    found=[]
    for file in files:
        entry=subprocess.check_output(['git','ls-files','-s','--',file],cwd=root).decode()
        if entry.startswith(('120000','160000')):
            found.append((file,['symlink or nested Git repository']));continue
        data=subprocess.check_output(['git','show',':'+file],cwd=root)
        issues=scan_blob(file,data)
        if issues: found.append((file,issues))
    for name,issues in found: print(name+': '+', '.join(issues),file=sys.stderr)
    print(f'Scanned {len(files)} indexed files; {len(found)} files flagged. Values are never printed.')
    return 1 if found else 0

if __name__=='__main__':sys.exit(main())
