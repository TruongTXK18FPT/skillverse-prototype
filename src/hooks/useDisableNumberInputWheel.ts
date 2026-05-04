import { useEffect } from "react";

export const useDisableNumberInputWheel = () => {
  useEffect(() => {
    const handleWheel = (event: WheelEvent) => {
      const target = event.target;

      if (!(target instanceof HTMLInputElement)) return;
      if (target.type !== "number") return;
      if (document.activeElement !== target) return;

      event.preventDefault();
      target.blur();
    };

    document.addEventListener("wheel", handleWheel, { capture: true, passive: false });

    return () => {
      document.removeEventListener("wheel", handleWheel, { capture: true });
    };
  }, []);
};
