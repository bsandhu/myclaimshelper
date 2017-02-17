#!/usr/bin/env bash

echo "*** Deploying to DigitalOcean - assuming that SSH keys for dest are added to host ***"
echo""

rsync -rvzhe ssh --exclude '*node_modules' --exclude '.git*' --delete .  root@45.55.192.142:/root/myclaimshelper

ssh root@45.55.192.142 chmod 777 /root/myclaimshelper/*.sh

echo""
echo "*** Done ***"
echo""
echo "*** Killing Node ***"
ssh root@45.55.192.142 kill $(ps -ef | grep '[s]erver/start.js' | awk '{print $2}')
echo""
echo "*** Starting Node ***"
ssh root@45.55.192.142 'cd ~/myclaimshelper;sudo npm update;./startTest.sh'

exit