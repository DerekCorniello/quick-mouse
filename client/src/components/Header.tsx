import AppBar from "@mui/material/AppBar";
import { useState } from "react";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import SettingsIcon from "@mui/icons-material/Settings";
import MouseIcon from "@mui/icons-material/Mouse";
import WifiIcon from "@mui/icons-material/Wifi";
import WifiOffIcon from "@mui/icons-material/WifiOff";
import ErrorIcon from "@mui/icons-material/Error";
import CircularProgress from "@mui/material/CircularProgress";
import Box from "@mui/material/Box";
import SettingsModal from "./SettingsModal";
import PauseModal from "./PauseModal";
import PauseIcon from "@mui/icons-material/Pause";

interface HeaderProps {
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
  connectionStatus: "connecting" | "connected" | "disconnected" | "error";
  onPause: () => void;
  onResume: () => void;
  onRecalibrate: () => void;
}

export function Header({
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
  connectionStatus,
  onPause,
  onResume,
  onRecalibrate,
}: HeaderProps) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [pauseOpen, setPauseOpen] = useState(false);

  const handleSettingsOpen = () => {
    setSettingsOpen(true);
  };

  const handleSettingsClose = () => {
    setSettingsOpen(false);
  };

  const handlePauseOpen = () => {
    setPauseOpen(true);
    onPause();
  };

  const handlePauseClose = () => {
    setPauseOpen(false);
    onResume();
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
        <Box sx={{ display: "flex", alignItems: "center", mr: 1 }}>
          {connectionStatus === "connecting" && (
            <CircularProgress size={20} color="inherit" />
          )}
          {connectionStatus === "connected" && (
            <WifiIcon sx={{ color: "success.main" }} />
          )}
          {connectionStatus === "disconnected" && (
            <WifiOffIcon sx={{ color: "warning.main" }} />
          )}
          {connectionStatus === "error" && (
            <ErrorIcon sx={{ color: "error.main" }} />
          )}
        </Box>
        <IconButton
          edge="end"
          color="inherit"
          aria-label="pause"
          onClick={handlePauseOpen}
          sx={{ mr: 1 }}
        >
          <PauseIcon />
        </IconButton>
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
           pointerSensitivity={pointerSensitivity}
           scrollSensitivity={scrollSensitivity}
           onPointerSensitivityChange={onPointerSensitivityChange}
           onScrollSensitivityChange={onScrollSensitivityChange}
           showSensorLog={showSensorLog}
           onToggleSensorLog={onToggleSensorLog}
           buttonsAboveTouchpad={buttonsAboveTouchpad}
           onToggleButtonPosition={onToggleButtonPosition}
           isTable={isTable}
           onToggleIsTable={onToggleIsTable}
           naturalScroll={naturalScroll}
           onToggleNaturalScroll={onToggleNaturalScroll}
           onToggleSwapLeftRightClick={onToggleSwapLeftRightClick}
           onRecalibrate={onRecalibrate}
         />
        <PauseModal open={pauseOpen} onClose={handlePauseClose} />
      </Toolbar>
    </AppBar>
  );
}
