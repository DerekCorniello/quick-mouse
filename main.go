package main

import (
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"log"
	"net"
	"net/http"
	"net/url"
	"os"
	"os/signal"
	"syscall"
	"time"

	"quick-mouse/server"

	"github.com/gorilla/websocket"
	"github.com/mdp/qrterminal/v3"
)

// this is how we get the ip of the pc to host correctly
func getLocalIP() string {
	addrs, err := net.InterfaceAddrs()
	if err != nil {
		return "localhost"
	}
	for _, addr := range addrs {
		if ipnet, ok := addr.(*net.IPNet); ok && !ipnet.IP.IsLoopback() {
			if ipnet.IP.To4() != nil {
				return ipnet.IP.String()
			}
		}
	}
	return "localhost"
}

// landingPageHandler serves an HTML page with a WebSocket test client
func landingPageHandler(w http.ResponseWriter, r *http.Request) {
	localIP := getLocalIP()
	wsURL := fmt.Sprintf("wss://%s:3000/ws", localIP)
	key := r.URL.Query().Get("key")

	html := `<!DOCTYPE html>
<html>
<head>
    <title>Mouse Control Test Client</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 30px; font-size: 18px; }
        .section { margin: 30px 0; padding: 25px; border: 2px solid #ccc; border-radius: 8px; }
        .input-group { margin: 15px 0; }
        input[type="number"] { width: 120px; margin-right: 15px; padding: 8px; font-size: 18px; }
        input[type="text"] { width: 300px; padding: 8px; font-size: 18px; }
        button { margin: 8px; padding: 12px 24px; cursor: pointer; font-size: 18px; border-radius: 5px; }
        .status { padding: 15px; margin: 15px 0; border-radius: 5px; font-size: 18px; }
        .connected { background-color: #d4edda; color: #155724; }
        .disconnected { background-color: #f8d7da; color: #721c24; }
        .error { background-color: #fff3cd; color: #856404; }
        #messages { max-height: 400px; overflow-y: auto; background: #f8f9fa; padding: 15px; border-radius: 5px; font-size: 16px; }
        h1 { font-size: 28px; }
        h3 { font-size: 22px; margin-top: 0; }
    </style>
</head>
<body>
    <h1>Mouse Control Test Client</h1>
    <p>WebSocket URL: ` + wsURL + `</p>
    <p>Auth Key: ` + key + `</p>

    <div class="section">
        <h3>Connection</h3>
        <button onclick="connectWithCorrectKey()">Connect with Correct Key</button>
        <button onclick="connectWithWrongKey()">Connect with Wrong Key</button>
        <div class="input-group">
            <label>Custom Key: <input type="text" id="customKey" placeholder="Enter custom key"></label>
            <button onclick="connectWithCustomKey()">Connect with Custom Key</button>
        </div>
        <button onclick="disconnect()">Disconnect</button>
        <div id="status" class="status disconnected">Disconnected</div>
    </div>

    <div class="section">
        <h3>Mouse Movement</h3>
        <div class="input-group">
            <label>X Delta: <input type="number" id="moveX" value="10"></label>
            <label>Y Delta: <input type="number" id="moveY" value="10"></label>
            <button onclick="sendMouseMove()">Move Mouse</button>
        </div>
    </div>

    <div class="section">
        <h3>Mouse Clicks</h3>
        <button onclick="sendPacket('left_click_down')">Left Click Down</button>
        <button onclick="sendPacket('left_click_up')">Left Click Up</button>
        <button onclick="sendPacket('right_click_down')">Right Click Down</button>
        <button onclick="sendPacket('right_click_up')">Right Click Up</button>
    </div>

    <div class="section">
        <h3>Mouse Scroll</h3>
        <div class="input-group">
            <label>X Delta: <input type="number" id="scrollX" value="0"></label>
            <label>Y Delta: <input type="number" id="scrollY" value="3"></label>
            <button onclick="sendScroll()">Scroll</button>
        </div>
    </div>

    <div class="section">
        <h3>Control Mode</h3>
        <button onclick="sendPacket('switch_mode')">Toggle Control Mode</button>
    </div>

    <div class="section">
        <h3>Other Packets</h3>
        <button onclick="sendPacket('unknown_packet')">Unknown Packet (Test Error)</button>
    </div>

    <div class="section">
        <h3>Messages</h3>
        <div id="messages"></div>
    </div>

    <script>
        let socket;
        const statusDiv = document.getElementById('status');
        const messagesDiv = document.getElementById('messages');
        const authKey = '` + key + `';

        function connect(key) {
            socket = new WebSocket('` + wsURL + `');

            socket.onopen = function(event) {
                statusDiv.textContent = 'Authenticated';
                statusDiv.className = 'status connected';
                addMessage('Connected to WebSocket - authenticated');
                // Send auth packet immediately
                const authPacket = { type: 'auth', key: key };
                sendJSON(authPacket);
            };

            socket.onmessage = function(event) {
                const data = JSON.parse(event.data);
                if (data.type === 'keep_alive') {
                    // Keep-alive from server, no action needed
                } else {
                    addMessage('Received: ' + event.data);
                }
            };

            socket.onclose = function(event) {
                statusDiv.textContent = 'Disconnected';
                statusDiv.className = 'status disconnected';
                addMessage('Disconnected');
            };

            socket.onerror = function(error) {
                statusDiv.textContent = 'Error';
                statusDiv.className = 'status error';
                addMessage('Error: ' + error);
            };
        }

        function connectWithCorrectKey() {
            connect(authKey);
        }

        function connectWithWrongKey() {
            connect('invalid_key_12345');
        }

        function connectWithCustomKey() {
            const customKey = document.getElementById('customKey').value;
            connect(customKey);
        }

        function disconnect() {
            if (socket) {
                socket.close();
            }
        }

        function sendPacket(packetType) {
            const packet = { type: packetType };
            sendJSON(packet);
        }

        function sendMouseMove() {
            const x = parseInt(document.getElementById('moveX').value) || 0;
            const y = parseInt(document.getElementById('moveY').value) || 0;
            const packet = { type: 'mouse_move', x: x, y: y };
            sendJSON(packet);
        }

        function sendScroll() {
            const x = parseInt(document.getElementById('scrollX').value) || 0;
            const y = parseInt(document.getElementById('scrollY').value) || 0;
            const packet = { type: 'scroll_move', x: x, y: y };
            sendJSON(packet);
        }

        function sendJSON(packet) {
            if (socket && socket.readyState === WebSocket.OPEN) {
                const jsonStr = JSON.stringify(packet);
                socket.send(jsonStr);
                addMessage('Sent: ' + jsonStr);
            } else {
                addMessage('Not connected');
            }
        }

        function addMessage(message) {
            const p = document.createElement('p');
            p.textContent = new Date().toLocaleTimeString() + ' - ' + message;
            messagesDiv.appendChild(p);
            messagesDiv.scrollTop = messagesDiv.scrollHeight;
        }


    </script>
</body>
</html>`

	w.Header().Set("Content-Type", "text/html")
	w.Write([]byte(html))
}

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true // allow all connections since access is controlled by QR code
		// HACK: this may be a hack but it is fine for now, i dont think we
		// 		 need any more protection
	},
}

