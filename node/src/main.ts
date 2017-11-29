import { SyslogServer } from './server/syslog-server';

SyslogServer.start(5140).then(syslogServer => {
	if (!!syslogServer.isRunning) {
		console.log('SyslogServer started successfully');		
	} else {
		console.warn('SyslogServer is not running !!');
	}
}).catch(error => {
	console.error('Could not start SyslogServer: ' + error);
});