import Paper from "@mui/material/Paper";
import Button from "@mui/material/Button";
import MouseIcon from "@mui/icons-material/Mouse";
import Box from "@mui/material/Box";

interface MouseButtonsProps {
  isLeftPressed: boolean;
  isRightPressed: boolean;
  onLeftTouchStart: () => void;
  onLeftTouchEnd: () => void;
  onRightTouchStart: () => void;
  onRightTouchEnd: () => void;
}

export function MouseButtons({
  isLeftPressed,
  isRightPressed,
  onLeftTouchStart,
  onLeftTouchEnd,
  onRightTouchStart,
  onRightTouchEnd
}: MouseButtonsProps) {
  return (
    <Paper square elevation={0} sx={{ p: 2, borderBottom: 1, borderColor: 'divider', bgcolor: 'transparent' }}>
      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, maxWidth: 600, mx: 'auto' }}>
        <Box>
          <Button
            onTouchStart={onLeftTouchStart}
            onTouchEnd={onLeftTouchEnd}
            onTouchCancel={onLeftTouchEnd}
            variant={isLeftPressed ? 'contained' : 'outlined'}
            color={isLeftPressed ? 'success' : 'inherit'}
            fullWidth
            sx={{ height: 160, borderRadius: 4, touchAction: 'none' }}
          >
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, color: 'text.primary' }}>
                <MouseIcon sx={{ fontSize: 40 }} />
                <Box component="span">Left Click</Box>
              </Box>
          </Button>
        </Box>

        <Box>
          <Button
            onTouchStart={onRightTouchStart}
            onTouchEnd={onRightTouchEnd}
            onTouchCancel={onRightTouchEnd}
            variant={isRightPressed ? 'contained' : 'outlined'}
            color={isRightPressed ? 'secondary' : 'inherit'}
            fullWidth
            sx={{ height: 160, borderRadius: 4, touchAction: 'none' }}
          >
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, color: 'text.primary' }}>
                <MouseIcon sx={{ fontSize: 40 }} />
                <Box component="span">Right Click</Box>
              </Box>
          </Button>
        </Box>
      </Box>
    </Paper>
  );
}
