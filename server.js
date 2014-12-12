var express = require('express'),
    bodyParser = require('body-parser'),
    multer = require('multer'),
    stringify = require('json-stringify-safe'); 

var app = express();

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

app.get('/', function (req, res) {
    res.send('Hello World!');
    res.json(req.body);
});

app.post('/data', function (req, res) {
    console.log('received request for ' + req.get('Content-Type'));
    console.log(req.body);
    res.send(stringify(req.body, null, '\t'));
});

var server = app.listen(3000, '127.0.0.1', function () {
    var host = server.address().address;
    var port = server.address().port;
    console.log('Example app listening at http://%s:%s', host, port);
});