"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var datagram = require('dgram');
var mongo = require('mongodb').MongoClient;
var SyslogServer = /** @class */ (function () {
    function SyslogServer(port) {
        this.port = port;
        this._isRunning = false;
    }
    Object.defineProperty(SyslogServer.prototype, "isRunning", {
        get: function () { return this._isRunning; },
        enumerable: true,
        configurable: true
    });
    ;
    SyslogServer.start = function (port) {
        return new Promise(function (resolve, reject) {
            try {
                var server = new SyslogServer(port).init();
                resolve(server);
            }
            catch (exception) {
                reject(exception);
            }
        });
    };
    SyslogServer.prototype.init = function () {
        var _this = this;
        return new Promise(function (resolve, reject) {
            _this.connectToMongoInstance().then(function (collection) {
                console.log("Starting at port " + _this.port);
                _this.serverSocket = datagram.createSocket('udp4');
                _this.serverSocket.on('message', function (message, remoteInfo) {
                    _this.persistMessage(message, remoteInfo, collection);
                });
                _this.serverSocket.on('error', function (error) {
                    console.log("Error on socket: " + error);
                });
                _this.serverSocket.bind(_this.port);
                _this.serverSocket.on('listening', function () {
                    try {
                        _this._isRunning = true;
                        console.log(_this.port + " portundan dinlenmeye ba\u015Fland\u0131");
                        resolve(_this);
                    }
                    catch (exception) {
                        reject(exception);
                    }
                });
            }).catch(function (exception) {
                console.error("MongoDB ba\u011Flant\u0131s\u0131 s\u0131ras\u0131nda hata: " + exception);
                reject(exception);
            });
        });
    };
    SyslogServer.prototype.connectToMongoInstance = function () {
        return new Promise(function (resolve, reject) {
            var mongoUrl = 'mongodb://172.20.10.2:27100,172.20.10.2:27101,172.20.10.2:27102/workspace?replicaSet=syslog';
            mongo.connect(mongoUrl).then(function (db) {
                console.log(mongoUrl + "\u00A0Veritaban\u0131na ba\u011Flan\u0131ld\u0131");
                db.collection('syslog', function (error, collection) {
                    if (!error) {
                        collection.createIndexes([{ key: { message: "text" } }])
                            .then(function (result) {
                            console.log("Veritaban\u0131 haz\u0131r: " + result);
                            resolve(collection);
                        }).catch(function (exception) {
                            reject(exception);
                        });
                    }
                    else {
                        reject(error);
                    }
                });
            }).catch(function (error) {
                reject(error);
            });
        });
    };
    SyslogServer.prototype.persistMessage = function (message, remoteInfo, collection) {
        console.log("[" + new Date() + " - " + remoteInfo.address + "] - " + message);
        var detail;
        try {
            detail = JSON.parse(message);
        }
        catch (exception) {
            // ignored, message is not of JSON type
        }
        collection.insertOne({
            timestamp: new Date(),
            sender: remoteInfo.address,
            message: message.toString(),
            detail: detail
        }).then(function (result) {
            console.log('Mesaj kaydedildi');
        }).catch(function (exception) {
            console.log("MongoDB'ye yaz\u0131m hatas\u0131: " + exception);
        });
    };
    return SyslogServer;
}());
exports.SyslogServer = SyslogServer;
//# sourceMappingURL=syslog-server.js.map