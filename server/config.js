var config = {};

// Node
config.port = process.env.PORT || 8080;

// Mongo DB
config.db = process.env.DB || 'mongodb://localhost:9090/AgentDb';
//config.db = 'mongodb://test:notforproduction@proximus.modulusmongo.net:27017/tuM8inys';

config.mailgun = {};
config.mailgun.user = 'baljeet.mail@gmail.com';
config.mailgun.password = 'the1the1';
config.mailgun.api_key = process.env.MAILGUN_API_KEY || 'key-601635737253d47869c96827dc8a61b8';
config.mailgun.domain = process.env.MAILGUN_DOMAIN || 'sandbox55cbe7b6dff840bca4f6b22307c44813.mailgun.org';

// Ultrahook
// Running locally
// 1. Install key
//    echo "api_key: KdsTRI5osKD2oVCZHaPOMP5KeJCDMaGG" > ~/.ultrahook
// 2. Install Ruby gem
//    sudo gem install ultrahook
// 3. Start
//    ultrahook mail 8080
config.ultrahook = {};
config.ultrahook.api_key = 'KdsTRI5osKD2oVCZHaPOMP5KeJCDMaGG';

// Auth0
config.auth0 = {};
config.auth0.user = 'baljeet.mail@gmail.com'
config.auth0.password = 'The1The1'
config.auth0.client_id = 'KD77kbmhe7n3rtQq0ZYHTlkH2ooBu2Rq'
config.auth0.client_secret = 'L3_qew5xG1FsXL6PVGpwP-YLnb1ev9I8ZmRe6BmP_hSwEVwzJsG93E9LizLP7E1j'

// DNSSimple

module.exports = config;
