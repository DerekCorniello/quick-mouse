import { useState, useEffect, useCallback } from "react";
import Paper from "@mui/material/Paper";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";

interface SensorLogProps {
  swipeDirection: string;
  swipeMagnitude: number;
  onPermissionsGranted?: () => void;
}

export function SensorLog({ swipeDirection, swipeMagnitude, onPermissionsGranted }: SensorLogProps) {
  const [eventCount, setEventCount] = useState(0);
  const [orientation, setOrientation] = useState({
    alpha: 0,
    beta: 0,
    gamma: 0,
  });
  const [acceleration, setAcceleration] = useState({ x: 0, y: 0, z: 0 });
  const [accelerationIncludingGravity, setAccelerationIncludingGravity] =
    useState({ x: 0, y: 0, z: 0 });
  const [rotationRate, setRotationRate] = useState({
    alpha: 0,
    beta: 0,
    gamma: 0,
  });
  const [interval, setInterval] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  const handleOrientation = useCallback((event: DeviceOrientationEvent) => {
    setOrientation({
      alpha: event.alpha ?? 0,
      beta: event.beta ?? 0,
      gamma: event.gamma ?? 0,
    });
    setEventCount((prev) => prev + 1);
  }, []);

  const handleMotion = useCallback((event: DeviceMotionEvent) => {
    setAcceleration({
      x: event.acceleration?.x ?? 0,
      y: event.acceleration?.y ?? 0,
      z: event.acceleration?.z ?? 0,
    });
    setAccelerationIncludingGravity({
      x: event.accelerationIncludingGravity?.x ?? 0,
      y: event.accelerationIncludingGravity?.y ?? 0,
      z: event.accelerationIncludingGravity?.z ?? 0,
    });
    setRotationRate({
      alpha: event.rotationRate?.alpha ?? 0,
      beta: event.rotationRate?.beta ?? 0,
      gamma: event.rotationRate?.gamma ?? 0,
    });
    setInterval(event.interval ?? 0);
    setEventCount((prev) => prev + 1);
  }, []);

  const startDemo = async () => {
    if (isRunning) {
      window.removeEventListener("devicemotion", handleMotion);
      window.removeEventListener("deviceorientation", handleOrientation);
      setIsRunning(false);
    } else {
      let motionGranted = true;
      let orientationGranted = true;

      type PermissionRequestable = {
        requestPermission?: () => Promise<PermissionState>;
      };

      if (
        typeof DeviceMotionEvent !== "undefined" &&
        typeof (DeviceMotionEvent as unknown as PermissionRequestable)
          .requestPermission === "function"
      ) {
        try {
          const permission = await (
            DeviceMotionEvent as unknown as PermissionRequestable
          ).requestPermission!();
          motionGranted = permission === "granted";
        } catch (error) {
          motionGranted = false;
        }
      }

      if (
        typeof DeviceOrientationEvent !== "undefined" &&
        typeof (DeviceOrientationEvent as unknown as PermissionRequestable)
          .requestPermission === "function"
      ) {
        try {
          const permission = await (
            DeviceOrientationEvent as unknown as PermissionRequestable
          ).requestPermission!();
          orientationGranted = permission === "granted";
        } catch (error) {
          orientationGranted = false;
        }
      }

      if (motionGranted || orientationGranted) {
        window.addEventListener("devicemotion", handleMotion);
        window.addEventListener("deviceorientation", handleOrientation);
        setIsRunning(true);
        onPermissionsGranted?.();
      }
    }
  };

  useEffect(() => {
    return () => {
      window.removeEventListener("devicemotion", handleMotion);
      window.removeEventListener("deviceorientation", handleOrientation);
    };
  }, [handleMotion, handleOrientation]);

  return (
    <Paper
      elevation={0}
      sx={{ p: 2, border: 1, borderColor: "divider", borderRadius: 2 }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
        <Button
          id="start_demo"
          variant={isRunning ? "contained" : "contained"}
          color={isRunning ? "error" : "success"}
          onClick={startDemo}
        >
          {isRunning ? "Stop demo" : "Start demo"}
        </Button>
        <Typography color="text.secondary">
          Datapoints:{" "}
          <Typography component="span" color="primary">
            {eventCount}
          </Typography>
        </Typography>
      </Box>

      <Box sx={{ display: "grid", gap: 2 }}>
        <Box>
          <Typography variant="subtitle1" color="text.primary" sx={{ mb: 1 }}>
            Orientation
          </Typography>
          <Box component="ul" sx={{ color: "text.secondary", pl: 2, m: 0 }}>
            <li>
              X-axis (β):{" "}
              <Typography component="span" color="text.primary">
                {orientation.beta.toFixed(10)}
              </Typography>
              °
            </li>
            <li>
              Y-axis (γ):{" "}
              <Typography component="span" color="text.primary">
                {orientation.gamma.toFixed(10)}
              </Typography>
              °
            </li>
            <li>
              Z-axis (α):{" "}
              <Typography component="span" color="text.primary">
                {orientation.alpha.toFixed(10)}
              </Typography>
              °
            </li>
          </Box>
        </Box>

        <Box>
          <Typography variant="subtitle1" color="text.primary" sx={{ mb: 1 }}>
            Accelerometer
          </Typography>
          <Box component="ul" sx={{ color: "text.secondary", pl: 2, m: 0 }}>
            <li>
              X-axis:{" "}
              <Typography component="span" color="text.primary">
                {acceleration.x.toFixed(10)}
              </Typography>{" "}
              m/s²
            </li>
            <li>
              Y-axis:{" "}
              <Typography component="span" color="text.primary">
                {acceleration.y.toFixed(10)}
              </Typography>{" "}
              m/s²
            </li>
            <li>
              Z-axis:{" "}
              <Typography component="span" color="text.primary">
                {acceleration.z.toFixed(10)}
              </Typography>{" "}
              m/s²
            </li>
            <li>
              Interval:{" "}
              <Typography component="span" color="text.primary">
                {interval.toFixed(2)}
              </Typography>{" "}
              ms
            </li>
          </Box>
        </Box>

        <Box>
          <Typography variant="subtitle1" color="text.primary" sx={{ mb: 1 }}>
            Accelerometer (with gravity)
          </Typography>
          <Box component="ul" sx={{ color: "text.secondary", pl: 2, m: 0 }}>
            <li>
              X-axis:{" "}
              <Typography component="span" color="text.primary">
                {accelerationIncludingGravity.x.toFixed(10)}
              </Typography>{" "}
              m/s²
            </li>
            <li>
              Y-axis:{" "}
              <Typography component="span" color="text.primary">
                {accelerationIncludingGravity.y.toFixed(10)}
              </Typography>{" "}
              m/s²
            </li>
            <li>
              Z-axis:{" "}
              <Typography component="span" color="text.primary">
                {accelerationIncludingGravity.z.toFixed(10)}
              </Typography>{" "}
              m/s²
            </li>
          </Box>
        </Box>

        <Box>
          <Typography variant="subtitle1" color="text.primary" sx={{ mb: 1 }}>
            Gyroscope
          </Typography>
          <Box component="ul" sx={{ color: "text.secondary", pl: 2, m: 0 }}>
            <li>
              X-axis:{" "}
              <Typography component="span" color="text.primary">
                {rotationRate.beta.toFixed(10)}
              </Typography>
              °/s
            </li>
            <li>
              Y-axis:{" "}
              <Typography component="span" color="text.primary">
                {rotationRate.gamma.toFixed(10)}
              </Typography>
              °/s
            </li>
            <li>
              Z-axis:{" "}
              <Typography component="span" color="text.primary">
                {rotationRate.alpha.toFixed(10)}
              </Typography>
              °/s
            </li>
          </Box>
        </Box>

        <Box>
          <Typography variant="subtitle1" color="text.primary" sx={{ mb: 1 }}>
            Touch Swipe
          </Typography>
          <Box component="ul" sx={{ color: "text.secondary", pl: 2, m: 0 }}>
            <li>
              Direction:{" "}
              <Typography component="span" color="text.primary">
                {swipeDirection}
              </Typography>
            </li>
            <li>
              Magnitude:{" "}
              <Typography component="span" color="text.primary">
                {swipeMagnitude}
              </Typography>
            </li>
          </Box>
        </Box>
      </Box>
    </Paper>
  );
}
