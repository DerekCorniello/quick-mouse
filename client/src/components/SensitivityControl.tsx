import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Slider from "@mui/material/Slider";

interface SensitivityControlProps {
  title?: string;
  sensitivity: number;
  onSensitivityChange: (value: number) => void;
}

export function SensitivityControl({
  title = "Sensitivity",
  sensitivity,
  onSensitivityChange,
}: SensitivityControlProps) {
  return (
    <Box
      sx={{
        p: 0,
        borderRadius: 3,
        borderColor: "divider",
        bgcolor: "transparent",
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          mb: 0,
        }}
      >
        <Typography variant="body2" color="text.secondary">
          {title}
        </Typography>
        <Typography variant="body2" color="primary">
          {sensitivity}x
        </Typography>
      </Box>
      <Slider
        value={sensitivity}
        min={0}
        max={10}
        step={0.1}
        onChange={(_, value) =>
          onSensitivityChange(Array.isArray(value) ? value[0] : value)
        }
        aria-label="sensitivity"
      />
    </Box>
  );
}
