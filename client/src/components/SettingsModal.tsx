import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import FormControlLabel from "@mui/material/FormControlLabel";
import Switch from "@mui/material/Switch";
import { SensitivityControl } from "./SensitivityControl";

export default function SettingsModal({
  open,
  onClose,
  sensitivity,
  onSensitivityChange,
  showSensorLog,
  onToggleSensorLog,
  buttonsAboveTouchpad,
  onToggleButtonPosition,
}: {
  open: boolean;
  onClose: () => void;
  sensitivity: number;
  onSensitivityChange: (value: number) => void;
  showSensorLog: boolean;
  onToggleSensorLog: () => void;
  buttonsAboveTouchpad: boolean;
  onToggleButtonPosition: () => void;
}) {
  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
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
          }}
        >
          Settings
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <SensitivityControl
            sensitivity={sensitivity}
            onSensitivityChange={onSensitivityChange}
          />
          <FormControlLabel
            control={
              <Switch
                checked={showSensorLog}
                onChange={onToggleSensorLog}
                color="primary"
              />
            }
            label="Show Sensor Log"
            sx={{ mt: 2 }}
          />
          <FormControlLabel
            control={
              <Switch
                checked={buttonsAboveTouchpad}
                onChange={onToggleButtonPosition}
                color="primary"
              />
            }
            label="Buttons Above Touchpad"
            sx={{ mt: 1 }}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
