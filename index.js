const mineflayer = require(‘mineflayer’)
const http = require(‘http’)

// CONFIG
const HOST = ‘OriginRPFR.aternos.me’
const PORT = 36675
const USERNAME = ‘OriginRPBot’
const VERSION = ‘1.12.2’
const RECONNECT_DELAY = 15000
const AFK_MIN = 1000
const AFK_MAX = 120000

let bot = null
let afkTimer = null
let reconnectTimer = null
let isConnecting = false

function randomDelay() {
return Math.floor(Math.random() * (AFK_MAX - AFK_MIN + 1)) + AFK_MIN
}

function createBot() {
if (isConnecting || reconnectTimer) return
isConnecting = true
console.log(’[Bot] Connexion a ’ + HOST + ‘:’ + PORT + ‘…’)

bot = mineflayer.createBot({
host: HOST,
port: PORT,
username: USERNAME,
version: VERSION,
auth: ‘offline’,
hideErrors: true,
})

bot.on(‘error’, function(err) {
console.log(’[Bot] Erreur : ’ + err.message)
handleDisconnect()
})

bot.once(‘spawn’, function() {
isConnecting = false
console.log(’[Bot] Connecte en tant que ’ + USERNAME + ’ !’)
scheduleNextAFK()
})

bot.on(‘chat’, function(username, message) {
if (username === USERNAME) return
console.log(’[Chat] <’ + username + ’> ’ + message)
})

bot.on(‘kicked’, function(reason) {
var msg = reason
try { msg = JSON.parse(reason).text || reason } catch(e) {}
console.log(’[Bot] Kicte : ’ + msg)
handleDisconnect()
})

bot.on(‘end’, function(reason) {
console.log(’[Bot] Deconnecte : ’ + reason)
handleDisconnect()
})
}

function scheduleNextAFK() {
stopAntiAFK()
var delay = randomDelay()
console.log(’[AFK] Prochain mouvement dans ’ + (delay / 1000).toFixed(1) + ‘s’)
afkTimer = setTimeout(function() {
doAFKMove()
scheduleNextAFK()
}, delay)
}

function doAFKMove() {
if (!bot || !bot.entity) return
var action = Math.floor(Math.random() * 4)
if (action === 0) {
bot.setControlState(‘jump’, true)
setTimeout(function() { if (bot) bot.setControlState(‘jump’, false) }, 500)
console.log(’[AFK] Action : saut’)
} else if (action === 1) {
bot.look(Math.random() * Math.PI * 2, (Math.random() - 0.5) * 0.5, false)
console.log(’[AFK] Action : rotation’)
} else if (action === 2) {
bot.setControlState(‘forward’, true)
setTimeout(function() { if (bot) bot.setControlState(‘forward’, false) }, 500 + Math.random() * 1000)
console.log(’[AFK] Action : marche’)
} else {
bot.look(Math.random() * Math.PI * 2, 0, false)
bot.setControlState(‘jump’, true)
setTimeout(function() { if (bot) bot.setControlState(‘jump’, false) }, 500)
console.log(’[AFK] Action : rotation + saut’)
}
}

function stopAntiAFK() {
if (afkTimer) {
clearTimeout(afkTimer)
afkTimer = null
}
}

function handleDisconnect() {
cleanup()
scheduleReconnect()
}

function cleanup() {
isConnecting = false
stopAntiAFK()
if (bot) {
try { bot.removeAllListeners() } catch(e) {}
try { bot.end() } catch(e) {}
bot = null
}
}

function scheduleReconnect() {
if (reconnectTimer) return
console.log(’[Bot] Reconnexion dans ’ + (RECONNECT_DELAY / 1000) + ‘s…’)
reconnectTimer = setTimeout(function() {
reconnectTimer = null
createBot()
}, RECONNECT_DELAY)
}

// Health server pour Render
var PORT_HTTP = process.env.PORT || 3000
http.createServer(function(req, res) {
res.writeHead(200)
res.end(‘Bot en ligne’)
}).listen(PORT_HTTP, function() {
console.log(’[Health] Serveur HTTP sur le port ’ + PORT_HTTP)
})

// Demarrage
createBot()