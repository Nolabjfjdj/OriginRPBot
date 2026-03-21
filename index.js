const mineflayer = require('mineflayer')
const http = require('http')

// ─── CONFIG ───────────────────────────────────────────────
const HOST = 'OriginRPFR.aternos.me'
const PORT = 36675
const USERNAME = 'OriginRPBot'
const VERSION = '1.12.2'
const RECONNECT_DELAY = 15000
const AFK_INTERVAL = 30000
// ──────────────────────────────────────────────────────────

let bot = null
let afkTimer = null
let reconnectTimer = null
let isConnecting = false

function createBot() {
  if (isConnecting || reconnectTimer) return
  isConnecting = true
  console.log(`[Bot] Connexion à ${HOST}:${PORT}...`)

  bot = mineflayer.createBot({
    host: HOST,
    port: PORT,
    username: USERNAME,
    version: VERSION,
    auth: 'offline',
    hideErrors: true,
  })

  bot.on('error', (err) => {
    console.log(`[Bot] Erreur : ${err.message}`)
    handleDisconnect()
  })

  bot.once('spawn', () => {
    isConnecting = false
    console.log(`[Bot] Connecté en tant que ${USERNAME} !`)
    startAntiAFK()
  })

  bot.on('chat', (username, message) => {
    if (username === USERNAME) return
    console.log(`[Chat] <${username}> ${message}`)
  })

  bot.on('kicked', (reason) => {
    let msg = reason
    try { msg = JSON.parse(reason)?.text || reason } catch (_) {}
    console.log(`[Bot] Kické : ${msg}`)
    handleDisconnect()
  })

  bot.on('end', (reason) => {
    console.log(`[Bot] Déconnecté : ${reason}`)
    handleDisconnect()
  })
}

function handleDisconnect() {
  cleanup()
  scheduleReconnect()
}

function startAntiAFK() {
  stopAntiAFK()
  afkTimer = setInterval(() => {
    if (!bot || !bot.entity) return
    bot.setControlState('jump', true)
    setTimeout(() => {
      if (bot) bot.setControlState('jump', false)
    }, 500)
    bot.look(Math.random() * Math.PI * 2, 0, false)
    console.log('[AFK] Mouvement anti-AFK effectué')
  }, AFK_INTERVAL)
}

function stopAntiAFK() {
  if (afkTimer) {
    clearInterval(afkTimer)
    afkTimer = null
  }
}

function cleanup() {
  isConnecting = false
  stopAntiAFK()
  if (bot) {
    try { bot.removeAllListeners() } catch (_) {}
    try { bot.end() } catch (_) {}
    bot = null
  }
}

function scheduleReconnect() {
  if (reconnectTimer) return
  console.log(`[Bot] Reconnexion dans ${RECONNECT_DELAY / 1000}s...`)
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null
    createBot()
  }, RECONNECT_DELAY)
}

// ─── Health server pour Railway ───────────────────────────
const PORT_HTTP = process.env.PORT || 3000
http.createServer((req, res) => {
  res.writeHead(200)
  res.end('Bot en ligne')
}).listen(PORT_HTTP, () => {
  console.log(`[Health] Serveur HTTP sur le port ${PORT_HTTP}`)
})

// ─── Démarrage ────────────────────────────────────────────
createBot()
