import QtQuick
import QtQuick.Layouts
import Quickshell
import Quickshell.Io
import qs.Commons
import qs.Ui
import "Model.js" as Model

// Bar widget for quick-mouse: start/stop the phone-as-mouse server and show
// its pairing QR code. Left click starts the server (if needed) and toggles
// the panel; right click stops it.
Panel {
  id: root
  moduleName: "nathan.quick-mouse"
  ipcTarget: "nathan.quick-mouse"
  // No IPC entry point needed (and one handler per target is the limit, so a
  // multi-monitor bar would fight over it).
  manageIpc: false

  readonly property string home: Quickshell.env("HOME")
  readonly property string pluginDir: Qt.resolvedUrl(".").toString().replace(/^file:\/\//, "")
  readonly property string stateDir: home + "/.local/state/nathan.quick-mouse"
  readonly property string qrFile: stateDir + "/qr.json"
  readonly property string logFile: stateDir + "/server.log"
  readonly property string binScript: pluginDir + "bin/omarchy-quick-mouse"

  property bool serverRunning: false
  property bool connected: false
  property bool starting: false
  property var qrRows: []
  property int qrSize: 0
  readonly property int quiet: 4
  property string qrUrl: ""
  property string errorText: ""

  readonly property color foreground: bar ? bar.foreground : Color.foreground
  readonly property color urgent: bar ? bar.urgent : Color.urgent
  readonly property color dim: Qt.darker(foreground, 1.4)
  readonly property string fontFamily: bar ? bar.fontFamily : Style.font.family

  readonly property string icon: {
    if (starting) return "\uDB80\uDFF2"  // md-phone
    if (!serverRunning) return "\uDB80\uDDC0" // md-cursor_default (stopped)
    return connected ? "\uDB80\uDFF6" : "\uDB80\uDFF2" // md-phone_in_talk : md-phone
  }

  readonly property string statusTitle: Model.statusLabel(serverRunning, connected, starting)
  readonly property string statusCaption: {
    if (errorText !== "") return "Check the log or right-click to stop"
    if (starting) return "Booting server\u2026"
    if (!serverRunning) return "Left-click to start"
    return connected ? "Move your mouse to steer" : "Scan the code with your phone"
  }

  implicitWidth: button.implicitWidth
  implicitHeight: button.implicitHeight

  function refresh() {
    refreshStatus()
    readQRFile()
  }

  function refreshStatus() {
    if (statusProc.running) return
    statusProc.running = true
  }

  function readQRFile() {
    if (readProc.running) return
    readProc.running = true
  }

  function startServer() {
    if (serverRunning || starting) { root.open(); return }
    errorText = ""
    starting = true
    qrRows = []
    qrSize = 0
    qrUrl = ""
    startProc.running = true
    root.open()
  }

  function stopServer() {
    if (stopProc.running) return
    errorText = ""
    starting = false
    stopProc.running = true
    root.close()
  }

  BarIconButton {
    id: button
    anchors.fill: parent
    bar: root.bar
    text: root.icon
    active: root.connected
    activeColor: Color.accent
    tooltipText: "Quick Mouse \u2014 " + root.statusTitle
    onPressed: function(b) {
      if (b === Qt.RightButton) {
        if (root.serverRunning || root.starting) root.stopServer()
        return
      }
      if (!root.serverRunning && !root.starting) root.startServer()
      else root.toggle()
    }
  }

  // Watch the state dir so connect/disconnect and start/stop land on every
  // bar instance without polling.
  FileView {
    path: root.stateDir
    watchChanges: true
    printErrors: false
    onFileChanged: root.refresh()
  }

  // Cheap background poll while starting (or running with no QR yet) — the
  // script creates stateDir on start, and FileView can't see a directory that
  // did not exist when it subscribed.
  Timer {
    id: pollTimer
    interval: 1000
    repeat: true
    running: root.starting || (root.serverRunning && root.qrSize === 0)
    onTriggered: root.refresh()
  }

  Process {
    id: startProc
    command: ["bash", "-c", root.binScript + " start"]
    onExited: function(exitCode) {
      root.starting = false
      if (exitCode !== 0) {
        root.errorText = "Could not start the server"
      } else {
        root.errorText = ""
        Qt.callLater(function() { root.refresh() })
      }
    }
  }

  Process {
    id: stopProc
    command: ["bash", "-c", root.binScript + " stop"]
    onExited: function() {
      root.serverRunning = false
      root.connected = false
      root.starting = false
      root.qrRows = []
      root.qrSize = 0
      root.qrUrl = ""
      root.errorText = ""
    }
  }

  Process {
    id: statusProc
    command: ["bash", "-c", root.binScript + " status"]
    stdout: StdioCollector { id: statusStdout; waitForEnd: true }
    onExited: function(exitCode) {
      var out = String(statusStdout.text || "").trim()
      root.serverRunning = exitCode === 0 && out.indexOf("running") === 0
      if (!root.serverRunning) {
        root.connected = false
        root.qrRows = []
        root.qrSize = 0
        root.qrUrl = ""
      } else {
        root.readQRFile()
      }
    }
  }

  Process {
    id: readProc
    command: ["cat", root.qrFile]
    stdout: StdioCollector { id: readStdout; waitForEnd: true }
    onExited: function(exitCode) {
      if (exitCode !== 0) return
      var info = Model.parseQrInfo(readStdout.text)
      if (!info.valid) return
      root.qrRows = info.matrix
      root.qrSize = info.size
      root.qrUrl = info.url
      root.connected = info.connected
    }
  }

  Component.onCompleted: root.refresh()

  KeyboardPanel {
    id: panel
    anchorItem: button
    owner: root
    bar: root.bar
    open: root.opened
    focusTarget: keyCatcher
    contentWidth: panel.fittedContentWidth(Style.space(320))
    contentHeight: panel.fittedContentHeight(column.implicitHeight)

    PanelKeyCatcher {
      id: keyCatcher
      anchors.fill: parent
      onCloseRequested: root.close()
      onActivateRequested: {
        if (!root.serverRunning && !root.starting) root.startServer()
        else if (root.serverRunning) root.stopServer()
      }

      Column {
        id: column
        anchors.fill: parent
        spacing: Style.space(14)

        // ---------- Hero: icon · title ----------
        Item {
          width: parent.width
          implicitHeight: Math.max(heroIcon.implicitHeight, heroLabels.implicitHeight)

          Text {
            id: heroIcon
            textFormat: Text.PlainText
            anchors.left: parent.left
            anchors.verticalCenter: parent.verticalCenter
            text: root.icon
            color: root.connected ? Color.accent : root.foreground
            font.family: root.fontFamily
            font.pixelSize: Style.font.display
          }

          Column {
            id: heroLabels
            anchors.left: heroIcon.right
            anchors.leftMargin: Style.space(14)
            anchors.right: parent.right
            anchors.verticalCenter: parent.verticalCenter
            spacing: Style.space(2)

            Text {
              text: "Quick Mouse"
              color: root.foreground
              font.family: root.fontFamily
              font.pixelSize: Style.font.title
              font.bold: true
              elide: Text.ElideRight
              width: parent.width
            }

            Text {
              textFormat: Text.PlainText
              text: root.statusTitle.toUpperCase()
              color: root.dim
              font.family: root.fontFamily
              font.pixelSize: Style.font.caption
              font.bold: true
              font.letterSpacing: 1.2
              elide: Text.ElideRight
              width: parent.width
            }
          }
        }

        // ---------- QR code ----------
        Rectangle {
          id: qrCanvas
          readonly property int moduleSize: root.qrSize > 0
            ? Math.max(3, Math.floor(Style.space(240) / (root.qrSize + root.quiet * 2)))
            : 0

          visible: root.qrSize > 0
          width: (root.qrSize + root.quiet * 2) * moduleSize
          height: width
          color: "white"
          radius: Style.cornerRadius
          x: (parent.width - width) / 2

          // The server's matrix carries no quiet zone, so pad it here with
          // four white modules on each side or phones won't scan it.
          Grid {
            x: root.quiet * qrCanvas.moduleSize
            y: root.quiet * qrCanvas.moduleSize
            columns: root.qrSize

            Repeater {
              model: root.qrSize * root.qrSize

              Rectangle {
                required property int index
                width: qrCanvas.moduleSize
                height: qrCanvas.moduleSize
                color: root.qrRows[Math.floor(index / root.qrSize)].charAt(index % root.qrSize) === "1"
                  ? "#111111" : "transparent"
              }
            }
          }
        }

        Text {
          visible: root.starting
          text: "Starting server\u2026"
          color: root.dim
          font.family: root.fontFamily
          font.pixelSize: Style.font.bodySmall
          width: parent.width
          horizontalAlignment: Text.AlignHCenter
        }

        Text {
          visible: root.qrSize > 0
          text: "Scan with your phone camera to pair"
          color: root.dim
          font.family: root.fontFamily
          font.pixelSize: Style.font.bodySmall
          width: parent.width
          horizontalAlignment: Text.AlignHCenter
        }

        Text {
          textFormat: Text.PlainText
          visible: root.qrUrl !== ""
          text: root.qrUrl
          color: root.dim
          font.family: root.fontFamily
          font.pixelSize: Style.font.caption
          elide: Text.ElideMiddle
          width: Math.min(parent.width, Style.space(300))
          x: (parent.width - width) / 2
          horizontalAlignment: Text.AlignHCenter
        }

        Text {
          textFormat: Text.PlainText
          visible: root.errorText !== ""
          text: root.errorText + (root.logFile ? " \u2014 see " + root.logFile : "")
          color: root.urgent
          font.family: root.fontFamily
          font.pixelSize: Style.font.bodySmall
          wrapMode: Text.Wrap
          width: parent.width
          horizontalAlignment: Text.AlignHCenter
        }

        Text {
          textFormat: Text.PlainText
          visible: !root.serverRunning && !root.starting
          text: "Start server"
          color: Color.accent
          font.family: root.fontFamily
          font.pixelSize: Style.font.bodySmall
          font.bold: true
          width: parent.width
          horizontalAlignment: Text.AlignHCenter

          MouseArea {
            anchors.fill: parent
            cursorShape: Qt.PointingHandCursor
            onClicked: root.startServer()
          }
        }

        Text {
          textFormat: Text.PlainText
          visible: root.serverRunning
          text: "Stop server"
          color: root.urgent
          font.family: root.fontFamily
          font.pixelSize: Style.font.bodySmall
          font.bold: true
          width: parent.width
          horizontalAlignment: Text.AlignHCenter

          MouseArea {
            anchors.fill: parent
            cursorShape: Qt.PointingHandCursor
            onClicked: root.stopServer()
          }
        }

        Text {
          textFormat: Text.PlainText
          visible: root.serverRunning
          text: "Right-click the bar icon to stop it quickly"
          color: root.dim
          font.family: root.fontFamily
          font.pixelSize: Style.font.caption
          width: parent.width
          horizontalAlignment: Text.AlignHCenter
        }
      }
    }
  }
}