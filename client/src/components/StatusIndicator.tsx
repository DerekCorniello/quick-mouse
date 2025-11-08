import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";

interface StatusIndicatorProps {
  cursorPosition: { x: number; y: number };
}

export function StatusIndicator({ cursorPosition }: StatusIndicatorProps) {
  return (
    <Paper square elevation={0} sx={{ p: 2, pb: 4, borderTop: 1, borderColor: 'divider', bgcolor: 'transparent' }}>
      <div style={{ textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          Cursor: ({Math.round(cursorPosition.x)},{" "}{Math.round(cursorPosition.y)})
        </Typography>
      </div>
    </Paper>
  );
}
