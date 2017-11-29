declare function require(string);

var datagram = require('dgram');
var mongo = require('mongodb').MongoClient;

export class SyslogServer {

	private serverSocket: any;

	private _isRunning: boolean = false; 
	get isRunning(): boolean { return this._isRunning; };

	private constructor(private port: number) {
	}

	public static start(port: number): Promise<SyslogServer> {

		return new Promise((resolve, reject) => {
			try {
				let server = new SyslogServer(port).init();
				resolve(server);				
			} catch (exception) {
				reject(exception);
			}
		}); 
	}

	private init(): Promise<SyslogServer> {

		return new Promise((resolve, reject) => {

			this.connectToMongoInstance().then(collection => {

				console.log(`Starting at port ${this.port}`);

				this.serverSocket = datagram.createSocket('udp4');
				this.serverSocket.on('message', (message, remoteInfo) => {
					this.persistMessage(message, remoteInfo, collection);
				});

				this.serverSocket.on('error', error => {
					console.log(`Error on socket: ${error}`);
				});

				this.serverSocket.bind(this.port);

				this.serverSocket.on('listening', () => {
					try {
						this._isRunning = true;
						console.log(`${this.port} portundan dinlenmeye başlandı`);
						resolve(this);					
					} catch (exception) {
						reject(exception);
					}
				});

			}).catch(exception => {
				console.error(`MongoDB bağlantısı sırasında hata: ${exception}`);
				reject(exception);
			});
		});
	}

	private connectToMongoInstance(): Promise<any> {
		return new Promise((resolve, reject) => {

			let mongoUrl = 
				'mongodb://172.20.10.2:27100,172.20.10.2:27101,172.20.10.2:27102/workspace?replicaSet=syslog';
			mongo.connect(mongoUrl).then(db => {

				console.log(`${mongoUrl} Veritabanına bağlanıldı`);

				db.collection('syslog', (error, collection) => {
					if (!error) {
						
						collection.createIndexes(
							[ { key: { message: "text" } }])
						.then(result => {

							console.log(`Veritabanı hazır: ${result}`);
							resolve(collection);
						}).catch(exception => {
							reject(exception);
						})
					} else {
						reject(error);
					}
				});
			}).catch(error => {
				reject(error);
			})
		});
	}

	private persistMessage(message: any, remoteInfo: any, collection: any) {
		console.log(`[${new Date()} - ${remoteInfo.address}] - ${message}`);

		let detail: any;
		try {
			detail = JSON.parse(message);
		} catch (exception) {
			// ignored, message is not of JSON type
		}
		collection.insertOne(
			{ 
				timestamp: new Date(), 
				sender: remoteInfo.address, 
				message: message.toString(),
				detail: detail
			}
		).then(result => {
			console.log('Mesaj kaydedildi');
		}).catch(exception => {
			console.log(`MongoDB'ye yazım hatası: ${exception}`);
		});
	}
}