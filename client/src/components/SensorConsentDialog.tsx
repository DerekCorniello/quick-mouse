
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import SensorsIcon from "@mui/icons-material/Sensors";
import TouchAppIcon from "@mui/icons-material/TouchApp";
import MouseIcon from "@mui/icons-material/Mouse";

interface SensorConsentDialogProps {
  open: boolean;
  onAccept: () => void;
  onDecline: () => void;
}

export function SensorConsentDialog({ open, onAccept, onDecline }: SensorConsentDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={() => {}} // Prevent closing without explicit action
      maxWidth="sm"
      fullWidth
      sx={{
        '& .MuiDialog-paper': {
          background: 'linear-gradient(180deg, #0f1720 0%, #111827 100%)',
          border: 1,
          borderColor: 'divider',
          borderRadius: 3,
          boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
        },
      }}
    >
      <DialogTitle
        sx={{
          color: 'text.primary',
          borderBottom: 1,
          borderColor: 'divider',
          pb: 2,
          textAlign: 'center',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 1 }}>
          <SensorsIcon sx={{ fontSize: 28 }} />
          <Typography variant="h5">Sensor Data Consent</Typography>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        <Typography variant="body1" color="text.primary" sx={{ mb: 3 }}>
          This application requires access to your device&apos;s sensors to provide mouse control functionality:
        </Typography>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <SensorsIcon sx={{ color: 'primary.main', fontSize: 24 }} />
            <Box>
              <Typography variant="subtitle2" color="text.primary">Device Motion Sensors</Typography>
              <Typography variant="body2" color="text.secondary">
                Accelerometer and gyroscope data to control mouse cursor movement
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <TouchAppIcon sx={{ color: 'primary.main', fontSize: 24 }} />
            <Box>
              <Typography variant="subtitle2" color="text.primary">Touch Input</Typography>
              <Typography variant="body2" color="text.secondary">
                Touch gestures on the interface for scrolling and clicking
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <MouseIcon sx={{ color: 'primary.main', fontSize: 24 }} />
            <Box>
              <Typography variant="subtitle2" color="text.primary">Mouse Control</Typography>
              <Typography variant="body2" color="text.secondary">
                Remote control of computer mouse and keyboard functions
              </Typography>
            </Box>
          </Box>
        </Box>

        <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
          Your sensor data is processed locally on your device and only mouse control commands are sent to the server.
          No personal data is collected or stored.
        </Typography>
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 0, gap: 2 }}>
        <Button
          onClick={onDecline}
          variant="outlined"
          color="inherit"
          fullWidth
          sx={{ borderRadius: 2 }}
        >
          Decline
        </Button>
        <Button
          onClick={onAccept}
          variant="contained"
          color="primary"
          fullWidth
          sx={{ borderRadius: 2 }}
        >
          Accept & Continue
        </Button>
      </DialogActions>
    </Dialog>
  );
}