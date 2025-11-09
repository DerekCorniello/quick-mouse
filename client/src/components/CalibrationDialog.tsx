import { useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import SensorsIcon from "@mui/icons-material/Sensors";

interface CalibrationDialogProps {
  onCalibrationComplete: () => void;
  onStartCalibration: () => void;
}

export function CalibrationDialog({
  onCalibrationComplete,
  onStartCalibration,
}: CalibrationDialogProps) {
  const [step, setStep] = useState<"confirm" | "calibrating">("confirm");

  const handleStartCalibration = () => {
    setStep("calibrating");
    onStartCalibration();
  };

  const handleSkip = () => {
    onCalibrationComplete();
  };

  if (step === "confirm") {
    return (
      <Box
        sx={(theme) => ({
          position: "fixed",
          border: 1,
          borderColor: theme.palette.primary.main,
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          textAlign: "center",
          p: 4,
          bgcolor: "background.paper",
          borderRadius: 3,
          boxShadow: 3,
          zIndex: 1000,
          minWidth: 350,
        })}
      >
        <SensorsIcon sx={{ fontSize: 64, color: "primary.main", mb: 2 }} />
        <Typography variant="h5" sx={{ mb: 2 }}>
          Calibrate Motion Sensors
        </Typography>
        <Typography sx={{ mb: 3, color: "text.secondary", lineHeight: 1.6 }}>
          Calibration will zero your device motion sensors for accurate control.
          Hold your device steady and avoid movement during calibration.
        </Typography>
        <Box sx={{ display: "flex", gap: 2, justifyContent: "center" }}>
          <Button
            variant="contained"
            size="large"
            onClick={handleStartCalibration}
            sx={{ px: 4, py: 1.5 }}
          >
            Start Calibration
          </Button>
          <Button
            variant="outlined"
            size="large"
            onClick={handleSkip}
            sx={{ px: 4, py: 1.5 }}
          >
            Skip
          </Button>
        </Box>
      </Box>
    );
  }

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
        minWidth: 350,
      })}
    >
      <SensorsIcon sx={{ fontSize: 64, color: "primary.main", mb: 2 }} />
      <Typography variant="h5" sx={{ mb: 2 }}>
        Calibrating...
      </Typography>
      <Typography sx={{ mb: 3, color: "text.secondary" }}>
        Hold your device steady - collecting samples.
      </Typography>
    </Box>
  );
}
