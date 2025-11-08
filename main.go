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

	"github.com/gorilla/websocket"
	"github.com/mdp/qrterminal/v3"
	"quick-mouse/server"
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

// generates and displays a QR code for creating the connection from phone to pc
func displayQR(port string) {
	localIP := getLocalIP()
	httpURL := fmt.Sprintf("http://%s%s/?key=%s", localIP, port, url.QueryEscape(authKey))

	fmt.Println("\nScan this QR code to access the WebSocket client:")
	qrterminal.Generate(httpURL, qrterminal.L, os.Stdout)
	fmt.Printf("\nLanding page URL: %s\n\n", httpURL)
}

// landingPageHandler serves an HTML page with a WebSocket test client
func landingPageHandler(w http.ResponseWriter, r *http.Request) {
	localIP := getLocalIP()
	wsURL := fmt.Sprintf("ws://%s:3000/ws", localIP)
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
        <button onclick="sendPacket('keep_alive')">Keep Alive</button>
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
                statusDiv.textContent = 'Connected - Authenticating...';
                statusDiv.className = 'status connected';
                addMessage('Connected to WebSocket - sending auth');
                // Send auth packet immediately
                const authPacket = { type: 'auth', key: key };
                sendJSON(authPacket);
            };

            socket.onmessage = function(event) {
                const data = JSON.parse(event.data);
                if (data.status === 'ok') {
                    statusDiv.textContent = 'Authenticated';
                    addMessage('Authentication successful');
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

var serializer server.Serializer = server.JSONSerializer{}
var controller *server.PacketController
var authKey string

func wsHandler(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println("Error upgrading connection:", err)
		return
	}
	defer conn.Close()

	// Require authentication first
	mt, message, err := conn.ReadMessage()
	if err != nil {
		log.Println("Error reading first message:", err)
		return
	}
	fmt.Printf("Received first message: %s\n", message)

	// Parse as auth packet
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

	// Unmarshal auth packet
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

	// Authentication successful, send ack
	ack := map[string]string{"status": "ok"}
	response, err := json.Marshal(ack)
	if err != nil {
		log.Println("Error marshaling auth ack:", err)
		return
	}
	err = conn.WriteMessage(mt, response)
	if err != nil {
		log.Println("Error sending auth ack:", err)
		return
	}

	log.Println("Client authenticated successfully")

	// Now process other packets
	for {
		mt, message, err := conn.ReadMessage()
		if err != nil {
			log.Println("Error reading message:", err)
			break
		}
		fmt.Printf("Received: %s\n", message)

		// Parse packet type from JSON
		if err := json.Unmarshal(message, &envelope); err != nil {
			log.Println("Error parsing JSON:", err)
			continue
		}
		if envelope.Type == "" {
			log.Println("Missing or invalid type field")
			continue
		}
		packetType := envelope.Type

		// Skip auth packets if sent again
		if packetType == server.Auth {
			continue
		}

		// Unmarshal the packet
		packet, err := serializer.Unmarshal(message, packetType)
		if err != nil {
			log.Println("Error unmarshaling packet:", err)
			continue
		}

		// Process the packet
		if err := controller.ProcessPacket(packet); err != nil {
			log.Println("Error processing packet:", err)
			continue
		}

		// Send acknowledgment
		response, err := json.Marshal(ack)
		if err != nil {
			log.Println("Error marshaling acknowledgment:", err)
			continue
		}

		err = conn.WriteMessage(mt, response)
		if err != nil {
			log.Println("Error writing acknowledgment:", err)
			break
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
	// Generate authentication key
	authKey = generateAuthKey()

	// Initialize packet controller with default flat mode
	var err error
	controller, err = server.NewPacketController(server.Flat)
	if err != nil {
		log.Fatal("Failed to initialize packet controller:", err)
	}
	defer controller.Close()

	http.HandleFunc("/", landingPageHandler)
	http.HandleFunc("/ws", wsHandler)
	displayQR(":3000")
	fmt.Println("WebSocket server started on :3000")
	err = http.ListenAndServe(":3000", nil)
	if err != nil {
		log.Fatal("Error starting server:", err)
	}
}
