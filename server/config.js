var config = {};

config.port = process.env.PORT || 8080;
config.db = process.env.DB || 'mongodb://localhost:9090/AgentDb';
module.exports = config;
