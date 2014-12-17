var express = require('express'),
    bodyParser = require('body-parser'),
    multer = require('multer'),
    stringify = require('json-stringify-safe'),
    morgan = require('morgan'),
    favicon = require('serve-favicon'),
    path = require('path');

var app = express();

// favicon support
app.use(favicon(path.join(__dirname, '/public/favicon.ico')));

// CORS support
app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

// for parsing application/json
app.use(bodyParser.json()); 

// for parsing application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: true })); 

// for parsing multipart/form-data
app.use(multer()); 

// request logging
app.use(morgan('dev'));

// handle static content
app.use(express.static('public'));

app.post('/data', function (req, res) {
    res.send(stringify(req.body, null, '\t'));
});

var server = app.listen(3000, 'localhost', function () {
    var host = server.address().address;
    var port = server.address().port;
    console.log('Server listening at http://%s:%s', host, port);
});