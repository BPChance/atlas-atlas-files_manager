const express = require('express');
const routes = require('./routes/index');
const { configDotenv } = require('dotenv');

configDotenv();

const app = express();
const port = process.env.PORT || 5000;

app.use(express.json({ limit: '50mb' }));
app.use('/', routes);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

module.exports = app;
