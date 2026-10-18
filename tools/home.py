#!/usr/bin/env python3
"""Install or restore the optional rooted-TV home integration after owner approval."""
import argparse
import json
import os
from pathlib import Path
import subprocess
import sys
from tv import ROOT, PRIVATE, remote, save, ssh_options

def copy(args, source, destination):
    options = ssh_options(args)[1:]
    # webOS Dropbear commonly has legacy SCP but no SFTP subsystem.
    subprocess.run(['scp', '-O', *options, str(source), f'{args.user}@{args.host}:{destination}'],check=True)

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--host',default=os.getenv('TV_HOST'))
    parser.add_argument('--user',default=os.getenv('TV_USER','root'))
    parser.add_argument('--identity',default=os.getenv('TV_SSH_KEY'))
    sub=parser.add_subparsers(dest='command',required=True)
    install=sub.add_parser('install')
    install.add_argument('--launcher-ipk',type=Path,required=True)
    install.add_argument('--shortcut-ipk',type=Path,required=True)
    install.add_argument('--confirm',action='store_true')
    restore=sub.add_parser('restore')
    restore.add_argument('--confirm',action='store_true')
    args=parser.parse_args()
    if not args.confirm: parser.error('Review the home behavior with the TV owner, then supply --confirm.')
    if args.command=='restore':
        print(json.dumps(remote(args,'restoreHome'),indent=2));return
    for artifact in [args.launcher_ipk,args.shortcut_ipk]:
        if not artifact.is_file() or artifact.suffix!='.ipk': raise ValueError('Build and provide both .ipk files first.')
    before=remote(args,'homeState')
    save(PRIVATE/'home-before.json',before)
    copy(args,args.launcher_ipk,'/tmp/tvunlock-launcher.ipk')
    copy(args,args.shortcut_ipk,'/tmp/tvunlock-lg-home.ipk')
    for kind in ['launcher','shortcut']:
        print(json.dumps(remote(args,'installHomePackage',{'kind':kind})))
    remote(args,'prepareHomeDirectory')
    for name in ['core.cjs','router.cjs','start.sh']:
        copy(args,ROOT/'home-router'/name,'/var/lib/webosbrew/tvrefresh-home/'+name)
    print(json.dumps(remote(args,'configureHome'),indent=2))

if __name__=='__main__':
    try:main()
    except (ValueError,RuntimeError,OSError,subprocess.SubprocessError) as exc:
        print(str(exc),file=sys.stderr);sys.exit(1)
