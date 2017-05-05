# Local
# mongoimport --host localhost --port 9090 --collection ZipCodes --db AgentDb --file zipcode.json --jsonArray --upsert

# Test
# mongoimport --host jello.modulusmongo.net --port 27017 --username TEST --password  PASSWORD --collection ZipCodes --db esuDub7a --file zipcode.json --jsonArray --upsert --numInsertionWorkers 2# Test

# PROD
# mongoimport --host jello.modulusmongo.net --port 27017 --username PROD --password  starWARS1 --collection ZipCodes --db u5jesaxU --file zipcode.json --jsonArray --upsert --numInsertionWorkers 2