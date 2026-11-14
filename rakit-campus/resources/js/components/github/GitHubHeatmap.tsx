import React, { useMemo, useState } from 'react';

interface DayItem {
    date: string;
    count: number;
    level: number; // 0..4
    day_of_week?: number;
}

interface Props {
    days: DayItem[];
    totalCommits?: number;
    totalActiveDays?: number;
}

export default function GitHubHeatmap({ days = [], totalCommits = 0, totalActiveDays = 0 }: Props) {
    const [hoveredDay, setHoveredDay] = useState<DayItem | null>(null);

    // Group days into columns of 7 days (weeks)
    const weeks = useMemo(() => {
        if (!days || days.length === 0) return [];
        const result: DayItem[][] = [];
        let currentWeek: DayItem[] = [];

        days.forEach((day, idx) => {
            currentWeek.push(day);
            if (currentWeek.length === 7 || idx === days.length - 1) {
                result.push(currentWeek);
                currentWeek = [];
            }
        });

        return result;
    }, [days]);

    // Color mapper using RAKIT brand palette (Slate -> Electric Blue)
    const getLevelClass = (level: number) => {
        switch (level) {
            case 1:
                return 'bg-blue-100 border-blue-200';
            case 2:
                return 'bg-blue-300 border-blue-400';
            case 3:
                return 'bg-blue-500 border-blue-600';
            case 4:
                return 'bg-blue-600 border-blue-700 shadow-2xs';
            case 0:
            default:
                return 'bg-slate-100 border-slate-200/80';
        }
    };

    const monthLabels = useMemo(() => {
        const months: { label: string; colIndex: number }[] = [];
        let lastMonth = '';

        weeks.forEach((week, wIdx) => {
            if (week.length > 0) {
                const date = new Date(week[0].date);
                const month = date.toLocaleDateString('id-ID', { month: 'short' });
                if (month !== lastMonth) {
                    months.push({ label: month, colIndex: wIdx });
                    lastMonth = month;
                }
            }
        });

        return months;
    }, [weeks]);

    return (
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-2xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div>
                    <h3 className="text-xs sm:text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
                        <span>Peta Aktivitas Kontribusi (Heatmap 365 Hari)</span>
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                        Rekam jejak kompilasi push & commit tim dalam 1 tahun terakhir.
                    </p>
                </div>

                <div className="flex items-center gap-3 text-xs">
                    <span className="text-slate-500 text-[11px]">
                        <strong className="text-slate-900 font-bold">{totalCommits}</strong> commit dalam{' '}
                        <strong className="text-slate-900 font-bold">{totalActiveDays}</strong> hari aktif
                    </span>
                </div>
            </div>

            {/* Matrix Container */}
            <div className="overflow-x-auto no-scrollbar pt-2 pb-1">
                <div className="min-w-[720px] select-none">
                    {/* Month Header */}
                    <div className="flex text-[10px] text-slate-400 mb-1.5 h-4 relative">
                        {monthLabels.map((m, idx) => (
                            <span
                                key={idx}
                                style={{ marginLeft: idx === 0 ? `${m.colIndex * 14}px` : undefined }}
                                className="mr-6 font-semibold"
                            >
                                {m.label}
                            </span>
                        ))}
                    </div>

                    {/* Week Columns Grid */}
                    <div className="flex gap-[3.5px]">
                        {weeks.map((week, wIdx) => (
                            <div key={wIdx} className="flex flex-col gap-[3.5px]">
                                {week.map((day, dIdx) => (
                                    <div
                                        key={dIdx}
                                        onMouseEnter={() => setHoveredDay(day)}
                                        onMouseLeave={() => setHoveredDay(null)}
                                        className={`size-2.5 sm:size-3 rounded-[3px] border transition-transform duration-100 hover:scale-125 cursor-pointer ${getLevelClass(
                                            day.level
                                        )}`}
                                    />
                                ))}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Tooltip & Legend Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-slate-100 text-[11px] text-slate-500">
                <div className="h-5 flex items-center font-medium">
                    {hoveredDay ? (
                        <span>
                            <strong className="text-slate-900 font-bold">{hoveredDay.count} commit</strong> pada{' '}
                            {new Date(hoveredDay.date).toLocaleDateString('id-ID', {
                                weekday: 'long',
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                            })}
                        </span>
                    ) : (
                        <span className="text-slate-400">Arahkan kursor pada kotak untuk melihat detail hari</span>
                    )}
                </div>

                <div className="flex items-center gap-1.5 self-end sm:self-auto text-[10px] font-semibold text-slate-400">
                    <span>Kurang</span>
                    <div className="size-2.5 rounded-[2px] bg-slate-100 border border-slate-200" />
                    <div className="size-2.5 rounded-[2px] bg-blue-100 border border-blue-200" />
                    <div className="size-2.5 rounded-[2px] bg-blue-300 border border-blue-400" />
                    <div className="size-2.5 rounded-[2px] bg-blue-500 border border-blue-600" />
                    <div className="size-2.5 rounded-[2px] bg-blue-600 border border-blue-700" />
                    <span>Sering</span>
                </div>
            </div>
        </div>
    );
}
