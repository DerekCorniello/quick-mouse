import React from "react";

type Packet = {
  type: string;
  [key: string]: unknown;
};

export const handleTouchStart = (
  e: React.TouchEvent,
  appPhase: string,
  initialTouchesRef: React.MutableRefObject<{ id: number; x: number; y: number }[]>,
  setTouchActive: (active: boolean) => void
) => {
  e.preventDefault();
  if (appPhase !== "main") return;

  initialTouchesRef.current = Array.from(e.touches).map((touch) => ({
    id: touch.identifier,
    x: touch.clientX,
    y: touch.clientY,
  }));
  setTouchActive(true);
};

export const handleTouchMove = (
  e: React.TouchEvent,
  initialTouchesRef: React.MutableRefObject<{ id: number; x: number; y: number }[]>,
  sendPacket: (packet: Packet) => void,
  pointerSensitivityRef: React.MutableRefObject<number>,
  scrollSensitivityRef: React.MutableRefObject<number>
) => {
  e.preventDefault();
  const currentTouches = Array.from(e.touches);

  if (currentTouches.length === 1) {
    // Mouse control
    const touch = currentTouches[0];
    const initial = initialTouchesRef.current.find(
      (t) => t.id === touch.identifier,
    );
    if (!initial) return;

    const rawDeltaX = touch.clientX - initial.x;
    const rawDeltaY = touch.clientY - initial.y;

    if (!Number.isFinite(rawDeltaX) || !Number.isFinite(rawDeltaY)) {
      console.error("Invalid touch delta values");
      return;
    }

    sendPacket({
      type: "mouse_move",
      x: Math.round(rawDeltaX),
      y: Math.round(rawDeltaY),
      pointerSensitivity: pointerSensitivityRef.current,
    });
  } else if (currentTouches.length >= 2) {
    // Scroll
    const touch = currentTouches[0];
    const initial = initialTouchesRef.current.find(
      (t) => t.id === touch.identifier,
    );
    if (!initial) return;

    const rawDeltaX = touch.clientX - initial.x;
    const rawDeltaY = touch.clientY - initial.y;

    if (!Number.isFinite(rawDeltaX) || !Number.isFinite(rawDeltaY)) {
      console.error("Invalid touch delta values");
      return;
    }

    const SCROLL_THRESHOLD = 3;
    if (
      Math.abs(rawDeltaX) > SCROLL_THRESHOLD ||
      Math.abs(rawDeltaY) > SCROLL_THRESHOLD
    ) {
      sendPacket({
        type: "scroll_move",
        x: Math.round(rawDeltaX),
        y: Math.round(rawDeltaY),
        scrollSensitivity: scrollSensitivityRef.current,
      });
    }
  }
};

export const handleTouchEnd = (
  initialTouchesRef: React.MutableRefObject<{ id: number; x: number; y: number }[]>,
  setTouchActive: (active: boolean) => void,
  setSwipeDirection: (direction: string) => void,
  setSwipeMagnitude: (magnitude: number) => void
) => {
  initialTouchesRef.current = [];
  setTouchActive(false);
  setSwipeDirection("None");
  setSwipeMagnitude(0);
};

export const handleLeftTouchStart = (
  appPhase: string,
  setIsLeftPressed: (pressed: boolean) => void,
  sendPacket: (packet: Packet) => void,
  swapLeftRightClick: boolean
) => {
  if (appPhase !== "main") return;
  setIsLeftPressed(true);
  sendPacket({
    type: swapLeftRightClick ? "right_click_down" : "left_click_down",
  });
};

export const handleLeftTouchEnd = (
  appPhase: string,
  setIsLeftPressed: (pressed: boolean) => void,
  sendPacket: (packet: Packet) => void,
  swapLeftRightClick: boolean
) => {
  if (appPhase !== "main") return;
  setIsLeftPressed(false);
  sendPacket({
    type: swapLeftRightClick ? "right_click_up" : "left_click_up",
  });
};

export const handleRightTouchStart = (
  appPhase: string,
  setIsRightPressed: (pressed: boolean) => void,
  sendPacket: (packet: Packet) => void,
  swapLeftRightClick: boolean
) => {
  if (appPhase !== "main") return;
  setIsRightPressed(true);
  sendPacket({
    type: swapLeftRightClick ? "left_click_down" : "right_click_down",
  });
};

export const handleRightTouchEnd = (
  appPhase: string,
  setIsRightPressed: (pressed: boolean) => void,
  sendPacket: (packet: Packet) => void,
  swapLeftRightClick: boolean
) => {
  if (appPhase !== "main") return;
  setIsRightPressed(false);
  sendPacket({
    type: swapLeftRightClick ? "left_click_up" : "right_click_up",
  });
};