"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import {
  BiBookOpen,
  BiCheckCircle,
  BiCog,
  BiCoffee,
  BiPause,
  BiPlay,
  BiRefresh,
  BiTimer,
} from "react-icons/bi";

type TimerMode = "focus" | "shortBreak" | "longBreak";

type TimerSettings = {
  focus: number;
  shortBreak: number;
  longBreak: number;
};

type SavedTimer = {
  settings: TimerSettings;
  mode: TimerMode;
  remainingSeconds: number;
  completedSessions: number;
  totalFocusSeconds: number;
};

const STORAGE_KEY = "course-manager-focus-timer";

const DEFAULT_SETTINGS: TimerSettings = {
  focus: 25,
  shortBreak: 5,
  longBreak: 15,
};

const MODE_INFO: Record<
  TimerMode,
  { label: string; description: string; icon: typeof BiTimer }
> = {
  focus: {
    label: "Focus time",
    description: "One task. Your full attention.",
    icon: BiBookOpen,
  },
  shortBreak: {
    label: "Short break",
    description: "Take a breath and recharge.",
    icon: BiCoffee,
  },
  longBreak: {
    label: "Long break",
    description: "You've earned a longer rest.",
    icon: BiCoffee,
  },
};

// Keep the server and initial hydration output consistent.
function subscribeToHydration() {
  return () => {};
}

function getClientSnapshot() {
  return true;
}

function getServerSnapshot() {
  return false;
}

function isTimerMode(value: unknown): value is TimerMode {
  return value === "focus" || value === "shortBreak" || value === "longBreak";
}

function getDuration(mode: TimerMode, settings: TimerSettings) {
  return settings[mode === "focus" ? "focus" : mode];
}

