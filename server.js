import http from 'http'
import app, {eventEmitter} from './src/app.js'
const server = http.createServer(app)
const PORT = process.env.PORT || 3000

eventEmitter.on('db_connected', () => {
	server.listen(PORT)
	console.log(`Server running on port ${PORT}`)
})