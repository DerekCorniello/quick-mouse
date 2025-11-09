import Paper from "@mui/material/Paper";
import Box from "@mui/material/Box";
import TouchAppIcon from "@mui/icons-material/TouchApp";
import { RefObject } from "react";

interface TouchpadProps {
  touchpadRef: RefObject<HTMLDivElement>;
  touchActive: boolean;
  cursorPosition: { x: number; y: number };
  isLeftPressed: boolean;
  isRightPressed: boolean;
  onTouchStart: (e: React.TouchEvent) => void;
  onTouchMove: (e: React.TouchEvent) => void;
  onTouchEnd: () => void;
  permissionState: "checking" | "prompt" | "requesting" | "granted" | "denied";
}

export function Touchpad({
  touchpadRef,
  touchActive,
  onTouchStart,
  onTouchMove,
  onTouchEnd,
  permissionState,
}: TouchpadProps) {
  return (
    <Paper
      ref={touchpadRef}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onTouchCancel={onTouchEnd}
      elevation={0}
      square
      sx={(theme) => ({
        position: "relative",
        flex: 1,
        minHeight: 200,
        maxHeight: "calc(100vh - 350px)",
        borderRadius: 3,
        border: 2,
        borderColor: theme.palette.primary.main,
        overflow: "hidden",
        bgcolor: "transparent",
        touchAction: "none",
      })}
    >
      {/* Grid Pattern */}
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          opacity: 0.08,
          display: "grid",
          gridTemplateColumns: "repeat(8, 1fr)",
          gridTemplateRows: "repeat(8, 1fr)",
        }}
      >
        {Array.from({ length: 64 }).map((_, i) => (
          <Box
            key={i}
            sx={(theme) => ({
              border: 1,
              borderColor: theme.palette.app?.grid ?? theme.palette.divider,
            })}
          />
        ))}
      </Box>

      {/* Touch Indicator */}
      {touchActive && (
        <Box
          sx={(theme) => ({
            position: "absolute",
            inset: 0,
            bgcolor: theme.palette.app?.indicator ?? "rgba(59,130,246,0.08)",
          })}
        />
      )}

      {/* Instructions */}
      <Box
        sx={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          textAlign: "center",
          pointerEvents: "none",
        }}
      >
        <TouchAppIcon sx={{ fontSize: 64, color: "text.secondary", mb: 1 }} />
        <Box component="p" sx={{ color: "text.secondary" }}>
          {permissionState === "granted"
            ? "One finger to move mouse, two to scroll"
            : "Waiting for permissions..."}
        </Box>
      </Box>
    </Paper>
  );
}
