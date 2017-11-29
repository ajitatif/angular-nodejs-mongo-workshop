"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var syslog_server_1 = require("./server/syslog-server");
syslog_server_1.SyslogServer.start(5140).then(function (syslogServer) {
    if (!!syslogServer.isRunning) {
        console.log('SyslogServer started successfully');
    }
    else {
        console.warn('SyslogServer is not running !!');
    }
}).catch(function (error) {
    console.error('Could not start SyslogServer: ' + error);
});
//# sourceMappingURL=main.js.map