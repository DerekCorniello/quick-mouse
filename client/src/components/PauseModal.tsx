import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import PauseIcon from "@mui/icons-material/Pause";
import { useTheme } from "@mui/material/styles";

interface PauseModalProps {
  open: boolean;
  onClose: () => void;
}

export default function PauseModal({ open, onClose }: PauseModalProps) {
  const theme = useTheme();
  return (
    <Dialog
      open={open}
      maxWidth="sm"
      fullWidth
      disableEscapeKeyDown={true}
      BackdropProps={{ style: { pointerEvents: "none" } }}
      sx={{
        "& .MuiDialog-paper": {
          background: theme.app.background.gradient,
          border: 1,
          borderColor: "divider",
          borderRadius: 3,
          boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
        },
      }}
    >
      <DialogTitle
        sx={{
          color: "text.primary",
          borderBottom: 1,
          borderColor: "divider",
          pb: 2,
          display: "flex",
          alignItems: "center",
          gap: 1,
        }}
      >
        <PauseIcon />
        Data Transmission Paused
      </DialogTitle>
      <DialogContent sx={{ p: 3 }}>
        <Typography sx={{ color: "text.secondary" }}>
          Mouse control data is currently paused. The connection remains active.
          Click Resume to continue sending data.
        </Typography>
      </DialogContent>
      <DialogActions sx={{ p: 3, pt: 0 }}>
        <Button onClick={onClose} variant="contained" color="primary" fullWidth>
          Resume
        </Button>
      </DialogActions>
    </Dialog>
  );
}
