import AppBar from "@mui/material/AppBar";
import { useState } from "react";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import SettingsIcon from "@mui/icons-material/Settings";
import MouseIcon from "@mui/icons-material/Mouse";
import SettingsModal from "./SettingsModal";

export function Header({
  sensitivity,
  onSensitivityChange,
  showSensorLog,
  onToggleSensorLog,
  buttonsAboveTouchpad,
  onToggleButtonPosition,
  isTable,
  onToggleIsTable,
}: {
  sensitivity: number;
  onSensitivityChange: (value: number) => void;
  showSensorLog: boolean;
  onToggleSensorLog: () => void;
  buttonsAboveTouchpad: boolean;
  onToggleButtonPosition: () => void;
  isTable: boolean;
  onToggleIsTable: () => void;
}) {
  const [settingsOpen, setSettingsOpen] = useState(false);

  const handleSettingsOpen = () => {
    setSettingsOpen(true);
  };

  const handleSettingsClose = () => {
    setSettingsOpen(false);
  };

  return (
    <AppBar
      position="static"
      color="transparent"
      elevation={0}
      sx={{ borderBottom: 1, borderColor: "divider", bgcolor: "transparent" }}
    >
      <Toolbar>
        <MouseIcon sx={{ mr: 1 }} />
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          Quick Mouse
        </Typography>
        <IconButton
          edge="end"
          color="inherit"
          aria-label="settings"
          onClick={handleSettingsOpen}
        >
          <SettingsIcon />
        </IconButton>
        <SettingsModal
          open={settingsOpen}
          onClose={handleSettingsClose}
          sensitivity={sensitivity}
          onSensitivityChange={onSensitivityChange}
          showSensorLog={showSensorLog}
          onToggleSensorLog={onToggleSensorLog}
          buttonsAboveTouchpad={buttonsAboveTouchpad}
          onToggleButtonPosition={onToggleButtonPosition}
          isTable={isTable}
          onToggleIsTable={onToggleIsTable}
        />
      </Toolbar>
    </AppBar>
  );
}