var (
	serializer       server.Serializer = server.JSONSerializer{}
	controller       *server.PacketController
	connectedClients int
)

func enterAlternateScreen() {
	fmt.Print("\033[?1049h\033[H\033[2J") // switch to alt screen, move to top, clear
}

func exitAlternateScreen() {
	fmt.Print("\033[?1049l") // switch back to primary screen
}

func updateDisplay() {
	// clear screen and move to top
	fmt.Print("\033[H\033[2J")

	if connectedClients > 0 {
		fmt.Println("Status: Device connected")
	} else {
		localIP := getLocalIP()
		httpURL := fmt.Sprintf("https://%s:3000/?key=%s", localIP, url.QueryEscape(authKey))

		fmt.Print("Scan this QR code to connect:\n\n")
		qrterminal.GenerateWithConfig(httpURL, qrterminal.Config{
			Level:     qrterminal.L,
			Writer:    os.Stdout,
			BlackChar: qrterminal.BLACK,
			WhiteChar: qrterminal.WHITE,
			QuietZone: 0,
		})
		fmt.Println("\nPress Ctrl+C to exit")
	}
}

var authKey string

func wsHandler(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println("Error upgrading connection:", err)
		return
	}
	defer conn.Close()

	connectedClients++
	updateDisplay()
	defer func() {
		connectedClients--
		updateDisplay()
	}()

	// require authentication first
	_, message, err := conn.ReadMessage()
	if err != nil {
		log.Println("Error reading first message:", err)
		return
	}
	fmt.Printf("Received first message: %s\n", message)

	// always parse as auth packet
	var envelope struct {
		Type server.PacketType `json:"type"`
	}
	if err := json.Unmarshal(message, &envelope); err != nil {
		log.Println("Error parsing first JSON:", err)
		conn.Close()
		return
	}
	if envelope.Type != server.Auth {
		log.Println("First message is not auth")
		conn.Close()
		return
	}

	// unmarshal auth packet
	packet, err := serializer.Unmarshal(message, server.Auth)
	if err != nil {
		log.Println("Error unmarshaling auth packet:", err)
		conn.Close()
		return
	}
	authPacket, ok := packet.(*server.AuthPacket)
	if !ok {
		log.Println("Invalid auth packet")
		conn.Close()
		return
	}
	if authPacket.Key != authKey {
		log.Println("Invalid auth key")
		conn.Close()
		return
	}

	log.Println("Client authenticated successfully")

	// start keep-alive mechanism
	// ws connections typically timeout after 30-120 seconds of inactivity
	// see https://websockets.readthedocs.io/en/stable/topics/timeouts.html
	// Gorilla may help maintain connections, but explicit keep-alives ensure compatibility across networks
	activityChan := make(chan struct{}, 1)
	keepAliveTimer := time.NewTimer(25 * time.Second)
	defer keepAliveTimer.Stop()

	go func() {
		for {
			select {
			case <-keepAliveTimer.C:
				// send keep-alive packet
				keepAlive := map[string]string{"type": "keep_alive"}
				response, err := json.Marshal(keepAlive)
				if err != nil {
					log.Println("Error marshaling keep-alive:", err)
					return
				}
				err = conn.WriteMessage(websocket.TextMessage, response)
				if err != nil {
					log.Println("Error sending keep-alive:", err)
					return
				}
				log.Println("Sent keep-alive packet")
				keepAliveTimer.Reset(25 * time.Second)
			case <-activityChan:
				if !keepAliveTimer.Stop() {
					select {
					case <-keepAliveTimer.C:
					default:
					}
				}
				keepAliveTimer.Reset(25 * time.Second)
			}
		}
	}()

	// Now process other packets
	for {
		_, message, err := conn.ReadMessage()
		if err != nil {
			log.Println("Error reading message:", err)
			break
		}
		// signal activity to reset keep-alive timer
		select {
		case activityChan <- struct{}{}:
		default:
		}
		// fmt.Printf("Received: %s\n", message)

		// parse packet type from JSON
		if err := json.Unmarshal(message, &envelope); err != nil {
			log.Println("Error parsing JSON:", err)
			continue
		}
		if envelope.Type == "" {
			log.Println("Missing or invalid type field")
			continue
		}
		packetType := envelope.Type

		// skip auth packets if sent again
		if packetType == server.Auth {
			continue
		}

		// unmarshal the packet
		packet, err := serializer.Unmarshal(message, packetType)
		if err != nil {
			log.Println("Error unmarshaling packet:", err)
			continue
		}

		if err := controller.ProcessPacket(packet); err != nil {
			log.Println("Error processing packet:", err)
			continue
		}
	}
}

