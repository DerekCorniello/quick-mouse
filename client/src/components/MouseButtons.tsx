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
  swapLeftRightClick: boolean;
}

export function MouseButtons({
  isLeftPressed,
  isRightPressed,
  onLeftTouchStart,
  onLeftTouchEnd,
  onRightTouchStart,
  onRightTouchEnd,
  swapLeftRightClick,
}: MouseButtonsProps) {
  return (
    <Paper
      square
      elevation={0}
      sx={{
        p: 0.5,
        borderBottom: 1,
        borderColor: "divider",
        bgcolor: "transparent",
      }}
    >
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 1,
          maxWidth: 600,
          mx: "auto",
        }}
      >
        <Box>
          <Button
            onTouchStart={onLeftTouchStart}
            onTouchEnd={onLeftTouchEnd}
            onTouchCancel={onLeftTouchEnd}
            variant={isLeftPressed ? "contained" : "outlined"}
            color={isLeftPressed ? "success" : "inherit"}
            fullWidth
            sx={(theme) => ({
              border: 1,
              height: 160,
              borderRadius: 4,
              touchAction: "none",
              borderColor: theme.palette.primary.main,
            })}
          >
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 1,
                color: "text.primary",
              }}
            >
              <MouseIcon sx={{ fontSize: 40 }} />
              <Box component="span">
                {swapLeftRightClick ? "Right Click" : "Left Click"}
              </Box>
            </Box>
          </Button>
        </Box>

        <Box>
          <Button
            onTouchStart={onRightTouchStart}
            onTouchEnd={onRightTouchEnd}
            onTouchCancel={onRightTouchEnd}
            variant={isRightPressed ? "contained" : "outlined"}
            color={isRightPressed ? "secondary" : "inherit"}
            fullWidth
            sx={(theme) => ({
              border: 1,
              height: 160,
              borderRadius: 4,
              touchAction: "none",
              borderColor: theme.palette.primary.main,
            })}
          >
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 1,
                color: "text.primary",
              }}
            >
              <MouseIcon sx={{ fontSize: 40 }} />
              <Box component="span">
                {swapLeftRightClick ? "Left Click" : "Right Click"}
              </Box>
            </Box>
          </Button>
        </Box>
      </Box>
    </Paper>
  );
}
