"use client";

import { useMemo } from "react";

interface ActivityDay {
  date: string;
  count: number;
}

interface ActivityHeatmapProps {
  activityLog: ActivityDay[];
  weeks?: number;
}

function getIntensity(count: number): string {
  if (count === 0) return "bg-white/5 border-white/5";
  if (count === 1) return "bg-purple-500/30 border-purple-500/20";
  if (count === 2) return "bg-purple-500/55 border-purple-500/40";
  if (count >= 3) return "bg-purple-500 border-purple-400/60";
  return "bg-white/5";
}

export default function ActivityHeatmap({ activityLog, weeks = 26 }: ActivityHeatmapProps) {
  const cells = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const logMap: Record<string, number> = {};
    activityLog.forEach(d => { logMap[d.date] = d.count; });

    // Build a grid: last `weeks` full weeks + days so far this week
    const totalDays = weeks * 7;
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - totalDays + 1);

    const grid: { date: string; count: number; dayOfWeek: number }[] = [];
    for (let d = new Date(startDate); d <= today; d.setDate(d.getDate() + 1)) {
      const iso = d.toISOString().split("T")[0];
      grid.push({ date: iso, count: logMap[iso] ?? 0, dayOfWeek: d.getDay() });
    }
    return grid;
  }, [activityLog, weeks]);

  const totalActiveDays = activityLog.filter(d => d.count > 0).length;
  const totalSessions = activityLog.reduce((sum, d) => sum + d.count, 0);

  // Split into columns (weeks)
  const columns: typeof cells[] = [];
  let current: typeof cells = [];
  cells.forEach((cell, i) => {
    current.push(cell);
    if (current.length === 7 || i === cells.length - 1) {
      columns.push(current);
      current = [];
    }
  });

  const dayLabels = ["S", "M", "T", "W", "T", "F", "S"];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-white/70 uppercase tracking-widest">
          Activity
        </h3>
        <div className="flex gap-4 text-xs text-white/40">
          <span>{totalActiveDays} active days</span>
          <span>{totalSessions} total sessions</span>
        </div>
      </div>

      <div className="flex gap-1 overflow-x-auto pb-2">
        {/* Day labels */}
        <div className="flex flex-col gap-[3px] mr-1 mt-0">
          {dayLabels.map((d, i) => (
            <div
              key={i}
              className="w-3 h-3 flex items-center justify-center text-[9px] text-white/25 font-bold"
            >
              {i % 2 === 1 ? d : ""}
            </div>
          ))}
        </div>

        {/* Grid columns */}
        {columns.map((col, colIdx) => (
          <div key={colIdx} className="flex flex-col gap-[3px]">
            {Array.from({ length: 7 }, (_, dayIdx) => {
              const cell = col.find(c => c.dayOfWeek === dayIdx);
              if (!cell) {
                return (
                  <div
                    key={dayIdx}
                    className="w-3 h-3 rounded-[2px] bg-transparent"
                  />
                );
              }
              return (
                <div
                  key={dayIdx}
                  title={`${cell.date}: ${cell.count} session${cell.count !== 1 ? "s" : ""}`}
                  className={`w-3 h-3 rounded-[2px] border cursor-pointer transition-transform hover:scale-125 ${getIntensity(cell.count)}`}
                />
              );
            })}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-2 text-[10px] text-white/30">
        <span>Less</span>
        {[0, 1, 2, 3].map(v => (
          <div
            key={v}
            className={`w-3 h-3 rounded-[2px] border ${getIntensity(v)}`}
          />
        ))}
        <span>More</span>
      </div>
    </div>
  );
}
