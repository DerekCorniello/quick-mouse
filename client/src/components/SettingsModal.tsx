import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import Button from "@mui/material/Button";
import { SensitivityControl } from "./SensitivityControl";

interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
  pointerSensitivity: number;
  scrollSensitivity: number;
  onPointerSensitivityChange: (value: number) => void;
  onScrollSensitivityChange: (value: number) => void;
  showSensorLog: boolean;
  onToggleSensorLog: () => void;
  buttonsAboveTouchpad: boolean;
  onToggleButtonPosition: () => void;
  isTable: boolean;
  onToggleIsTable: () => void;
  naturalScroll: boolean;
  onToggleNaturalScroll: () => void;
  onToggleSwapLeftRightClick: () => void;
}

export default function SettingsModal({
  open,
  onClose,
  pointerSensitivity,
  scrollSensitivity,
  onPointerSensitivityChange,
  onScrollSensitivityChange,
  showSensorLog,
  onToggleSensorLog,
  buttonsAboveTouchpad,
  onToggleButtonPosition,
  isTable,
  onToggleIsTable,
  naturalScroll,
  onToggleNaturalScroll,
  onToggleSwapLeftRightClick,
}: SettingsModalProps) {
  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="sm"
        fullWidth
        sx={{
          "& .MuiDialog-paper": {
            background: "linear-gradient(180deg, #0f1720 0%, #111827 100%)",
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
          }}
        >
          Settings
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <SensitivityControl
            title="Pointer Sensitivity"
            sensitivity={pointerSensitivity}
            onSensitivityChange={onPointerSensitivityChange}
          />
          <SensitivityControl
            title="Scroll Sensitivity"
            sensitivity={scrollSensitivity}
            onSensitivityChange={onScrollSensitivityChange}
          />
          <Button
            variant="outlined"
            onClick={onToggleSensorLog}
            sx={{ mt: 2 }}
          >
            {showSensorLog ? "Hide Sensor Log" : "Show Sensor Log"}
          </Button>
          <Button
            variant="outlined"
            onClick={onToggleButtonPosition}
            sx={{ mt: 1 }}
          >
            {buttonsAboveTouchpad ? "Move Buttons Below Touchpad" : "Move Buttons Above Touchpad"}
          </Button>
          <Button
            variant="outlined"
            onClick={onToggleIsTable}
            sx={{ mt: 1 }}
          >
            {isTable ? "Switch to Handheld Mode" : "Switch to Table Mode"}
          </Button>
          <Button
            variant="outlined"
            onClick={onToggleNaturalScroll}
            sx={{ mt: 1 }}
          >
            {naturalScroll ? "Switch to Reverse Scroll" : "Switch to Natural Scroll"}
          </Button>
          <Button
            variant="outlined"
            onClick={onToggleSwapLeftRightClick}
            sx={{ mt: 1 }}
          >
            Swap Left/Right Click
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}
