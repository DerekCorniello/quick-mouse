import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import PauseIcon from "@mui/icons-material/Pause";

interface PauseModalProps {
  open: boolean;
  onClose: () => void;
}

export default function PauseModal({ open, onClose }: PauseModalProps) {
  if (!open) return null;
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
        p: 4,
        bgcolor: "background.paper",
        borderRadius: 3,
        boxShadow: 3,
        zIndex: 1000,
        minWidth: 300,
      })}
    >
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 1, mb: 2 }}>
        <PauseIcon />
        <Typography variant="h6">Data Transmission Paused</Typography>
      </Box>
      <Typography sx={{ mb: 3, color: "text.secondary" }}>
        Mouse control data is currently paused. The connection remains active.
        Click Resume to continue sending data.
      </Typography>
      <Button onClick={onClose} variant="contained" color="primary" fullWidth>
        Resume
      </Button>
    </Box>
  );
}
