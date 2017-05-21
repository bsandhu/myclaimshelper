echo 'Dumping PROD DB from DigitalOcean'

mongodump \
-h 104.131.103.65:9090 \
-u agent \
-p starWARS1 \
--db myclaimshelper \
--out dump \
--gzip
echo 'Emailing confirm'

if [ $? -eq 0 ]
then
        curl \
        --data "from=digitalocean@myclaimshelper.com&to=baljeet.mail@gmail.com&subject=RestoreDone&text=success" \
        https://api.mailgun.net/v3/myclaimshelper.com/messages \
        --user 'api:key-601635737253d47869c96827dc8a61b8'
else
        curl \
        --data "from=digitalocean@myclaimshelper.com&to=baljeet.mail@gmail.com&subject=RestoreFAILED&text=Failure" \
        https://api.mailgun.net/v3/myclaimshelper.com/messages \
        --user 'api:key-601635737253d47869c96827dc8a61b8'
fi