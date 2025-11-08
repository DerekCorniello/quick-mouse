import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Slider from "@mui/material/Slider";

interface SensitivityControlProps {
  sensitivity: number;
  onSensitivityChange: (value: number) => void;
}

export function SensitivityControl({
  sensitivity,
  onSensitivityChange,
}: SensitivityControlProps) {
  return (
    <Box
      sx={{
        p: 2,
        borderRadius: 3,
        border: 1,
        borderColor: "divider",
        bgcolor: "transparent",
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          mb: 1,
        }}
      >
        <Typography variant="body2" color="text.secondary">
          Sensitivity
        </Typography>
        <Typography variant="body2" color="primary">
          {sensitivity}x
        </Typography>
      </Box>
      <Slider
        value={sensitivity}
        min={1}
        max={5}
        step={0.1}
        onChange={(_, value) =>
          onSensitivityChange(Array.isArray(value) ? value[0] : value)
        }
        aria-label="sensitivity"
      />
    </Box>
  );
}
