
"use client";

import { useEffect, useState } from "react";

type AssignmentCountdownProps = {
  dueDate: string | Date | null;
};

function getTimeRemaining(dueDate: string | Date | null) {
  if (!dueDate) return null;

  const difference = new Date(dueDate).getTime() - Date.now();

  if (!Number.isFinite(difference)) return null;
  if (difference <= 0) return null;

  const totalSeconds = Math.floor(difference / 1000);

  return {
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
  };
}

export default function AssignmentCountdown({
  dueDate,
}: AssignmentCountdownProps) {
  const [remaining, setRemaining] = useState(() =>
    getTimeRemaining(dueDate),
  );

  useEffect(() => {
    const update = () => {
      setRemaining(getTimeRemaining(dueDate));
    };

    update();

    const timer = window.setInterval(update, 1000);

    return () => window.clearInterval(timer);
  }, [dueDate]);

  if (!dueDate) {
    return (
      <span className="text-sm text-gray-500">
        No deadline set
      </span>
    );
  }

  if (!remaining) {
    return (
      <span className="inline-flex rounded-full bg-red-100 px-3 py-1 text-sm font-semibold text-red-700">
        Overdue
      </span>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {[
        { label: "Days", value: remaining.days },
        { label: "Hours", value: remaining.hours },
        { label: "Minutes", value: remaining.minutes },
        { label: "Seconds", value: remaining.seconds },
      ].map((item) => (
        <div
          key={item.label}
          className="min-w-[62px] rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-center"
        >
          <div className="text-xl font-bold tabular-nums text-red-700">
            {String(item.value).padStart(2, "0")}
          </div>
          <div className="text-xs text-gray-600">
            {item.label}
          </div>
        </div>
      ))}
    </div>
  );
}
