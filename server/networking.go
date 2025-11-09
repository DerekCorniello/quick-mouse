package server

// packet types define the different kinds of messages we can send, like mouse movements or clicks
// packets are the actual structs that implement the packet interface and hold the data for each type
// the serializer handles converting packets to bytes for network transmission and back to packets
// when receiving, supporting both json and binary formats. the registry is a map that creates the
// correct packet struct based on the packet type name
//
// flow is:
// 			client sends json with type field,
//			server extracts type,
//			uses registry to create packet instance,
//			unmarshals json data into it,
//			processes the packet,
// 			marshals response back to client.

import (
	"encoding/json"
	"fmt"
)

// PacketType represents the type of network packet
type PacketType string

// NOTE: this is where we add more packets as needed, so we can add more later for
//
//	presentation mode and whatnot
const (
	Auth            PacketType = "auth"
	MouseMove       PacketType = "mouse_move"
	DeviceMotion    PacketType = "device_motion"
	LeftClickUp     PacketType = "left_click_up"
	RightClickUp    PacketType = "right_click_up"
	LeftClickDown   PacketType = "left_click_down"
	RightClickDown  PacketType = "right_click_down"
	ScrollMove      PacketType = "scroll_move"
	KeepAlive       PacketType = "keep_alive"
	Calibration     PacketType = "calibration"
	CalibrationDone PacketType = "calibration_done"
)

// Packet registry for type reconstruction
var packetRegistry = map[PacketType]func() Packet{
	Auth:            func() Packet { return &AuthPacket{} },
	MouseMove:       func() Packet { return &MouseMovePacket{} },
	DeviceMotion:    func() Packet { return &DeviceMotionPacket{} },
	LeftClickUp:     func() Packet { return &LeftClickUpPacket{} },
	RightClickUp:    func() Packet { return &RightClickUpPacket{} },
	LeftClickDown:   func() Packet { return &LeftClickDownPacket{} },
	RightClickDown:  func() Packet { return &RightClickDownPacket{} },
	ScrollMove:      func() Packet { return &ScrollMovePacket{} },
	KeepAlive:       func() Packet { return &KeepAlivePacket{} },
	Calibration:     func() Packet { return &CalibrationPacket{} },
	CalibrationDone: func() Packet { return &CalibrationDonePacket{} },
}

// represents a network packet that can be serialized
type Packet interface {
	Type() PacketType
}

// data packet structs
type AuthPacket struct {
	Key string `json:"key"`
}

func (p AuthPacket) Type() PacketType {
	return Auth
}

type MouseMovePacket struct {
	DeltaX             int32   `json:"x"`
	DeltaY             int32   `json:"y"`
	PointerSensitivity float64 `json:"pointerSensitivity"`
}

func (p MouseMovePacket) Type() PacketType {
	return MouseMove
}

type DeviceMotionPacket struct {
	RotAlpha           float64 `json:"rot_alpha"`
	RotBeta            float64 `json:"rot_beta"`
	RotGamma           float64 `json:"rot_gamma"`
	Timestamp          int64   `json:"timestamp"`
	PointerSensitivity float64 `json:"pointerSensitivity"`
}

func (p DeviceMotionPacket) Type() PacketType {
	return DeviceMotion
}

type ScrollMovePacket struct {
	DeltaX            int32   `json:"x"`
	DeltaY            int32   `json:"y"`
	ScrollSensitivity float64 `json:"scrollSensitivity"`
}

func (p ScrollMovePacket) Type() PacketType {
	return ScrollMove
}

// event packet structs, no additional data needed, these are practically signals
type LeftClickUpPacket struct{}

func (p LeftClickUpPacket) Type() PacketType {
	return LeftClickUp
}

type RightClickUpPacket struct{}

func (p RightClickUpPacket) Type() PacketType {
	return RightClickUp
}

type LeftClickDownPacket struct{}

func (p LeftClickDownPacket) Type() PacketType {
	return LeftClickDown
}

type RightClickDownPacket struct{}

func (p RightClickDownPacket) Type() PacketType {
	return RightClickDown
}

type KeepAlivePacket struct{}

func (p KeepAlivePacket) Type() PacketType {
	return KeepAlive
}

type CalibrationPacket struct {
	RotAlpha  float64 `json:"rot_alpha"`
	RotBeta   float64 `json:"rot_beta"`
	RotGamma  float64 `json:"rot_gamma"`
	Timestamp int64   `json:"timestamp"`
}

func (p CalibrationPacket) Type() PacketType {
	return Calibration
}

type CalibrationDonePacket struct{}

func (p CalibrationDonePacket) Type() PacketType {
	return CalibrationDone
}

// this interface will handle marshaling/unmarshaling packets
// this is how we can switch between json and binary later
type Serializer interface {
	Marshal(p Packet) ([]byte, error)
	Unmarshal(data []byte, packetType PacketType) (Packet, error)
}

// trying to follow go's json serializer stuff here
type JSONSerializer struct{}

func (s JSONSerializer) Marshal(p Packet) ([]byte, error) {
	return json.Marshal(p)
}

func (s JSONSerializer) Unmarshal(data []byte, packetType PacketType) (Packet, error) {
	constructor, exists := packetRegistry[packetType]
	if !exists {
		return nil, fmt.Errorf("unknown packet type: %s", packetType)
	}

	packet := constructor()
	err := json.Unmarshal(data, packet)
	return packet, err
}

// TODO: we will do binary later as needed but here is some scaffolding
type BinarySerializer struct{}

func (s BinarySerializer) Marshal(p Packet) ([]byte, error) {
	return nil, fmt.Errorf("binary serialization not implemented")
}

func (s BinarySerializer) Unmarshal(data []byte, packetType PacketType) (Packet, error) {
	return nil, fmt.Errorf("binary unmarshaling not implemented")
}

// END TODO
