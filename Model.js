// Parses the qr.json written by the quick-mouse server (via its
// -qr-json-file flag): a JSON object with `url`, `port`, `connected`, and a
// square array of '1'/'0' module rows. A malformed payload returns
// valid:false so the panel renders an error rather than garbage.
function parseQrInfo(raw) {
  var out = { valid: false, url: "", matrix: [], size: 0, port: 0, connected: false }
  var data = null
  try { data = JSON.parse(String(raw || "").trim()) } catch (e) { return out }
  if (!data || typeof data !== "object") return out
  out.url = typeof data.url === "string" ? data.url : ""
  out.port = typeof data.port === "number" ? data.port : 0
  out.connected = data.connected === true

  var rows = Array.isArray(data.matrix) ? data.matrix : []
  var size = typeof data.size === "number" ? data.size : 0
  if (size > 0 && rows.length === size) {
    for (var i = 0; i < rows.length; i++) {
      var row = rows[i]
      if (typeof row !== "string" || row.length !== size || !/^[01]+$/.test(row)) return out
    }
    out.matrix = rows
    out.size = size
    out.valid = true
  }
  return out
}

function statusLabel(serverRunning, connected, starting) {
  if (starting) return "Starting\u2026"
  if (!serverRunning) return "Server stopped"
  return connected ? "Phone connected" : "Waiting for phone"
}

if (typeof module !== "undefined") {
  module.exports = {
    parseQrInfo: parseQrInfo,
    statusLabel: statusLabel
  }
}