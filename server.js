// backend for ceres app that routes a request from the client to openmotics
const express = require('express');
const app = express();
const port = process.env.PORT || 5001;



app.listen(port, () => console.log(`Listening on port ${port}!`));