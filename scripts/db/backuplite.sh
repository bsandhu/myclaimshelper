echo 'Dumping PROD DB from DigitalOcean'
echo 'Skipping Mongo FS collections'

mongodump \
-h 104.131.103.65:9090 \
-u agent \
-p starWARS1 \
--verbose \
--db myclaimshelper \
--excludeCollection fs.chunks \
--excludeCollection fs.files \
--out dump/lite/ \
--gzip

echo 'Done'