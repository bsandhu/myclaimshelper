# Local
# mongoimport --host localhost --port 9090 --collection ZipCodes --db AgentDb --file zipcode.json --jsonArray --upsert

# Test
mongoimport --host jello.modulusmongo.net --port 27017 --username TEST --password  PASSWORD --collection ZipCodes --db esuDub7a --file zipcode.json --jsonArray --upsert --numInsertionWorkers 2