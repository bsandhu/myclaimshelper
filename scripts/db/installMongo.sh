sudo apt-get install -y mongodb


#######################################
# Use moongo shell to run this        #
# launch shell with mongo --port 9090 #
#######################################

use myclaimshelper
db.createUser(
  {
    user: "agent",
    pwd: "lightSA8ER",
    roles: [
       "dbAdmin",
       { role: "readWrite", db: "myclaimshelper" }
    ]
  }
)
