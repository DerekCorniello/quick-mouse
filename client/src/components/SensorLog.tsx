import { useState, useEffect, useCallback } from "react";

export function SensorLog() {
  const [eventCount, setEventCount] = useState(0);
  const [orientation, setOrientation] = useState({ alpha: 0, beta: 0, gamma: 0 });
  const [acceleration, setAcceleration] = useState({ x: 0, y: 0, z: 0 });
  const [accelerationIncludingGravity, setAccelerationIncludingGravity] = useState({ x: 0, y: 0, z: 0 });
  const [rotationRate, setRotationRate] = useState({ alpha: 0, beta: 0, gamma: 0 });
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
      // Request permission for device sensors (iOS 13+ and some desktop browsers)
      let motionGranted = true;
      let orientationGranted = true;

      if (
        typeof DeviceMotionEvent !== "undefined" &&
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        typeof (DeviceMotionEvent as any).requestPermission === "function"
      ) {
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const permission = await (DeviceMotionEvent as any).requestPermission();
          motionGranted = permission === "granted";
        } catch (error) {
          motionGranted = false;
        }
      }

      if (
        typeof DeviceOrientationEvent !== "undefined" &&
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        typeof (DeviceOrientationEvent as any).requestPermission === "function"
      ) {
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const permission = await (DeviceOrientationEvent as any).requestPermission();
          orientationGranted = permission === "granted";
        } catch (error) {
          orientationGranted = false;
        }
      }

      if (motionGranted || orientationGranted) {
        window.addEventListener("devicemotion", handleMotion);
        window.addEventListener("deviceorientation", handleOrientation);
        setIsRunning(true);
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
    <div className="p-4 bg-slate-950/50 border border-slate-700 rounded-2xl">
      <div className="flex items-center gap-4 mb-4">
        <button
          id="start_demo"
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            isRunning
              ? 'bg-red-500 hover:bg-red-600 text-white'
              : 'bg-green-500 hover:bg-green-600 text-white'
          }`}
          onClick={startDemo}
        >
          {isRunning ? 'Stop demo' : 'Start demo'}
        </button>
        <p className="text-slate-300">
          Datapoints: <span className="text-blue-400 font-medium">{eventCount}</span>
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <h4 className="text-slate-200 font-medium mb-2">Orientation</h4>
          <ul className="text-slate-400 space-y-1">
            <li>X-axis (β): <span className="text-slate-300">{orientation.beta.toFixed(10)}</span>°</li>
            <li>Y-axis (γ): <span className="text-slate-300">{orientation.gamma.toFixed(10)}</span>°</li>
            <li>Z-axis (α): <span className="text-slate-300">{orientation.alpha.toFixed(10)}</span>°</li>
          </ul>
        </div>

        <div>
          <h4 className="text-slate-200 font-medium mb-2">Accelerometer</h4>
          <ul className="text-slate-400 space-y-1">
            <li>X-axis: <span className="text-slate-300">{acceleration.x.toFixed(10)}</span> m/s²</li>
            <li>Y-axis: <span className="text-slate-300">{acceleration.y.toFixed(10)}</span> m/s²</li>
            <li>Z-axis: <span className="text-slate-300">{acceleration.z.toFixed(10)}</span> m/s²</li>
            <li>Interval: <span className="text-slate-300">{interval.toFixed(2)}</span> ms</li>
          </ul>
        </div>

        <div>
          <h4 className="text-slate-200 font-medium mb-2">Accelerometer (with gravity)</h4>
          <ul className="text-slate-400 space-y-1">
            <li>X-axis: <span className="text-slate-300">{accelerationIncludingGravity.x.toFixed(10)}</span> m/s²</li>
            <li>Y-axis: <span className="text-slate-300">{accelerationIncludingGravity.y.toFixed(10)}</span> m/s²</li>
            <li>Z-axis: <span className="text-slate-300">{accelerationIncludingGravity.z.toFixed(10)}</span> m/s²</li>
          </ul>
        </div>

        <div>
          <h4 className="text-slate-200 font-medium mb-2">Gyroscope</h4>
          <ul className="text-slate-400 space-y-1">
            <li>X-axis: <span className="text-slate-300">{rotationRate.beta.toFixed(10)}</span>°/s</li>
            <li>Y-axis: <span className="text-slate-300">{rotationRate.gamma.toFixed(10)}</span>°/s</li>
            <li>Z-axis: <span className="text-slate-300">{rotationRate.alpha.toFixed(10)}</span>°/s</li>
          </ul>
        </div>
      </div>
    </div>
  );
}