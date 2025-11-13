import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";
import { SensitivityControl } from "./SensitivityControl";

interface SettingsModalProps {
   open: boolean;
   onClose: () => void;
   pointerSensitivity: number;
   handheldSensitivity: number;
   scrollSensitivity: number;
   onPointerSensitivityChange: (value: number) => void;
   onHandheldSensitivityChange: (value: number) => void;
   onScrollSensitivityChange: (value: number) => void;
  showSensorLog: boolean;
  onToggleSensorLog: () => void;
  buttonsAboveTouchpad: boolean;
  onToggleButtonPosition: () => void;
  naturalScroll: boolean;
  onToggleNaturalScroll: () => void;
  onToggleSwapLeftRightClick: () => void;
  onRecalibrate: () => void;
}

export default function SettingsModal({
   open,
   onClose,
   pointerSensitivity,
   handheldSensitivity,
   scrollSensitivity,
   onPointerSensitivityChange,
   onHandheldSensitivityChange,
   onScrollSensitivityChange,
  showSensorLog,
  onToggleSensorLog,
  buttonsAboveTouchpad,
  onToggleButtonPosition,
  naturalScroll,
  onToggleNaturalScroll,
  onToggleSwapLeftRightClick,
  onRecalibrate,
}: SettingsModalProps) {
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
         zIndex: 1100,
        minWidth: 300,
      })}
    >
      <IconButton
        onClick={onClose}
        sx={{ position: "absolute", top: 8, right: 8 }}
      >
        <CloseIcon />
      </IconButton>
      <Typography variant="h5" sx={{ mb: 3 }}>
        Settings
      </Typography>
       <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
         <SensitivityControl
           title="Touchpad Sensitivity"
           sensitivity={pointerSensitivity}
           onSensitivityChange={onPointerSensitivityChange}
         />
         <SensitivityControl
           title="Handheld Sensitivity"
           sensitivity={handheldSensitivity}
           onSensitivityChange={onHandheldSensitivityChange}
         />
         <SensitivityControl
           title="Scroll Sensitivity"
           sensitivity={scrollSensitivity}
           onSensitivityChange={onScrollSensitivityChange}
         />
        <Button variant="outlined" onClick={onToggleSensorLog} fullWidth>
          {showSensorLog ? "Hide Sensor Log" : "Show Sensor Log"}
        </Button>
        <Button variant="outlined" onClick={onToggleButtonPosition} fullWidth>
          {buttonsAboveTouchpad
            ? "Move Buttons Below Touchpad"
            : "Move Buttons Above Touchpad"}
        </Button>
        <Button variant="outlined" onClick={onToggleNaturalScroll} fullWidth>
          {naturalScroll
            ? "Switch to Reverse Scroll"
            : "Switch to Natural Scroll"}
        </Button>
        <Button variant="outlined" onClick={onToggleSwapLeftRightClick} fullWidth>
          Swap Left/Right Click
        </Button>
        <Button
          variant="outlined"
          onClick={() => {
            onRecalibrate();
            onClose();
          }}
          fullWidth
        >
          Recalibrate Motion Sensors
        </Button>
      </Box>
    </Box>
  );
}
