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
}

export function Touchpad({
  touchpadRef,
  touchActive,
  cursorPosition,
  isLeftPressed,
  isRightPressed,
  onTouchStart,
  onTouchMove,
  onTouchEnd,
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
        position: 'relative',
        flex: 1,
        borderRadius: 3,
        border: 2,
        borderColor: touchActive ? theme.palette.app?.cursor?.default?.border ?? theme.palette.primary.main : theme.palette.divider,
        overflow: 'hidden',
        bgcolor: 'transparent',
        touchAction: 'none',
      })}
    >
      {/* Grid Pattern */}
      <Box sx={{ position: 'absolute', inset: 0, opacity: 0.08, display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gridTemplateRows: 'repeat(8, 1fr)' }}>
        {Array.from({ length: 64 }).map((_, i) => (
          <Box key={i} sx={(theme) => ({ border: 1, borderColor: theme.palette.app?.grid ?? theme.palette.divider })} />
        ))}
      </Box>

      {/* Touch Indicator */}
      {touchActive && (
        <Box sx={(theme) => ({ position: 'absolute', inset: 0, bgcolor: theme.palette.app?.indicator ?? 'rgba(59,130,246,0.08)' })} />
      )}

      {/* Cursor Position Indicator */}
      <Box
        sx={{ position: 'absolute', width: 48, height: 48, transition: 'all 75ms' }}
        style={{ left: `${cursorPosition.x}%`, top: `${cursorPosition.y}%`, transform: 'translate(-50%, -50%)' }}
      >
        <Box
          sx={(theme) => ({
            width: '100%',
            height: '100%',
            borderRadius: '50%',
            border: 3,
            bgcolor: isLeftPressed
              ? theme.palette.app?.cursor?.left?.bg ?? theme.palette.success.main
              : isRightPressed
              ? theme.palette.app?.cursor?.right?.bg ?? theme.palette.secondary.main
              : theme.palette.app?.cursor?.default?.bg ?? theme.palette.primary.main,
            borderColor: isLeftPressed
              ? theme.palette.app?.cursor?.left?.border ?? theme.palette.success.dark
              : isRightPressed
              ? theme.palette.app?.cursor?.right?.border ?? theme.palette.secondary.dark
              : theme.palette.app?.cursor?.default?.border ?? theme.palette.primary.dark,
          })}
        />
      </Box>

      {/* Instructions */}
      <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center', pointerEvents: 'none' }}>
        <TouchAppIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 1 }} />
        <Box component="p" sx={{ color: 'text.secondary' }}>Slide to move cursor</Box>
      </Box>
    </Paper>
  );
}
