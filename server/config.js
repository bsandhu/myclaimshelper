var config = {};

config.port = process.env.PORT || 8080;
config.db = process.env.DB || 'mongodb://localhost:9090/AgentDb';
//config.db = 'mongodb://test:notforproduction@proximus.modulusmongo.net:27017/tuM8inys';
config.mailgun = {};
config.mailgun.api_key = process.env.MAILGUN_API_KEY || 'key-8ll9fxdf6yptk70y0lyvdo7vzmrkzry4';
config.mailgun.domain = process.env.MAILGUN_DOMAIN || 'sandbox82f9b317bb2c4ea38436d21c26b9a6fe.mailgun.org';

module.exports = config;
