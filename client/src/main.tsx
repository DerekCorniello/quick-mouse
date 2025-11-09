import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { ThemeProvider } from "@mui/material/styles";
import { CssBaseline } from "@mui/material";
import { muiTheme } from "./muiTheme";

createRoot(document.getElementById("root")!).render(
  <ThemeProvider theme={muiTheme}>
    <CssBaseline />
    <App />
  </ThemeProvider>,
);

