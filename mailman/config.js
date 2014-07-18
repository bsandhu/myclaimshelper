var config = {};

config.db = process.env.DB || 'mongodb://localhost:9090/007db';
module.exports = config;
