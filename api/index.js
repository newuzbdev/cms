// Vercel serverless handler: route all requests to the Express app
const { app } = require('../server/server');
module.exports = app;
