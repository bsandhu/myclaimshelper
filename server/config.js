var config = {};

config.LOCAL = {};
config.TEST = {};
config.PROD = {};

config.ENV_LOCAL = 'LOCAL';
config.ENV_TEST = 'TEST';
config.ENV_PROD = 'PROD';


// **** Heroku Config vars ****
config.port = process.env.PORT || 8080;
config.env = process.env.ENV || 'LOCAL';
config.disable_auth = process.env.DISABLE_AUTH || false;


// **** Heroku ****
config.heroku = {};


// **** Modulous ****
config.LOCAL.db = 'mongodb://localhost:9090/AgentDb';
config.TEST.db = 'mongodb://test:notforproduction@proximus.modulusmongo.net:27017/tuM8inys';
config.PROD.db = 'mongodb://test:notforproduction@novus.modulusmongo.net:27017/yXa6vihy'
config.db = config[config.env]['db'];


// **** Mailgun ****
// Mailgun account is shared - Test users are routed to TEST env
config.mailgun = {};
config.mailgun.user = 'baljeet.mail@gmail.com';
config.mailgun.password = 'the1the1';
config.mailgun.api_key = 'key-601635737253d47869c96827dc8a61b8';
config.mailgun.domain = 'myclaimshelper.com';


// **** Ultrahook ****
// Running locally
// 1. Install key
//    echo "api_key: KdsTRI5osKD2oVCZHaPOMP5KeJCDMaGG" > ~/.ultrahook
// 2. Install Ruby gem
//    sudo gem install ultrahook
// 3. Start
//    ultrahook mail 8080
config.ultrahook = {};
config.ultrahook.api_key = 'KdsTRI5osKD2oVCZHaPOMP5KeJCDMaGG';


// **** Auth0 ****
config.auth0 = {};
config.auth0.user = 'baljeet.mail@gmail.com';
config.auth0.password = 'The1The1';

config.LOCAL.auth0_client_id = 'WSXUrecPr1qDbTljEEeb1Di7xW1GSwqw';
config.TEST.auth0_client_id = 'WSXUrecPr1qDbTljEEeb1Di7xW1GSwqw';
config.PROD.auth0_client_id = 'KD77kbmhe7n3rtQq0ZYHTlkH2ooBu2Rq';
config.auth0_client_id = config[config.env]['auth0_client_id'];

config.auth0_hostname = 'myclaimshelper.auth0.com';

config.LOCAL.auth0_client_secret = '1mT9Bg5NhL8eqj9hUZSX0DSkgktdJYuwYujY-JoMr0IH4vwR1J4SWEBZZnmAjBrn';
config.TEST.auth0_client_secret = '1mT9Bg5NhL8eqj9hUZSX0DSkgktdJYuwYujY-JoMr0IH4vwR1J4SWEBZZnmAjBrn';
config.PROD.auth0_client_secret = 'L3_qew5xG1FsXL6PVGpwP-YLnb1ev9I8ZmRe6BmP_hSwEVwzJsG93E9LizLP7E1j';
config.auth0_client_secret = config[config.env]['auth0_client_secret'];


// **** DNSSimple ****
config.dnssimple = {};


module.exports = config;
