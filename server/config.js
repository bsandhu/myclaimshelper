var config = {};

config.LOCAL = {};
config.TEST = {};
config.PROD = {};

config.ENV_LOCAL = 'LOCAL';
config.ENV_TEST = 'TEST';
config.ENV_PROD = 'PROD';


// **** Env Config vars ****
config.port = process.env.PORT || 8080;
config.https_port = process.env.HTTPS_PORT || 8443;
config.env = process.env.ENV || 'LOCAL';
config.disable_auth = process.env.DISABLE_AUTH || false;
config.test_user = process.env.TEST_USER || 'testuser1';
config.send_success_email_reply = process.env.SEND_SUCCESS_EMAIL_REPLY || false;
config.send_failure_email_reply = (process.env.SEND_FAILURE_EMAIL_REPLY || true) && true;

config.LOCAL.use_ssl = false;
config.TEST.use_ssl = false;
config.PROD.use_ssl = true;
config.use_ssl = config[config.env]['use_ssl'];


// **** DB ****
config.LOCAL.db = 'mongodb://agent:lightSA8ER@localhost:9090/myclaimshelper';
config.TEST.db = 'mongodb://agent:lightSA8ER@45.55.192.142:9090/myclaimshelper';
config.PROD.db = 'mongodb://agent:starWARS1@localhost:9090/myclaimshelper';
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
//    sudo gem install ultrahook/mailman
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


// **** Auth0 ****
config.oauth = {};

config.LOCAL.oauth_client_id = '198685353476-dmi3ilthpga177ghr9i9s3kmop08a9d8.apps.googleusercontent.com';
config.TEST.oauth_client_id = '198685353476-7ll4r86ethbt7e73ss4fups833tugsg3.apps.googleusercontent.com';
config.PROD.oauth_client_id = '198685353476-puc7iibpk05p5k6cki7p57gto53nnqkd.apps.googleusercontent.com';
config.oauth_client_id = config[config.env]['oauth_client_id'];

config.LOCAL.oauth_client_secret = 'Nt9v-xXok8cd_EQJU0VHFq5r';
config.TEST.oauth_client_secret = 'Di4KPilzpL8F8VItCnW_CgmB';
config.PROD.oauth_client_secret = 'BdCeIuEuMWrhiQqvyOF89PKq';
config.oauth_client_secret = config[config.env]['oauth_client_secret'];

config.LOCAL.oauth_redirect_url = 'http://localhost:8080/app/components/contactSync/contactAuthDone.html';
config.TEST.oauth_redirect_url = 'http://myclaimshelpertest.herokuapp.com/app/components/contactSync/contactAuthDone.html';
config.PROD.oauth_redirect_url = 'http://myclaimshelper.com/app/components/contactSync/contactAuthDone.html';
config.oauth_redirect_url = config[config.env]['oauth_redirect_url'];


// **** DNSSimple ****
config.dnssimple = {};
config.dnssimple.user = 'baljeet.mail@gmail.com';
config.dnssimple.password = 'starWAR$1';


// **** DigitalOcean ****
config.digitalOcean = {};
config.digitalOcean.user = 'baljeet.mail@gmail.com';
config.digitalOcean.password = 'starWAR$1';

// **** Loggly ****
config.loggly = {};
config.loggly.key = '4fb882fa-2aed-47fd-b0a4-e62331cb1ca1';
config.loggly.user = 'myclaimshelper';
config.loggly.password = 'starWAR$1';


module.exports = config;