func generateAuthKey() string {
	bytes := make([]byte, 16) // 16 bytes = 32 hex chars
	if _, err := rand.Read(bytes); err != nil {
		log.Fatal("Failed to generate auth key:", err)
	}
	return hex.EncodeToString(bytes)
}

func main() {
	// lets not overflow the tui
	enterAlternateScreen()
	defer exitAlternateScreen()

	// set up a signal handling for clean exit
	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, syscall.SIGINT, syscall.SIGTERM)
	go func() {
		<-sigChan
		exitAlternateScreen()
		os.Exit(0)
	}()

	authKey = generateAuthKey()
	var err error
	controller, err = server.NewPacketController(server.Flat)
	if err != nil {
		log.Fatal("Failed to initialize packet controller:", err)
	}
	defer controller.Close()

	// Serve static files from the React build directory
	fs := http.FileServer(http.Dir("./client/build"))
	http.Handle("/", fs)

	// Keep test UI available on /test route
	http.HandleFunc("/test", landingPageHandler)
	http.HandleFunc("/ws", wsHandler)
	updateDisplay()

	err = http.ListenAndServeTLS(":3000", "certs/localhost.pem", "certs/localhost-key.pem", nil)
	if err != nil {
		log.Fatal("Error starting HTTPS server:", err)
	}
}
