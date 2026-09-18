# AGENTS.md

## What this is

Phone-as-mouse over WebSocket (QR-pairing). A Go monolith (`main.go` at repo root) runs the WebSocket backend AND serves the built React client. Hackathon project; code is pragmatic, keep it that way.

## Build & run

Repeat this worker-loop for any backend OR client change:

```bash
go build -o quick-mouse
cd client && npm install && npm run build && cd ..
./quick-mouse            # optional: -port <1024-65534>, -log
```

- The binary serves `./client/build`, so after editing `client/src` you MUST run `npm run build` and restart the binary, or the changes won't appear. Build output dir is `build`, not `dist` (see `client/vite.config.ts`).
- The server requires self-signed TLS certs at `certs/localhost.pem` + `certs/localhost-key.pem` (gitignored) or it fails at startup. Generate once (the SAN is mandatory — phone browsers ignore `CN`, so a localhost-only cert makes the QR's LAN URL fail):
  `openssl req -x509 -newkey rsa:4096 -keyout certs/localhost-key.pem -out certs/localhost.pem -days 365 -nodes -subj "/CN=localhost" -addext "subjectAltName=DNS:localhost,IP:127.0.0.1,IP:<lan-ip>"`
- `setup.sh` / `setup.bat` do the above for users. Don't break that contract.
- Port: default 3000. If `-port` flag is given it's persisted to `config.json`; otherwise `config.json` `lastPort` is used. Client always connects via `window.location.host`.

## Architecture

- `main.go` — HTTP server, WebSocket handler, auth, config load/save, terminal UI (alternate screen + QR code printed on stdout). Config (`pointerSensitivity`, etc.) lives server-side in `config.json` (gitignored, created on first run). Sent to client via `config_sync` on connect; client echoes changes back as `config_update`, handled in `wsHandler`, NOT the controller. The client intentionally has no config defaults — it waits for `config_sync` before rendering.
- `server/networking.go` — packet protocol. Packet type constants, structs, and the `packetRegistry` map (type name → constructor) used by `JSONSerializer` to rebuild packets from JSON. A `Serializer` interface exists to allow future binary encoding — keep new packets in the registry.
- `server/controller.go` — `PacketController.ProcessPacket` switch maps packets to mouse actions; also owns the handheld-mode physics loop (~60fps velocity integration) and calibration baselines.
- `server/mouse_backends.go` + build-tagged files — backend selection: `DetectDisplayServer()` picks uinput on Wayland (`mouse_backends_linux.go`, build tag `linux`), robotgo on X11/Windows/macOS (`mouse_backends_nonlinux.go` provides the no-op `newWaylandMouse` stub).
- `client/src/App.tsx` — WS connect+auth, deviceorientation listeners, config state; components in `client/src/components/`, touch math in `touchHandlers.ts`.
- `manifest.json`, `Panel.qml`, `Model.js`, `bin/omarchy-quick-mouse` — the Omarchy bar-widget plugin, at the repo root (the marketplace requires the manifest at the repo root, so the plugin is published straight from this repo via `omarchy plugin add https://github.com/DerekCorniello/quick-mouse.git`). `Panel.qml` resolves its script and `Model.js` relative to itself; the script self-detects `QM_DIR` as its own checkout (the plugin repo *is* the project) and builds/fetches only if assets are missing. The pane/render details are load-bearing — see the QR quiet-zone and Nerd Font notes below.

## Adding a new packet type

Four touchpoints — missing any breaks it:
1. `server/networking.go`: new `PacketType` const
2. `server/networking.go`: packet struct + `Type()` method
3. `server/networking.go`: entry in `packetRegistry`
4. `server/controller.go`: case in `ProcessPacket` (unless it's config-related; config packets are handled in `main.go`'s `wsHandler`)

## WebSocket protocol

- URL: `wss://<lan-ip>:<port>/?key=<authKey>`. The QR code and the auth key are regenerated each server start; the wrong key closes the connection. `CheckOrigin` allows all origins (access control is the key).
- First message MUST be an `auth` packet; auth is required before anything else.
- Keep-alive is sent every 25s if no client activity (prevents WS idle timeouts). `?key=` in the URL, not `config_key` — don't rename casually: it's matched in both `main.go` QR URL and `App.tsx` `URLSearchParams`.

## Linux/Wayland gotchas

The uinput backend needs `/dev/uinput` (`sudo modprobe uinput`) and your user in the `input` group, or `NewPacketController` fails with a message pointing at exactly that. `MoveTo` / `GetPosition` are NOT supported on Wayland (errors at runtime).

## Client checks

```bash
cd client
npm run lint             # eslint src --ext .ts,.tsx
npm run typecheck        # tsc --noEmit
```

`npm run dev` (vite, `--host`, https) is fine for isolated UI tinkering but does NOT proxy `/ws`, so end-to-end testing requires building and running the Go binary. There is a built-in test client at `https://<ip>:<port>/test` (embedded HTML in `main.go`) to exercise WebSocket packets without a phone.

## Notes

- A host firewall can silently break phone pairing: with `ufw` enabled (`DEFAULT_INPUT_POLICY=DROP`), a connection to a port with no allow rule is DROPPED, so the phone hangs on a blank page. Only the project default 3000 (`ufw allow 3000/tcp`) is typically permitted — a custom `-port` needs its own rule.
- No test suite exists (no `*_test.go`, no CI, no test scripts). Verification = `go build` + the client lint/typecheck above + manual run.
- Go module is `quick-mouse`, Go 1.25.4. Dependencies: gorilla/websocket, robotgo, bendahl/uinput (linux), mdp/qrterminal, rsc.io/qr.