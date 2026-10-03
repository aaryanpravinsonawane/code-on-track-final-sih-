import { useEffect, useState } from "react";

/** Ticking HH:MM:SS clock. Starts as a placeholder so server and client markup match. */
export function useClock() {
  const [time, setTime] = useState("--:--:--");
  useEffect(() => {
    const update = () =>
      setTime(
        new Date().toLocaleTimeString("en-GB", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),
      );
    update();
    const id = window.setInterval(update, 1000);
    return () => window.clearInterval(id);
  }, []);
  return time;
}
