const clients = new Set();
let heartbeatTimer = null;

function startHeartbeat() {
  if (heartbeatTimer) return;
  heartbeatTimer = setInterval(() => {
    for (const res of clients) {
      res.write(': heartbeat\n\n');
    }
  }, 30000);
}

function stopHeartbeat() {
  if (clients.size === 0 && heartbeatTimer) {
    clearInterval(heartbeatTimer);
    heartbeatTimer = null;
  }
}

function addClient(res) {
  clients.add(res);
  startHeartbeat();
}

function removeClient(res) {
  clients.delete(res);
  stopHeartbeat();
}

function notifyOrdersChanged(reason) {
  const payload = `event: orders_changed\ndata: ${JSON.stringify({ reason })}\n\n`;
  for (const res of clients) {
    res.write(payload);
  }
}

module.exports = { addClient, removeClient, notifyOrdersChanged };
