import { Bleed, Box, HStack, Slider } from "@chakra-ui/react";
import { Pause, Play, X, Loader2 } from "lucide-react";
import * as React from "react";
import { MdGraphicEq } from "react-icons/md";
import { TbRewindBackward10, TbRewindForward10 } from "react-icons/tb";
import UserAvatar from "@/assets/icons/user-icon.svg?react";

let AudioMotionAnalyzer = null;

export default function AudioPlayer({
  src,
  title = "Midnight Drive",
  initiallyOpen = false,
  onClose = () => {},
  onLoadError = () => {},
  isAba = false,
  showCloseButton = true,
}) {
  const [isAnalyzerReady, setIsAnalyzerReady] = React.useState(false);

  // src = "/audio/audio.wav";
  const audioRef = React.useRef(null);
  const [isOpen, setIsOpen] = React.useState(initiallyOpen);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [duration, setDuration] = React.useState(0);
  const [currentTime, setCurrentTime] = React.useState(0);
  const [volume, setVolume] = React.useState(0.9);
  const [isMuted, setIsMuted] = React.useState(false);
  const [error, setError] = React.useState(null);
  const containerRef = React.useRef(null);
  const analyzerRef = React.useRef(null);
  const looksLikeSignedS3Url = React.useCallback((url = "") => {
    return /amazonaws\.com|x-amz-signature=|x-amz-credential=|x-amz-security-token=|x-amz-algorithm=/i.test(
      url,
    );
  }, []);
  const detectAccessDenied = React.useCallback(
    async (failedSrc) => {
      if (!failedSrc) return false;

      try {
        const probeResponse = await fetch(failedSrc, {
          method: "GET",
          cache: "no-store",
        });

        if (probeResponse.status !== 403) {
          return false;
        }

        const errorText = await probeResponse.text();
        return /AccessDenied/i.test(errorText);
      } catch {
        return looksLikeSignedS3Url(failedSrc);
      }
    },
    [looksLikeSignedS3Url],
  );

  // Open player immediately when src is provided
  React.useEffect(() => {
    if (src) {
      setIsOpen(true);
      setIsLoading(true);
      setError(null);
    }
  }, [src]);

  // Create and manage audio element asynchronously
  React.useEffect(() => {
    if (!src) return;

    const el = new Audio();
    el.preload = "auto";
    el.crossOrigin = "anonymous";
    el.volume = isMuted ? 0 : volume;
    audioRef.current = el;

    const onLoadStart = () => {
      setIsLoading(true);
      setError(null);
    };

    const onCanPlay = () => {
      setIsLoading(false);
    };

    const onLoaded = () => {
      if (Number.isFinite(el.duration)) {
        setDuration(el.duration);
        setIsLoading(false);
        // Auto-play when ready
        // el.play()
        //   .then(() => setIsPlaying(true))
        //   .catch((err) => {
        //     console.log("Autoplay blocked:", err.message);
        //     setIsLoading(false);
        //   });
      }
    };

    const onTime = () => setCurrentTime(el.currentTime);

    const onEnd = () => setIsPlaying(false);

    const onError = (e) => {
      console.log("Audio error:", e);
      const failedSrc = (el.currentSrc || src || "").replace(
        "http://",
        "https://",
      );
      setIsLoading(true);
      // setError("Failed to load audio");
      detectAccessDenied(failedSrc)
        .then((isAccessDenied) => {
          onLoadError({
            src: failedSrc,
            isAccessDenied,
          });
        })
        .catch(() => {
          onLoadError({
            src: failedSrc,
            isAccessDenied: looksLikeSignedS3Url(failedSrc),
          });
        });
      console.log("Audio error:", e);
    };

    const onWaiting = () => setIsLoading(true);
    const onPlaying = () => setIsLoading(false);

    el.addEventListener("loadstart", onLoadStart);
    el.addEventListener("canplay", onCanPlay);
    el.addEventListener("loadedmetadata", onLoaded);
    el.addEventListener("timeupdate", onTime);
    el.addEventListener("ended", onEnd);
    el.addEventListener("error", onError);
    el.addEventListener("waiting", onWaiting);
    el.addEventListener("playing", onPlaying);

    // Set src after listeners are attached
    el.src = src.replace("http://", "https://");
    el.load();

    return () => {
      el.pause();
      el.removeEventListener("loadstart", onLoadStart);
      el.removeEventListener("canplay", onCanPlay);
      el.removeEventListener("loadedmetadata", onLoaded);
      el.removeEventListener("timeupdate", onTime);
      el.removeEventListener("ended", onEnd);
      el.removeEventListener("error", onError);
      el.removeEventListener("waiting", onWaiting);
      el.removeEventListener("playing", onPlaying);
      el.src = "";
      audioRef.current = null;
    };
  }, [src, detectAccessDenied, looksLikeSignedS3Url]);

  // Sync volume changes
  React.useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  // Keyboard shortcuts
  React.useEffect(() => {
    if (!isOpen) return;

    const onKey = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        handleClose();
        analyzerRef.current?.disconnectInput();
      } else if (e.key === " " || e.key === "Spacebar") {
        e.preventDefault();
        handleTogglePlay();
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, isPlaying]);

  const formatTime = React.useCallback((t) => {
    if (!Number.isFinite(t)) return "0:00";
    const m = Math.floor(t / 60);
    const s = Math.floor(t % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  }, []);

  const handleTogglePlay = React.useCallback(() => {
    const el = audioRef.current;
    if (!el || isLoading) return;

    if (isPlaying) {
      el.pause();
      setIsPlaying(false);
    } else {
      setIsLoading(true);
      el.play()
        .then(() => {
          setIsPlaying(true);
          setIsLoading(false);
        })
        .catch((err) => {
          console.log("Play failed:", err.message);
          setIsLoading(false);
        });
    }
  }, [isPlaying, isLoading]);

  const handleSeek = React.useCallback(
    (v) => {
      const el = audioRef.current;
      if (!el || !duration || isLoading) return;
      const next = Math.max(0, Math.min(v, duration));
      el.currentTime = next;
      setCurrentTime(next);
    },
    [duration, isLoading],
  );

  const handleSkip = React.useCallback(
    (delta) => {
      const el = audioRef.current;
      if (!el || isLoading) return;
      const next = Math.max(0, Math.min(el.currentTime + delta, duration));
      el.currentTime = next;
      setCurrentTime(next);
    },
    [duration, isLoading],
  );

  const handleClose = React.useCallback(() => {
    if (audioRef.current) {
      audioRef.current = null;
      analyzerRef.current.destroy();
      setIsPlaying(false);
    }
    setIsOpen(false);
    analyzerRef.current = null;
    containerRef.current = null;
    onClose();
  }, [onClose]);

  React.useEffect(() => {
    const initAnalyzer = async () => {
      try {
        const module = await import("audiomotion-analyzer");
        AudioMotionAnalyzer = module.default;

        if (
          containerRef.current &&
          AudioMotionAnalyzer &&
          audioRef.current &&
          !analyzerRef.current
        ) {
          const analyzer = new AudioMotionAnalyzer(containerRef.current, {
            source: audioRef.current,
            mode: 2,
            alphaBars: false,
            ansiBands: false,
            barSpace: 0.25,
            channelLayout: "single",
            colorMode: "bar-level",
            frequencyScale: "log",
            gradient: "prism",
            ledBars: false,
            linearAmplitude: true,
            linearBoost: 1.6,
            lumiBars: false,
            maxFreq: 16000,
            minFreq: 30,
            mirror: 0,
            radial: false,
            reflexRatio: 0.5,
            reflexAlpha: 1,
            roundBars: true,
            showPeaks: false,
            showScaleX: false,
            smoothing: 0.7,
            weightingFilter: "D",
            showBgColor: false,
            showScaleY: false,
            overlay: true,
          });
          analyzerRef.current = analyzer;
          setIsAnalyzerReady(true);
        }
      } catch (error) {
        console.error("[v0] Error initializing AudioMotionAnalyzer:", error);
      }
    };

    if (src) {
      initAnalyzer();
    }

    return () => {
      if (analyzerRef.current) {
        analyzerRef.current.destroy();
      }
    };
  }, [src]);

  // Ensure analyzer is connected to the current audio element when src changes
  React.useEffect(() => {
    const analyzer = analyzerRef.current;
    const el = audioRef.current;

    if (!analyzer || !el || !isAnalyzerReady) return;
    console.log("el1212", el);
    console.dir("el1212", el);
    console.trace("el1212", el);
    try {
      // alert(analyzer);
      // analyzer.disconnectInput();
      // el.crossOrigin = "anonymous";

      analyzer.connectInput(el);
      analyzer.connectOutput(containerRef.current);
    } catch (e) {
      console.error("[v0] Failed to connect audio source to analyzer:", e);
    }
  }, [src, isAnalyzerReady]);

  if (!src) return null;

  return (
    <div
      aria-live="polite"
      className={
        isAba
          ? "pointer-events-none z-50 w-full"
          : "pointer-events-none fixed inset-x-0 bottom-0 z-50"
      }
    >
      <div
        data-state={isOpen ? "open" : "closed"}
        role="dialog"
        aria-label="Audio player"
        aria-hidden={!isOpen}
        className={`pointer-events-auto mx-auto max-w-xl rounded-t-2xl bg-droidal-black-400 p-4 shadow-2xl backdrop-blur transition-transform duration-300 ease-out will-change-transform ${
          isOpen ? "translate-y-0" : "translate-y-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="min-w-0 flex-1">
            <h2 className="text-pretty text-base font-semibold text-white">
              {title}
            </h2>
            {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
            {isLoading && !error && (
              <p className="text-xs text-gray-400 mt-1">Loading...</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleSkip(-10)}
              disabled={isLoading || error}
              className="rounded-md p-2 text-gray-400 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:opacity-30 disabled:cursor-not-allowed"
              aria-label="Rewind 10 seconds"
              title="Rewind 10s"
            >
              <TbRewindBackward10 size={20} />
            </button>
            <button
              type="button"
              onClick={() => handleSkip(10)}
              disabled={isLoading || error}
              className="rounded-md p-2 text-gray-400 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:opacity-30 disabled:cursor-not-allowed"
              aria-label="Forward 10 seconds"
              title="Forward 10s"
            >
              <TbRewindForward10 size={20} />
            </button>
            {showCloseButton && (
              <button
                type="button"
                onClick={handleClose}
                className="rounded-md p-2 text-gray-400 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                aria-label="Close player"
                title="Close"
              >
                <X size={20} />
              </button>
            )}
          </div>
        </div>

        {/* Play/Pause Button */}
        <div className="mt-3 flex items-center justify-center absolute bottom-3 w-full">
          <button
            aria-pressed={isPlaying}
            title={isLoading ? "Loading..." : isPlaying ? "Pause" : "Play"}
            onClick={handleTogglePlay}
            disabled={isLoading || error}
            className={`relative inline-flex h-8 w-8 items-center justify-center rounded-2xl bg-black shadow-lg transition-transform hover:scale-105 active:scale-95 focus:outline-none focus:ring-4 focus:ring-indigo-300 disabled:opacity-50 disabled:cursor-not-allowed ${
              isPlaying && !isLoading ? "animate-pulse" : ""
            }`}
          >
            {isLoading ? (
              <Loader2 size={18} className="text-white animate-spin" />
            ) : (
              <>
                <span
                  className={`absolute transition-all duration-300 ease-in-out ${
                    isPlaying
                      ? "translate-x-1 scale-75 opacity-0"
                      : "scale-100 opacity-100"
                  }`}
                >
                  <Play size={18} className="text-white" fill="white" />
                </span>
                <span
                  className={`absolute transition-all duration-300 ease-in-out ${
                    isPlaying
                      ? "scale-100 opacity-100"
                      : "-translate-x-1 scale-75 opacity-0"
                  }`}
                >
                  <Pause size={18} className="text-white" fill="white" />
                </span>
              </>
            )}
          </button>
        </div>

        <Bleed block={20}>
          <HStack
            px={10}
            gap={2}
            justifyContent={"center"}
            alignItems={"center"}
          >
            <span className="scale-200">
              <UserAvatar width={50} height={50} />
            </span>
            <div
              ref={containerRef}
              style={{ width: "100%", height: "300px" }}
            />
            <span className="scale-200">
              <UserAvatar width={50} height={50} />
            </span>
          </HStack>
        </Bleed>

        {/* Timeline */}
        <div className="mt-4">
          <div className="flex items-center gap-3">
            <span className="w-10 shrink-0 text-right text-xs tabular-nums text-gray-400">
              {formatTime(currentTime)}
            </span>

            <Slider.Root
              aria-label="Seek"
              value={[currentTime]}
              min={0}
              max={duration > 0 ? duration : 0}
              step={0.1}
              onValueChange={(e) => handleSeek(e.value[0])}
              disabled={isLoading || error}
              w="full"
            >
              <Slider.Control>
                <Slider.Track bg="gray.700">
                  <Slider.Range bg="tomato" />
                </Slider.Track>
                <Slider.Thumb
                  index={0}
                  boxSize={6}
                  borderColor="tomato"
                  shadow="md"
                  disabled={isLoading || error}
                >
                  <Box color="tomato" as={MdGraphicEq} />
                </Slider.Thumb>
              </Slider.Control>
            </Slider.Root>

            <span className="w-10 shrink-0 text-xs tabular-nums text-gray-400">
              {formatTime(duration)}
            </span>
          </div>
        </div>

        {/* Volume */}
        <div className="mt-3 flex items-center justify-between">
          <div></div>
          {/* <button
            type="button"
            onClick={() => setIsMuted((m) => !m)}
            disabled={isLoading || error}
            className="rounded-md px-2 py-1 text-xs font-medium text-gray-400 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:opacity-30 disabled:cursor-not-allowed"
            aria-pressed={isMuted}
            aria-label={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted ? "🔇 Unmute" : "🔊 Mute"}
          </button> */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">
              Volume: {Math.round(volume * 100)}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
