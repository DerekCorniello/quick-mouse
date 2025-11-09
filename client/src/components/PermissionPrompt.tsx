
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import CircularProgress from "@mui/material/CircularProgress";
import SensorsIcon from "@mui/icons-material/Sensors";

interface PermissionPromptProps {
  onRequestPermissions: () => void;
  isRequesting: boolean;
}

export function PermissionPrompt({ onRequestPermissions, isRequesting }: PermissionPromptProps) {
  if (isRequesting) {
    return (
      <Box sx={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        textAlign: 'center',
        p: 4,
        bgcolor: 'background.paper',
        borderRadius: 3,
        boxShadow: 3,
        zIndex: 1000,
        minWidth: 300
      }}>
        <CircularProgress size={48} sx={{ mb: 2 }} />
        <Typography variant="h6" sx={{ mb: 1 }}>
          Requesting Permissions
        </Typography>
        <Typography color="text.secondary">
          Please grant device motion access when prompted by your browser.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      textAlign: 'center',
      p: 4,
      bgcolor: 'background.paper',
      borderRadius: 3,
      boxShadow: 3,
      zIndex: 1000,
      minWidth: 350
    }}>
      <SensorsIcon sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
      <Typography variant="h5" sx={{ mb: 2 }}>
        Device Motion Control
      </Typography>
      <Typography sx={{ mb: 3, color: 'text.secondary', lineHeight: 1.6 }}>
        This app uses your device&apos;s motion sensors to control the mouse cursor.
        Your device movements will move the cursor, and touch gestures will scroll content.
      </Typography>
      <Typography variant="body2" sx={{ mb: 3, color: 'text.secondary', fontStyle: 'italic' }}>
        No personal data is collected - sensor data stays on your device.
      </Typography>
      <Button
        variant="contained"
        size="large"
        onClick={onRequestPermissions}
        sx={{ px: 4, py: 1.5 }}
      >
        Enable Motion Control
      </Button>
    </Box>
  );
}