import { useEffect, useRef, useState } from "react";
import { lowEndDevice } from "@/lib/perf";

const bgVideoMp4 = "/bg-loop.mp4";

const StarryBackground = () => {
  const ref = useRef<HTMLVideoElement>(null);
  // Weak devices keep the static gradient: decoding a fullscreen loop behind
  // blurred glass panels is the single most expensive thing on this screen.
  const [useVideo] = useState(() => !lowEndDevice());

  useEffect(() => {
    if (!useVideo) return;
    const v = ref.current;
    if (!v) return;
    v.muted = true;
    v.defaultMuted = true;
    const play = () => void v.play().catch(() => undefined);
    play();
    document.addEventListener("touchstart", play, { once: true });
    document.addEventListener("click", play, { once: true });

    // Stop decoding frames while the mini app is in the background.
    const onVisibility = () => {
      if (document.hidden) v.pause();
      else play();
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      document.removeEventListener("touchstart", play);
      document.removeEventListener("click", play);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [useVideo]);

  return (
    <div className="liquid-bg" aria-hidden="true">
      {useVideo && (
        <video
          ref={ref}
          autoPlay
          loop
          muted
          playsInline
          preload="metadata"
          disablePictureInPicture
          className="absolute inset-0 h-full w-full object-cover"
        >
          <source src={bgVideoMp4} type="video/mp4" />
        </video>
      )}
      {!useVideo && <div className="liquid-bg__veil" />}

    </div>
  );
};

export default StarryBackground;
