#Prerequisites

1. Node installed
2. Install Node supervisor to avoid having to restart Node manually during the dev cycle<br/>
`npm install -g supervisor`

#Starting
1 Clone the git repo<br/>
`~> git clone https://github.com/vadan/007.git`

2 Start the Node server<br/>
`~/007> cd web`
`~/007> node server/start.js`

3 You should see a msg like this<br/>
`restify listening at http://0.0.0.0:8080`

4 Try hitting these URLs

  * [Main view. There should be no errors in the devtools console] (http://localhost:8080/app/app.html)


#Code structure
    
1 **Client** All the files accessible to the client live here. The client is Knockout + jQueryUI

2 **Server** Node backend based on [http://mcavage.me/node-restify/](restify). Mongo is/will be used as the DB

3 **Shared** Common code between client/server, example models

**Running tests**
Mocha is being used as the testing lib. Assertions are from Node standard pkgs.
The easy way to run tests is by using WebStorm. Create a Mocha test runner for the 'tests' dir.
Use the following options for the test runner:

1 *MochaPackage* 007/web/node_modules/mocha

2 *User Interface* BDD

3 *Test dir* 007/web/tests

#Devtools

**MongoDB** <br/>
You will need a local (dev machine) install of Mongo DB. 
Command line for starting MongoDB <br/>
`mongod --port 9090 --dbpath <local dir for storing data>`

NO additional 'schema'setup is required

**Webstorm is pretty good**
You can setup a run config to launch using the Supevisor <br/>
See: http://stackoverflow.com/questions/12170755/webstorm-using-node-supervisor-so-do-not-have-to-restart-after-each-code-chang

