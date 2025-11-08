package main

import (
	"fmt"
	"log"
	"net"
	"net/http"
	"os"

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

// generates and displays a QR code for creating the connection from phone to pc
func displayQR(port string) {
	localIP := getLocalIP()
	httpURL := fmt.Sprintf("http://%s%s/", localIP, port)

	fmt.Println("\nScan this QR code to access the WebSocket client:")
	qrterminal.Generate(httpURL, qrterminal.L, os.Stdout)
	fmt.Printf("\nLanding page URL: %s\n\n", httpURL)
}

// landingPageHandler serves an HTML page with a WebSocket client
func landingPageHandler(w http.ResponseWriter, r *http.Request) {
	localIP := getLocalIP()
	wsURL := fmt.Sprintf("ws://%s:3000/ws", localIP)

	html := fmt.Sprintf(`<!DOCTYPE html>
<html>
<head>
    <title>WebSocket Test Client</title>
</head>
<body>
    <h1>WebSocket Echo Client</h1>
    <p>WebSocket URL: %s</p>
    <div>
        <input type="text" id="messageInput" placeholder="Enter message" />
        <button onclick="sendMessage()">Send</button>
    </div>
    <div>
        <button onclick="connect()">Connect</button>
        <button onclick="disconnect()">Disconnect</button>
    </div>
    <div id="status">Disconnected</div>
    <div id="messages"></div>

    <script>
        let socket;
        const statusDiv = document.getElementById('status');
        const messagesDiv = document.getElementById('messages');

        function connect() {
            socket = new WebSocket('%s');

            socket.onopen = function(event) {
                statusDiv.textContent = 'Connected';
                messagesDiv.innerHTML += '<p>Connected to WebSocket</p>';
            };

            socket.onmessage = function(event) {
                messagesDiv.innerHTML += '<p>Received: ' + event.data + '</p>';
            };

            socket.onclose = function(event) {
                statusDiv.textContent = 'Disconnected';
                messagesDiv.innerHTML += '<p>Disconnected</p>';
            };

            socket.onerror = function(error) {
                statusDiv.textContent = 'Error';
                messagesDiv.innerHTML += '<p>Error: ' + error + '</p>';
            };
        }

        function disconnect() {
            if (socket) {
                socket.close();
            }
        }

        function sendMessage() {
            const message = document.getElementById('messageInput').value;
            if (socket && socket.readyState === WebSocket.OPEN) {
                socket.send(message);
                messagesDiv.innerHTML += '<p>Sent: ' + message + '</p>';
                document.getElementById('messageInput').value = '';
            } else {
                messagesDiv.innerHTML += '<p>Not connected</p>';
            }
        }

        // Allow sending with Enter key
        document.getElementById('messageInput').addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                sendMessage();
            }
        });
    </script>
</body>
</html>`, wsURL, wsURL)

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

func wsHandler(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println("Error upgrading connection:", err)
		return
	}
	defer conn.Close()

	for {
		mt, message, err := conn.ReadMessage()
		if err != nil {
			log.Println("Error reading message:", err)
			break
		}
		fmt.Printf("Received: %s\n", message)

		err = conn.WriteMessage(mt, message)
		if err != nil {
			log.Println("Error writing message:", err)
			break
		}
	}
}

func main() {
	http.HandleFunc("/", landingPageHandler)
	http.HandleFunc("/ws", wsHandler)
	displayQR(":3000")
	fmt.Println("WebSocket server started on :3000")
	err := http.ListenAndServe(":3000", nil)
	if err != nil {
		log.Fatal("Error starting server:", err)
	}
}
