import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";
import { useEffect, useRef, useState } from "react";

interface KeyboardModalProps {
  open: boolean;
  onClose: () => void;
  onTypeChar: (char: string) => void;
  onKeyPress: (keys: string[]) => void;
}

const toCodePoints = (s: string) => Array.from(s);

function commonPrefixLength(a: string, b: string): number {
  const ap = toCodePoints(a);
  const bp = toCodePoints(b);
  let n = 0;
  while (n < ap.length && n < bp.length && ap[n] === bp[n]) n++;
  return n;
}

export default function KeyboardModal({
  open,
  onClose,
  onTypeChar,
  onKeyPress,
}: KeyboardModalProps) {
  const [text, setText] = useState("");
  const [dialogTop, setDialogTop] = useState("50%");
  const boxRef = useRef<HTMLDivElement>(null);
  const prevValueRef = useRef("");

  // Start with a clean buffer every time the modal opens.
  useEffect(() => {
    if (open) {
      setText("");
      prevValueRef.current = "";
    }
  }, [open]);

  // Track the visual viewport so the on-screen keyboard cannot push the dialog
  // around. When the keyboard opens, the visible area shrinks, so we keep the
  // dialog centered in whatever remains visible.
  useEffect(() => {
    if (!open) return;
    let rafId = 0;
    const update = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        const vv = window.visualViewport;
        const height = vv ? vv.height : window.innerHeight;
        const top = vv ? vv.offsetTop : 0;
        const halfBox = boxRef.current ? boxRef.current.offsetHeight / 2 : 0;
        const clamped = Math.max(top + halfBox, top + height / 2);
        setDialogTop(`${clamped}px`);
      });
    };
    update();
    window.visualViewport?.addEventListener("resize", update);
    window.visualViewport?.addEventListener("scroll", update);
    return () => {
      cancelAnimationFrame(rafId);
      window.visualViewport?.removeEventListener("resize", update);
      window.visualViewport?.removeEventListener("scroll", update);
    };
  }, [open, text]);

  if (!open) return null;

  // Diff the new value against what we already streamed: backspace anything
  // that disappeared, then type anything that appeared, in real time.
  const streamDelta = (newVal: string) => {
    const prev = prevValueRef.current;
    const common = commonPrefixLength(prev, newVal);
    const deleted = toCodePoints(prev).slice(common);
    const inserted = toCodePoints(newVal).slice(common);
    for (let i = 0; i < deleted.length; i++) {
      onKeyPress(["backspace"]);
    }
    for (const ch of inserted) {
      onTypeChar(ch);
    }
    prevValueRef.current = newVal;
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    switch (e.key) {
      case "Enter":
        e.preventDefault();
        onKeyPress(["enter"]);
        break;
      case "Tab":
        e.preventDefault();
        onKeyPress(["tab"]);
        break;
      case "ArrowUp":
        e.preventDefault();
        onKeyPress(["up"]);
        break;
      case "ArrowDown":
        e.preventDefault();
        onKeyPress(["down"]);
        break;
      case "ArrowLeft":
        e.preventDefault();
        onKeyPress(["left"]);
        break;
      case "ArrowRight":
        e.preventDefault();
        onKeyPress(["right"]);
        break;
      case "Escape":
        e.preventDefault();
        break;
      default:
        break;
    }
  };

  return (
    <Box
      ref={boxRef}
      sx={(theme) => ({
        border: 1,
        borderColor: theme.palette.primary.main,
        position: "fixed",
        top: dialogTop,
        left: "50%",
        transform: "translate(-50%, -50%)",
        textAlign: "center",
        p: 2,
        bgcolor: "background.paper",
        borderRadius: 3,
        boxShadow: 3,
        zIndex: 1100,
        minWidth: 280,
        width: "min(340px, calc(100vw - 32px))",
      })}
    >
      <IconButton
        onClick={onClose}
        sx={{ position: "absolute", top: 8, right: 8 }}
      >
        <CloseIcon />
      </IconButton>
      <Typography variant="h6" sx={{ mb: 0.5 }}>
        Keyboard
      </Typography>
      <Typography sx={{ mb: 1, color: "text.secondary", fontSize: 13 }}>
        Move your mouse to a text box on your computer, then type here — every
        key goes to your computer instantly.
      </Typography>
      <TextField
        multiline
        minRows={2}
        maxRows={5}
        fullWidth
        autoFocus
        value={text}
        onChange={(e) => {
          if ((e.nativeEvent as InputEvent).isComposing) return;
          streamDelta(e.target.value);
          setText(e.target.value);
        }}
        onKeyDown={handleKeyDown}
        placeholder="Tap to type..."
        variant="outlined"
      />
      <Button
        variant="outlined"
        color="inherit"
        fullWidth
        sx={{ mt: 1.5 }}
        onClick={() => {
          setText("");
          prevValueRef.current = "";
        }}
      >
        Clear
      </Button>
    </Box>
  );
}