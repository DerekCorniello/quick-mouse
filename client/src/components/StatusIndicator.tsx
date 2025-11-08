import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";

export function StatusIndicator() {
  return (
    <Paper square elevation={0} sx={{ p: 2, pb: 4, borderTop: 1, borderColor: 'divider', bgcolor: 'transparent' }}>
      <div style={{ textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          Quick Mouse - Touch to Control
        </Typography>
      </div>
    </Paper>
  );
}
