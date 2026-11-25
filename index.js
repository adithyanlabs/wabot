const client = require('./lib/client')
let _baileys = null;

const connect = async () => {
	try {
		if (!_baileys) {
			_baileys = await import('baileys');
			global.Baileys = _baileys;
			require('./lib/proto-ext').enableStickerAudio(_baileys);
		}
		await client.connect()
	} catch (error) {
		console.error(error)
	}
}
connect()