function formatTime(seconds: number) {
  const safeSeconds = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(safeSeconds / 60);
  const remaining = safeSeconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(remaining).padStart(
    2,
    "0",
  )}`;
}

function sanitizeSettings(
  settings?: Partial<TimerSettings> | null,
): TimerSettings {
  const sanitize = (value: unknown, fallback: number, max: number) => {
    const number = Number(value);

    if (!Number.isFinite(number) || number < 1) {
      return fallback;
    }

    return Math.min(max, Math.floor(number));
  };

  return {
    focus: sanitize(settings?.focus, 25, 180),
    shortBreak: sanitize(settings?.shortBreak, 5, 60),
    longBreak: sanitize(settings?.longBreak, 15, 120),
  };
}

function readSavedTimer(): SavedTimer | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);

    if (!raw) return null;

    const saved: unknown = JSON.parse(raw);

    if (!saved || typeof saved !== "object") {
      return null;
    }

    const timer = saved as Partial<SavedTimer>;

    if (
      !timer.settings ||
      !isTimerMode(timer.mode) ||
      !Number.isFinite(timer.remainingSeconds) ||
      !Number.isFinite(timer.completedSessions) ||
      !Number.isFinite(timer.totalFocusSeconds)
    ) {
      return null;
    }

    return {
      settings: sanitizeSettings(timer.settings),
      mode: timer.mode,
      remainingSeconds: Math.max(
        0,
        Math.floor(timer.remainingSeconds as number),
      ),
      completedSessions: Math.max(
        0,
        Math.floor(timer.completedSessions as number),
      ),
      totalFocusSeconds: Math.max(
        0,
        Math.floor(timer.totalFocusSeconds as number),
      ),
    };
  } catch {
    return null;
  }
}

function playTimerRingtone(): Promise<void> {
  return new Promise((resolve, reject) => {
    const AudioContextClass =
      window.AudioContext ||
      (window as typeof window & {
        webkitAudioContext?: typeof AudioContext;
      }).webkitAudioContext;

    if (!AudioContextClass) {
      reject(new Error("Web Audio API is not supported."));
      return;
    }

    const context = new AudioContextClass();

    void context
      .resume()
      .then(() => {
        const notes = [880, 1174.66, 880, 1174.66, 880];
        const noteDuration = 0.25;
        const startTime = context.currentTime;

        notes.forEach((frequency, index) => {
          const oscillator = context.createOscillator();
          const gain = context.createGain();

          oscillator.type = "sine";
          oscillator.frequency.value = frequency;

          gain.gain.setValueAtTime(0.0001, startTime + index * 0.35);
          gain.gain.exponentialRampToValueAtTime(
            0.3,
            startTime + index * 0.35 + 0.02,
          );
          gain.gain.exponentialRampToValueAtTime(
            0.0001,
            startTime + index * 0.35 + noteDuration,
          );

          oscillator.connect(gain);
          gain.connect(context.destination);

          oscillator.start(startTime + index * 0.35);
          oscillator.stop(startTime + index * 0.35 + noteDuration);
        });

        window.setTimeout(() => {
          void context.close().then(resolve).catch(reject);
        }, 2200);
      })
      .catch(reject);
  });
}

export default function FocusTimePage() {
  const [savedTimer] = useState<SavedTimer | null>(() => {
    if (typeof window === "undefined") return null;
    return readSavedTimer();
  });

  const [settings, setSettings] = useState<TimerSettings>(() =>
    sanitizeSettings(savedTimer?.settings),
  );

  const [mode, setMode] = useState<TimerMode>(
    () => savedTimer?.mode ?? "focus",
  );

  const [remainingSeconds, setRemainingSeconds] = useState(() => {
    if (!savedTimer) return DEFAULT_SETTINGS.focus * 60;

    const safeSettings = sanitizeSettings(savedTimer.settings);
    const maxSeconds = getDuration(savedTimer.mode, safeSettings) * 60;

    return Math.min(savedTimer.remainingSeconds, maxSeconds);
  });

  const [isRunning, setIsRunning] = useState(false);

  const [completedSessions, setCompletedSessions] = useState(
    () => savedTimer?.completedSessions ?? 0,
  );

  const [totalFocusSeconds, setTotalFocusSeconds] = useState(
    () => savedTimer?.totalFocusSeconds ?? 0,
  );

  const [showSettings, setShowSettings] = useState(false);
  const [isRingtonePlaying, setIsRingtonePlaying] = useState(false);

  const ringtoneRef = useRef<HTMLAudioElement | null>(null);
  const remainingSecondsRef = useRef(remainingSeconds);

  const hydrated = useSyncExternalStore(
    subscribeToHydration,
    getClientSnapshot,
    getServerSnapshot,
  );

  const durationSeconds = getDuration(mode, settings) * 60;

  const progress = durationSeconds
    ? Math.min(
        100,
        Math.max(
          0,
          ((durationSeconds - remainingSeconds) / durationSeconds) * 100,
        ),
      )
    : 0;

  // Keep the ref synchronized whenever another action changes the time.
  const updateRemainingSeconds = useCallback((seconds: number) => {
    const safeSeconds = Math.max(0, seconds);
    remainingSecondsRef.current = safeSeconds;
    setRemainingSeconds(safeSeconds);
  }, []);

  const stopRingtone = useCallback(() => {
    const audio = ringtoneRef.current;

    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }

    setIsRingtonePlaying(false);
  }, []);

 

const playRingtone = useCallback(async () => {
  const audio = ringtoneRef.current;

  if (!audio) {
    console.error("Music audio element was not found.");
    return;
  }

  try {
    audio.pause();
    audio.currentTime = 0;
    audio.loop = true;
    await audio.play();
    setIsRingtonePlaying(true);
  } catch (error) {
    console.error("Could not play your music:", error);
    setIsRingtonePlaying(false);
  }
}, []);



  const resetTimer = useCallback(
    (nextMode: TimerMode = mode) => {
      stopRingtone();
      setIsRunning(false);
      setMode(nextMode);
      updateRemainingSeconds(getDuration(nextMode, settings) * 60);
    },
    [mode, settings, stopRingtone, updateRemainingSeconds],
  );

  // Persist settings and progress in this browser.
  useEffect(() => {
    if (!hydrated) return;

    const saved: SavedTimer = {
      settings,
      mode,
      remainingSeconds,
      completedSessions,
      totalFocusSeconds,
    };

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
    } catch {
      // The timer can still work when browser storage is unavailable.
    }
  }, [
    hydrated,
    settings,
    mode,
    remainingSeconds,
    completedSessions,
    totalFocusSeconds,
  ]);

  // Countdown and completion handling.
  // Side effects happen outside React state updater functions.
  useEffect(() => {
    if (!isRunning) return;

    const interval = window.setInterval(() => {
      const nextSeconds = Math.max(0, remainingSecondsRef.current - 1);

      remainingSecondsRef.current = nextSeconds;
      setRemainingSeconds(nextSeconds);

      if (nextSeconds === 0) {
        window.clearInterval(interval);
        setIsRunning(false);

        if (mode === "focus") {
          setCompletedSessions((count) => count + 1);
          setTotalFocusSeconds((total) => total + durationSeconds);
        }

        void playTimerRingtone().catch((error) => {
  console.error("Timer ringtone failed:", error);
});
      }
    }, 1000);

    return () => window.clearInterval(interval);
  }, [isRunning, mode, durationSeconds, playRingtone]);

  // Keep the browser tab title synchronized with the timer.
  useEffect(() => {
    if (!hydrated) return;

    document.title =
      remainingSeconds === 0
        ? "Session complete | Focus Time"
        : `${formatTime(remainingSeconds)} | Focus Time`;

    return () => {
      document.title = "Focus Time | Course Manager";
    };
  }, [remainingSeconds, hydrated]);

  // Stop audio if the user leaves this page.
  useEffect(() => {
    return () => {
      const audio = ringtoneRef.current;

      if (audio) {
        audio.pause();
        audio.currentTime = 0;
      }
    };
  }, []);

  function updateDuration(key: keyof TimerSettings, value: number) {
    const nextSettings = {
      ...settings,
      [key]: value,
    };

    setSettings(nextSettings);

    if (key === mode) {
      setIsRunning(false);
      updateRemainingSeconds(value * 60);
      stopRingtone();
    }
  }

  function handleReset() {
    setIsRunning(false);
    stopRingtone();
    updateRemainingSeconds(getDuration(mode, settings) * 60);
  }

  function handleStart() {
    // Stop a previous ringtone before starting again.
    stopRingtone();

    if (remainingSecondsRef.current === 0) {
      updateRemainingSeconds(getDuration(mode, settings) * 60);
    }

    setIsRunning(true);
  }

  function handlePause() {
    setIsRunning(false);
  }

  function handleModeChange(nextMode: TimerMode) {
    resetTimer(nextMode);
  }

  const ModeIcon = MODE_INFO[mode].icon;

  if (!hydrated) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] px-4 py-8 sm:px-6 lg:px-10">
        <div className="mx-auto max-w-6xl animate-pulse space-y-8">
          <div className="h-8 w-48 rounded-lg bg-zinc-200" />
          <div className="h-5 max-w-xl rounded-lg bg-zinc-200" />
          <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
            <div className="h-[560px] rounded-3xl bg-white" />
            <div className="h-[360px] rounded-3xl bg-white" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF9F6] px-4 py-8 text-zinc-900 sm:px-6 lg:px-10">
      {/* Timer ringtone */}
      <audio
        ref={ringtoneRef}
        src="/sounds/timer-ringtone.mp3"
        preload="auto"
        onCanPlay={() => console.log("Ringtone loaded successfully")}
        onError={() => console.error("Ringtone failed to load")}
        onEnded={() => setIsRingtonePlaying(false)}
      />

      <div className="mx-auto max-w-6xl space-y-8">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-2 text-sm font-semibold uppercase tracking-[0.18em] text-[#B52D32]">
              Your personal study space
            </p>

            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Focus Time
            </h1>

            <p className="mt-2 max-w-xl text-sm leading-6 text-zinc-600 sm:text-base">
              Make time for what matters. Work with intention, then take a
              well-deserved break.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowSettings((show) => !show)}
            className="inline-flex items-center justify-center gap-2 self-start rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm font-semibold transition hover:border-[#B52D32] sm:self-auto"
          >
            <BiCog size={20} />
            {showSettings ? "Close settings" : "Timer settings"}
          </button>
        </header>

        {showSettings && (
          <section className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-7">
            <div className="mb-6">
              <h2 className="text-lg font-bold">Customize your timer</h2>
              <p className="mt-1 text-sm text-zinc-500">
                Choose the duration that works best for you.
              </p>
            </div>

            <div className="grid gap-5 sm:grid-cols-3">
              {(
                [
                  ["focus", "Focus duration", 180],
                  ["shortBreak", "Short break", 60],
                  ["longBreak", "Long break", 120],
                ] as const
              ).map(([key, label, max]) => (
                <label key={key} className="space-y-2">
                  <span className="text-sm font-semibold text-zinc-700">
                    {label}
                  </span>

                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      min={1}
                      max={max}
                      step={1}
                      value={settings[key]}
                      onChange={(event) => {
                        const value = Number(event.target.value);

                        if (
                          Number.isInteger(value) &&
                          value >= 1 &&
                          value <= max
                        ) {
                          updateDuration(key, value);
                        }
                      }}
                      className="w-full rounded-xl border border-zinc-200 bg-[#FAF9F6] px-4 py-3 outline-none transition focus:border-[#B52D32] focus:ring-2 focus:ring-[#B52D32]/10"
                    />

                    <span className="text-sm text-zinc-500">min</span>
                  </div>
                </label>
              ))}
            </div>

            <p className="mt-4 text-xs text-zinc-500">
              Focus: 1–180 minutes · Short break: 1–60 minutes · Long break:
              1–120 minutes
            </p>
          </section>
        )}

        <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
          <section className="rounded-3xl border border-zinc-200/80 bg-white p-5 shadow-sm sm:p-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="inline-flex items-center gap-2 rounded-full bg-[#F8E8E6] px-3 py-2 text-sm font-semibold text-[#B52D32]">
                <ModeIcon size={18} />
                {MODE_INFO[mode].label}
              </span>

              <span className="text-sm text-zinc-500">
                {isRunning
                  ? "Session in progress"
                  : isRingtonePlaying
                    ? "Session complete"
                    : "Ready when you are"}
              </span>
            </div>

            <div className="flex flex-col items-center py-9 sm:py-12">
              <div
                className="relative flex h-64 w-64 items-center justify-center rounded-full sm:h-72 sm:w-72"
                style={{
                  background: `conic-gradient(#B52D32 ${progress}%, #F0E9E5 ${progress}% 100%)`,
                }}
                role="timer"
                aria-label={`${formatTime(remainingSeconds)} remaining`}
              >
                <div className="absolute inset-[9px] flex flex-col items-center justify-center rounded-full bg-white">
                  <span className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-zinc-400">
                    {isRunning ? "Stay focused" : "Time remaining"}
                  </span>

                  <span className="font-mono text-5xl font-semibold tracking-tight tabular-nums sm:text-6xl">
                    {formatTime(remainingSeconds)}
                  </span>

                  <span className="mt-3 text-sm text-zinc-500">
                    {getDuration(mode, settings)} minute
                    {getDuration(mode, settings) === 1 ? "" : "s"} total
                  </span>
                </div>
              </div>

              <h2 className="mt-7 text-xl font-bold">
                {remainingSeconds === 0
                  ? "Session complete!"
                  : MODE_INFO[mode].description}
              </h2>

              <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={isRunning ? handlePause : handleStart}
                  className="inline-flex min-w-36 items-center justify-center gap-2 rounded-xl bg-[#B52D32] px-6 py-3.5 font-semibold text-white transition hover:bg-[#982328] focus:outline-none focus:ring-4 focus:ring-[#B52D32]/20"
                >
                  {isRunning ? (
                    <>
                      <BiPause size={21} />
                      Pause
                    </>
                  ) : (
                    <>
                      <BiPlay size={21} />
                      {remainingSeconds === 0 ? "Start again" : "Start"}
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleReset}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-5 py-3.5 font-semibold transition hover:bg-[#FAF9F6]"
                >
                  <BiRefresh size={20} />
                  Reset
                </button>

                {isRingtonePlaying && (
                  <button
                    type="button"
                    onClick={stopRingtone}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#B52D32]/30 bg-[#F8E8E6] px-5 py-3.5 font-semibold text-[#B52D32] transition hover:bg-[#F2D9D6]"
                  >
                    Stop ringtone
                  </button>
                )}
              </div>
            </div>

            <div className="border-t border-zinc-100 pt-6">
              <p className="mb-3 text-center text-xs font-semibold uppercase tracking-[0.16em] text-zinc-400">
                Switch session
              </p>

              <div className="grid grid-cols-3 gap-2">
                {(
                  [
                    ["focus", "Focus"],
                    ["shortBreak", "Short break"],
                    ["longBreak", "Long break"],
                  ] as const
                ).map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handleModeChange(key)}
                    className={`rounded-xl px-2 py-3 text-sm font-semibold transition sm:px-4 ${
                      mode === key
                        ? "bg-[#F8E8E6] text-[#B52D32]"
                        : "bg-[#FAF9F6] text-zinc-600 hover:bg-zinc-100"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </section>

          <aside className="space-y-5">
            <section className="rounded-3xl bg-[#B52D32] p-6 text-white sm:p-7">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15">
                  <BiCheckCircle size={25} />
                </div>

                <div>
                  <h2 className="font-bold">Your progress</h2>
                  <p className="text-sm text-white/75">Every session counts.</p>
                </div>
              </div>

              <div className="mt-7 grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-white/10 p-4">
                  <p className="text-sm text-white/75">Sessions</p>
                  <p className="mt-1 text-3xl font-bold">{completedSessions}</p>
                </div>

                <div className="rounded-2xl bg-white/10 p-4">
                  <p className="text-sm text-white/75">Focus time</p>
                  <p className="mt-1 text-3xl font-bold">
                    {Math.floor(totalFocusSeconds / 3600) > 0
                      ? `${Math.floor(totalFocusSeconds / 3600)}h`
                      : `${Math.floor(totalFocusSeconds / 60)}m`}
                  </p>
                </div>
              </div>

              <p className="mt-5 text-sm leading-6 text-white/80">
                Build a consistent study habit. Small, focused sessions can make
                a big difference over time.
              </p>
            </section>

            <section className="rounded-3xl border border-zinc-200 bg-white p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F8E8E6] text-[#B52D32]">
                  <BiTimer size={23} />
                </div>

                <h2 className="font-bold">Your routine</h2>
              </div>

              <div className="mt-5 space-y-4">
                {[
                  {
                    number: "01",
                    title: "Choose one task",
                    text: "Know what you want to finish.",
                  },
                  {
                    number: "02",
                    title: "Focus without distractions",
                    text: "Give your attention to one thing.",
                  },
                  {
                    number: "03",
                    title: "Take a real break",
                    text: "Rest before your next session.",
                  },
                ].map((item) => (
                  <div key={item.number} className="flex gap-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#FAF9F6] text-xs font-bold text-[#B52D32]">
                      {item.number}
                    </span>

                    <div>
                      <h3 className="text-sm font-semibold">{item.title}</h3>
                      <p className="mt-1 text-sm leading-5 text-zinc-500">
                        {item.text}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </aside>
        </div>

        <p className="text-center text-xs leading-5 text-zinc-400">
          Your timer settings and progress are saved in this browser on this
          device. Clearing browser data may erase them.
        </p>
      </div>
    </div>
  );
}
