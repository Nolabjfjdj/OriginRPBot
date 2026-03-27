const mineflayer = require("mineflayer")
const http = require("http")

const SERVERS = [
  { host: "OriginRPFR.aternos.me", port: 36675 },
  { host: "lemming.aternos.host", port: 36675 }
]
let currentServerIndex = 0

const USERNAME = "OriginRPBot"
const VERSION = "1.12.2"
const RECONNECT_DELAY = 10000
const AFK_MIN = 1000
const AFK_MAX = 100000

let bot = null
let afkTimer = null
let reconnectTimer = null
let isConnecting = false
let dead = false

function randomDelay() {
  return Math.floor(Math.random() * (AFK_MAX - AFK_MIN + 1)) + AFK_MIN
}

function getCurrentServer() {
  return SERVERS[currentServerIndex]
}

function switchToNextServer() {
  currentServerIndex = (currentServerIndex + 1) % SERVERS.length
  console.log("[Bot] Passage au serveur suivant : " + getCurrentServer().host + ":" + getCurrentServer().port)
}

function createBot() {
  if (isConnecting || reconnectTimer) return
  isConnecting = true
  dead = false

  var server = getCurrentServer()
  console.log("[Bot] Connexion a " + server.host + ":" + server.port + "...")

  bot = mineflayer.createBot({
    host: server.host,
    port: server.port,
    username: USERNAME,
    version: VERSION,
    auth: "offline",
    hideErrors: false,
    checkTimeoutInterval: 60000,
  })

  // Timeout de connexion : si pas de spawn dans les 30s, on considère que le serveur est inaccessible
  var connectionTimeout = setTimeout(function() {
    if (isConnecting && !dead) {
      dead = true
      console.log("[Bot] Timeout de connexion sur " + server.host + " - tentative sur le serveur suivant...")
      switchToNextServer()
      handleDisconnect()
    }
  }, 30000)

  bot.on("error", function(err) {
    if (dead) return
    dead = true
    clearTimeout(connectionTimeout)
    console.log("[Bot] Erreur sur " + server.host + " : " + err.message)
    // Si erreur de connexion (ECONNREFUSED, ENOTFOUND, etc.), on bascule sur l'autre serveur
    if (
      err.code === "ECONNREFUSED" ||
      err.code === "ENOTFOUND" ||
      err.code === "ETIMEDOUT" ||
      err.code === "ECONNRESET" ||
      err.message.includes("connect") ||
      err.message.includes("ECONNREFUSED") ||
      err.message.includes("ENOTFOUND")
    ) {
      console.log("[Bot] Serveur " + server.host + " inaccessible, bascule sur le serveur suivant...")
      switchToNextServer()
    }
    handleDisconnect()
  })

  bot.once("spawn", function() {
    isConnecting = false
    clearTimeout(connectionTimeout)
    console.log("[Bot] Connecte en tant que " + USERNAME + " sur " + server.host + " !")
    scheduleNextAFK()
  })

  bot.on("chat", function(username, message) {
    if (username === USERNAME) return
    console.log("[Chat] <" + username + "> " + message)
  })

  bot.on("kicked", function(reason) {
    if (dead) return
    dead = true
    clearTimeout(connectionTimeout)
    var msg = reason
    try { msg = JSON.parse(reason).text || reason } catch(e) {}
    console.log("[Bot] Kicte de " + server.host + " : " + msg)
    handleDisconnect()
  })

  bot.on("end", function(reason) {
    if (dead) return
    dead = true
    clearTimeout(connectionTimeout)
    console.log("[Bot] Deconnecte de " + server.host + " : " + reason)
    handleDisconnect()
  })
}

function scheduleNextAFK() {
  stopAntiAFK()
  var delay = randomDelay()
  console.log("[AFK] Prochain mouvement dans " + (delay / 1000).toFixed(1) + "s")
  afkTimer = setTimeout(function() {
    doAFKMove()
    scheduleNextAFK()
  }, delay)
}

function doAFKMove() {
  if (!bot || !bot.entity) return
  var action = Math.floor(Math.random() * 4)
  if (action === 0) {
    bot.setControlState("jump", true)
    setTimeout(function() { if (bot) bot.setControlState("jump", false) }, 500)
    console.log("[AFK] Action : saut")
  } else if (action === 1) {
    bot.look(Math.random() * Math.PI * 2, (Math.random() - 0.5) * 0.5, false)
    console.log("[AFK] Action : rotation")
  } else if (action === 2) {
    bot.setControlState("forward", true)
    setTimeout(function() { if (bot) bot.setControlState("forward", false) }, 500 + Math.random() * 1000)
    console.log("[AFK] Action : marche")
  } else {
    bot.look(Math.random() * Math.PI * 2, 0, false)
    bot.setControlState("jump", true)
    setTimeout(function() { if (bot) bot.setControlState("jump", false) }, 500)
    console.log("[AFK] Action : rotation + saut")
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
  var server = getCurrentServer()
  console.log("[Bot] Reconnexion sur " + server.host + " dans " + (RECONNECT_DELAY / 1000) + "s...")
  reconnectTimer = setTimeout(function() {
    reconnectTimer = null
    createBot()
  }, RECONNECT_DELAY)
}

process.on("uncaughtException", function(err) {
  console.log("[Process] Erreur non geree : " + err.message)
  cleanup()
  scheduleReconnect()
})

var PORT_HTTP = process.env.PORT || 3000
http.createServer(function(req, res) {
  var server = getCurrentServer()
  res.writeHead(200)
  res.end("Bot en ligne - Serveur actuel : " + server.host + ":" + server.port)
}).listen(PORT_HTTP, function() {
  console.log("[Health] Serveur HTTP sur le port " + PORT_HTTP)
})

createBot()
