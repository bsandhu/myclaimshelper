echo 'Dumping PROD DB from Modulous'

mongodump \
-h jello.modulusmongo.net:27017 \
-u PROD \
-p starWARS1 \
--db u5jesaxU \
--authenticationDatabase u5jesaxU \
--out dump/`date "+%Y-%m-%d"`

echo 'Emailing confirm'

curl \
--data "from=digitalocean@myclaimshelper.com&to=baljeet.mail@gmail.com&subject=RestoreDone&text=success" \
https://api.mailgun.net/v3/myclaimshelper.com/messages \
--user 'api:key-601635737253d47869c96827dc8a61b8'