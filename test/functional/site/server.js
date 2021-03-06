var express               = require('express');
var http                  = require('http');
var fs                    = require('fs');
var path                  = require('path');
var readSync              = require('read-file-relative').readSync;
var multer                = require('multer');
var Mustache              = require('mustache');
var promisify             = require('../../../lib/utils/promisify');
var quarantineModeTracker = require('../quarantine-mode-tracker');

var storage = multer.memoryStorage();
var upload  = multer({ storage: storage });

var CONTENT_TYPES = {
    '.js':   'application/javascript',
    '.css':  'text/css',
    '.html': 'text/html',
    '.png':  'image/png'
};

var UPLOAD_SUCCESS_PAGE_TEMPLATE = readSync('./views/upload-success.html.mustache');

var readFile = promisify(fs.readFile);

var Server = module.exports = function (port, basePath) {
    var server = this;

    this.app       = express();
    this.appServer = http.createServer(this.app).listen(port);
    this.sockets   = [];
    this.basePath  = basePath;

    this._setupRoutes();

    var handler = function (socket) {
        server.sockets.push(socket);
        socket.on('close', function () {
            server.sockets.splice(server.sockets.indexOf(socket), 1);
        });
    };

    this.appServer.on('connection', handler);
};

Server.prototype._setupRoutes = function () {
    var server = this;

    this.app.get('*', function (req, res) {
        var reqPath      = req.params[0] || '';
        var resourcePath = path.join(server.basePath, reqPath);

        readFile(resourcePath)
            .then(function (content) {
                res.setHeader('content-type', CONTENT_TYPES[path.extname(resourcePath)]);
                res.send(content);
            })
            .catch(function () {
                res.sendStatus(404);
            });
    });

    this.app.post('/quarantine-mode/failing-sequence', function (req, res) {
        res.send(quarantineModeTracker.handleFailingSequence(req.headers['user-agent']));
    });

    this.app.post('/quarantine-mode/passing-sequence', function (req, res) {
        res.send(quarantineModeTracker.handlePassingSequence(req.headers['user-agent']));
    });

    this.app.post('/file-upload', upload.any(), function (req, res) {
        var filesData = req.files.map(function (file) {
            return file.buffer.toString();
        });

        res.end(Mustache.render(UPLOAD_SUCCESS_PAGE_TEMPLATE, { uploadedDataArray: JSON.stringify(filesData) }));
    });
};

Server.prototype.close = function () {
    this.appServer.close();
    this.sockets.forEach(function (socket) {
        socket.destroy();
    });
};
