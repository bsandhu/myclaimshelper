echo 'Dumping TEST DB from Modulous'

mongodump \
-h jello.modulusmongo.net:27017 \
-u TEST \
-p PASSWORD \
--db esuDub7a \
--authenticationDatabase esuDub7a \
--out dump/`date "+%Y-%m-%d"`

