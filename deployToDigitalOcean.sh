#!/usr/bin/env bash

echo "*** Deploying to DigitalOcean - assuming that SSH keys for dest are added to host ***"
echo""

rsync -rvzhe ssh --exclude '*node_modules' --exclude '.git*' --delete .  root@45.55.192.142:/root/myclaimshelper

ssh root@45.55.192.142 chmod 777 /root/myclaimshelper/*.sh

echo""
echo "*** Finished rsync ***"
echo""
echo "*** Killing any rouge Electron ***"
ssh root@45.55.192.142 'pkill -ef --signal 9 "electron"'
echo""

echo "*** Killing Node ***"
ssh root@45.55.192.142 'pkill -ef --signal 9 "node ./server/start.js"'
echo""

echo "*** Starting Node ***"
ssh root@45.55.192.142 'cd ~/myclaimshelper;sudo npm update;./startTest.sh'

exit