#!/bin/sh
# Started in the background so TV boot can finish independently.
if [ -f /tmp/tvrefresh-home-router.pid ]; then
  router_pid=$(cat /tmp/tvrefresh-home-router.pid)
  if kill -0 "$router_pid" 2>/dev/null && grep -q 'tvrefresh-home/router.cjs' /proc/"$router_pid"/cmdline 2>/dev/null; then exit 0; fi
fi
nohup /usr/bin/node /var/lib/webosbrew/tvrefresh-home/router.cjs </dev/null >/tmp/tvrefresh-home-router.log 2>&1 &
