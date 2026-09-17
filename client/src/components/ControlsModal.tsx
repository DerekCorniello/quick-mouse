import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";
import VolumeUpIcon from "@mui/icons-material/VolumeUp";
import VolumeDownIcon from "@mui/icons-material/VolumeDown";
import VolumeOffIcon from "@mui/icons-material/VolumeOff";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";

interface ControlsModalProps {
  open: boolean;
  onClose: () => void;
  hostPlatform: string;
  onKeyPress: (keys: string[]) => void;
  onSwitchWorkspace: (direction: string) => void;
}

const columnButtonSx = {
  flexDirection: "column",
  gap: 0.5,
  py: 1.5,
} as const;

export default function ControlsModal({
  open,
  onClose,
  hostPlatform,
  onKeyPress,
  onSwitchWorkspace,
}: ControlsModalProps) {
  if (!open) return null;

  const workspaceSupported =
    hostPlatform === "wayland" ||
    hostPlatform === "macos" ||
    hostPlatform === "windows";

  return (
    <Box
      sx={(theme) => ({
        border: 1,
        borderColor: theme.palette.primary.main,
        position: "fixed",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        textAlign: "center",
        p: 2,
        bgcolor: "background.paper",
        borderRadius: 3,
        boxShadow: 3,
        zIndex: 1100,
        minWidth: 300,
        width: "min(340px, calc(100vw - 32px))",
      })}
    >
      <IconButton
        onClick={onClose}
        sx={{ position: "absolute", top: 8, right: 8 }}
      >
        <CloseIcon />
      </IconButton>
      <Typography variant="h6" sx={{ mb: 1.5, textAlign: "center" }}>
        Controls
      </Typography>

      <Typography
        sx={{
          mb: 0.5,
          color: "text.secondary",
          fontSize: 13,
          textAlign: "left",
        }}
      >
        Media
      </Typography>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 1,
          mb: workspaceSupported ? 2 : 0,
        }}
      >
        <Button
          variant="outlined"
          color="inherit"
          onClick={() => onKeyPress(["volume_mute"])}
          sx={columnButtonSx}
        >
          <VolumeOffIcon />
          Mute
        </Button>
        <Button
          variant="outlined"
          color="inherit"
          onClick={() => onKeyPress(["volume_down"])}
          sx={columnButtonSx}
        >
          <VolumeDownIcon />
          Down
        </Button>
        <Button
          variant="outlined"
          color="inherit"
          onClick={() => onKeyPress(["volume_up"])}
          sx={columnButtonSx}
        >
          <VolumeUpIcon />
          Up
        </Button>
      </Box>

      {workspaceSupported && (
        <>
          <Typography
            sx={{
              mb: 0.5,
              color: "text.secondary",
              fontSize: 13,
              textAlign: "left",
            }}
          >
            Workspaces
          </Typography>
          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1 }}>
            <Button
              variant="outlined"
              color="inherit"
              onClick={() => onSwitchWorkspace("prev")}
              sx={columnButtonSx}
            >
              <ChevronLeftIcon />
              Previous
            </Button>
            <Button
              variant="outlined"
              color="inherit"
              onClick={() => onSwitchWorkspace("next")}
              sx={columnButtonSx}
            >
              <ChevronRightIcon />
              Next
            </Button>
          </Box>
        </>
      )}
    </Box>
  );
}