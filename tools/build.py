#!/usr/bin/env python3
"""Build source packages locally; does not connect to a TV."""
import os
from pathlib import Path
import subprocess
ROOT=Path(__file__).resolve().parent.parent
env=os.environ.copy()
env['APPDATA']=str(ROOT/'.private'/'lg-cli')
(ROOT/'artifacts').mkdir(exist_ok=True)
subprocess.run(['npm','ci','--ignore-scripts'],cwd=ROOT/'launcher',check=True,env=env)
subprocess.run(['npm','run','build'],cwd=ROOT/'launcher',check=True,env=env)
subprocess.run(['npm','run','package'],cwd=ROOT/'launcher',check=True,env=env)
subprocess.run([str(ROOT/'launcher/node_modules/.bin/ares-package'),
                str(ROOT/'old-home-shortcut'),'--no-minify','-o',str(ROOT/'artifacts')],check=True,env=env)
print('Launcher: launcher/build/works.partridge.webos-launcher_1.0.2_all.ipk')
print('LG Home shortcut: artifacts/local.tvrefresh.lghome_1.0.1_all.ipk')
