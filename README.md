# Prerequisites

## NodeJS installed

- Check that you can run the following on the command line: `node --version`
     
-- Install Node supervisor to avoid having to restart Node manually during the dev cycle<br/>
   `sudo npm install -g supervisor`
   
-- Install Webpack, needed for building the UI
   `sudo npm install webpack@4.44.2 webpack-cli --global`

## MongoDB
You will need a local (dev machine) install of Mongo DB. 

- Download community version of MongoDB from: https://www.mongodb.com/try/download/community

- Unzip the mongo DB pkg and go to the `bin` dir: 

- Command line for starting MongoDB <br/>
  `mongod --port 9090 --dbpath <local dir for storing data>`
  
- Download GUI client for mongoDB: https://robomongo.org/

- Using the Robo mongo UI client - connect to the local DB running on port 9090. No credentials are needed since the DB is empty
  - Once cnnected, right click on the "New connection" on the right side and create `myclaimshelper` DB
  - The DB should show up on the right side menu. Right click on the DB and click "open shell"
  - In the shell type this command to create a user: `db.createUser({"user": "agent", "pwd": "lightSA8ER", "roles": ["dbAdmin"]})` 
  - Now you are ready to use the local DB

NO additional 'schema'setup is required

## IDE 
Webstorm is pretty good but not necessary. You may use a tool of your choice
You can setup a run config to launch using the Supevisor <br/>
See: http://stackoverflow.com/questions/12170755/webstorm-using-node-supervisor-so-do-not-have-to-restart-after-each-code-change

# Starting
1 Clone the git repo<br/>
`~> git clone https://github.com/vadan/007.git`

# Code structure
    
## Building the Client
- All the files accessible to the client live here. The client is Knockout + jQueryUI. Webpack is used for packaging
- Go to client dir: `cd client`
- Install webpack: `npm install webpack webpack-cli --global`
- Install node dependencies: `npm install`
- Run webpack `webpack`
- You shoudl see something like this
```
Child html-webpack-plugin for "index.html":
         Asset     Size  Chunks  Chunk Names
    index.html  565 KiB       0
    Entrypoint undefined = index.html
    [0] ./node_modules/html-webpack-plugin/lib/loader.js!./app/components/index.ejs 10.5 KiB {0} [built]
    [1] ./node_modules/lodash/lodash.js 531 KiB {0} [built]
    [2] (webpack)/buildin/global.js 472 bytes {0} [built]
    [3] (webpack)/buildin/module.js 497 bytes {0} [built]
```

## Building the Server
- Node backend based on [http://mcavage.me/node-restify/](restify). Mongo is/will be used as the DB
- Go to server dir: `cd server`
- Run `npm install`
- Start server: `node server/start.js` 
- You should see a msg like this `restify listening at http://127.0.0.1:8080`

## Shared 
Common code between client/server, example models

## Try hitting these URLs
  - [Main view. There should be no errors in the devtools console] 
  - http://localhost:8080/

## Running tests
Mocha is being used as the testing lib. Assertions are from Node standard pkgs.
The easy way to run tests is by using WebStorm. Create a Mocha test runner for the 'tests' dir.
Use the following options for the test runner:

1 *MochaPackage* 007/node_modules/mocha
2 *User Interface* BDD
3 *Test dir* 007/tests


