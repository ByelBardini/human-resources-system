import { useLayoutEffect, useRef } from "react";

function CampoTextoDinamico({value, onClick}) {
  function useAutosizeStatic(value) {
    const ref = useRef(null);
    useLayoutEffect(() => {
      const el = ref.current;
      if (!el) return;

      const resize = () => {
        el.style.height = "0px";
        el.style.height = el.scrollHeight + "px";
      };

      resize();
      const ro = new ResizeObserver(resize);
      ro.observe(el);
      window.addEventListener("resize", resize);
      return () => {
        ro.disconnect();
        window.removeEventListener("resize", resize);
      };
    }, [value]);
    return ref;
  }

  const ref = useAutosizeStatic(value);
  return (
    <textarea
      ref={ref}
      rows={1}
      readOnly={true}
      value={value || ""}
      onClick={onClick}
      className={
        "cursor-default w-full bg-transparent outline-none px-3 py-2 " +
        "rounded-lg border border-transparent placeholder-white/40 " +
        "resize-none overflow-hidden whitespace-pre-wrap break-words " +
        "text-white/90 font-medium hover:bg-white/5 transition-colors"
      }
    />
  );
}

export default CampoTextoDinamico;
