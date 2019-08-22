// backend proxy server for ceres app that routes a 
// request from the client to openmotics
const express = require('express');
const proxy = require('express-http-proxy');
const morgan = require('morgan');
// const config = require('./src/config');

const app = express();
const port = process.env.PORT || 5000;

// test comment
app.use(morgan('dev'));
app.use(express.static(path.join(__dirname, 'build')));
app.use('/proxy', proxy(process.env.baseurl));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname + '/build/index.html'));
});


app.listen(port, () => console.log(`Listening on port ${port}!`));