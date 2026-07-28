import { useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { format, startOfWeek, addDays } from 'date-fns'
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  Line,
} from 'recharts'
import { getRangeSummary, getTaskStreaks, getGoals } from '../api'
import { onSyncStatus } from '../offline/sync'
import { WEEK_DAYS } from '../constants'
import { gregorianToJalali, jalaliToGregorian, jalaliMonthLength } from '../utils/jalali'
import ReportModal from './ReportModal'
import TagBreakdownWidget from './TagBreakdownWidget'
import GoalsStatsWidget from './GoalsStatsWidget'

function toDateStr(d) {
  return format(d, 'yyyy-MM-dd')
}

const chartTooltipStyle = {
  background: 'rgba(15, 23, 42, 0.9)',
  border: '1px solid rgba(255,255,255,0.15)',
  borderRadius: 12,
  color: '#fff',
  fontSize: 12,
  direction: 'rtl',
}

export default function StatsPage() {
  const today = useMemo(() => new Date(), [])
  const weekStart = startOfWeek(today, { weekStartsOn: 6 })
  const prevWeekStart = addDays(weekStart, -7)

  const { jy, jm } = gregorianToJalali(today)
  const monthStart = jalaliToGregorian(jy, jm, 1)
  const monthEnd = jalaliToGregorian(jy, jm, jalaliMonthLength(jy, jm))

  const [weekData, setWeekData] = useState([])
  const [monthSummaries, setMonthSummaries] = useState([])
  const [prevWeekTotals, setPrevWeekTotals] = useState(null)
  const [streaks, setStreaks] = useState([])
  const [loading, setLoading] = useState(true)
  const [reportOpen, setReportOpen] = useState(false)
  const [reportData, setReportData] = useState(null)

  const loadedRef = useRef(false)

  useEffect(() => {
    const loadStats = () => {
      if (!loadedRef.current) setLoading(true)
      Promise.all([
        getRangeSummary(toDateStr(weekStart), toDateStr(addDays(weekStart, 6))),
        getRangeSummary(toDateStr(monthStart), toDateStr(monthEnd)),
        getRangeSummary(toDateStr(prevWeekStart), toDateStr(addDays(prevWeekStart, 6))),
        getTaskStreaks(),
      ])
        .then(([week, month, prevWeek, streakList]) => {
          setWeekData(
            week.map((row, idx) => ({
              ...row,
              label: WEEK_DAYS[idx],
              percent: row.total > 0 ? Math.round((row.done / row.total) * 100) : 0,
            })),
          )
          setMonthSummaries(month)
          setPrevWeekTotals(
            prevWeek.reduce(
              (acc, r) => ({ done: acc.done + r.done, total: acc.total + r.total }),
              { done: 0, total: 0 },
            ),
          )
          setStreaks(streakList.filter((s) => s.streak > 0).sort((a, b) => b.streak - a.streak))
        })
        .finally(() => {
          loadedRef.current = true
          setLoading(false)
        })
    }

    loadStats()
    return onSyncStatus((status) => {
      if (status === 'synced' || status === 'partial') loadStats()
    })
  }, [toDateStr(weekStart), toDateStr(monthStart), toDateStr(monthEnd)])

  const weeklyTrend = useMemo(() => {
    const groups = []
    monthSummaries.forEach((row, idx) => {
      const groupIdx = Math.floor(idx / 7)
      if (!groups[groupIdx]) groups[groupIdx] = { done: 0, total: 0, days: 0 }
      groups[groupIdx].done += row.done
      groups[groupIdx].total += row.total
      groups[groupIdx].days += 1
    })
    return groups.map((g, idx) => ({
      label: `هفته ${idx + 1}`,
      percent: g.total > 0 ? Math.round((g.done / g.total) * 100) : 0,
      done: g.done,
      total: g.total,
    }))
  }, [monthSummaries])

  const currentWeekTotals = weekData.reduce(
    (acc, r) => ({ done: acc.done + r.done, total: acc.total + r.total }),
    { done: 0, total: 0 },
  )
  const currentPercent =
    currentWeekTotals.total > 0 ? Math.round((currentWeekTotals.done / currentWeekTotals.total) * 100) : 0
  const prevPercent =
    prevWeekTotals && prevWeekTotals.total > 0
      ? Math.round((prevWeekTotals.done / prevWeekTotals.total) * 100)
      : 0
  const delta = currentPercent - prevPercent

  const handleOpenReport = async () => {
    const goals = await getGoals()
    setReportData({ weekData, weeklyTrend, streaks, goals })
    setReportOpen(true)
  }

  if (loading) {
    return <p className="text-center text-white/40">در حال بارگذاری...</p>
  }

  return (
    <div className="flex-1 space-y-4 pb-24">
      <div className="rounded-2xl border border-white/15 bg-white/5 p-4 backdrop-blur-lg">
        <h3 className="mb-3 font-medium text-white">وضعیت روزهای این هفته</h3>
        <ResponsiveContainer width="100%" height={220}>
          <ComposedChart data={weekData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" vertical={false} />
            <XAxis dataKey="label" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis
              yAxisId="count"
              tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              width={26}
              allowDecimals={false}
            />
            <YAxis
              yAxisId="percent"
              orientation="right"
              tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              width={30}
              domain={[0, 100]}
            />
            <Tooltip
              contentStyle={chartTooltipStyle}
              formatter={(value, name) =>
                name === 'میزان تکمیل' ? [`${value}%`, name] : [value, name]
              }
            />
            <Legend wrapperStyle={{ fontSize: 11, color: 'rgba(255,255,255,0.6)' }} />
            <Bar yAxisId="count" dataKey="total" name="کل تسک‌ها" fill="rgba(255,255,255,0.2)" radius={[6, 6, 0, 0]} />
            <Bar yAxisId="count" dataKey="done" name="انجام‌شده" fill="#38bdf8" radius={[6, 6, 0, 0]} />
            <Line yAxisId="percent" type="monotone" dataKey="percent" name="میزان تکمیل" stroke="#34ffb0" strokeWidth={2.5} dot={{ r: 4, fill: '#34ffb0' }} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="rounded-2xl border border-white/15 bg-white/5 p-4 backdrop-blur-lg">
        <h3 className="mb-3 font-medium text-white">روند هفتگی این ماه</h3>
        <ResponsiveContainer width="100%" height={220}>
          <ComposedChart data={weeklyTrend}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" vertical={false} />
            <XAxis dataKey="label" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis
              yAxisId="count"
              tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              width={26}
              allowDecimals={false}
            />
            <YAxis
              yAxisId="percent"
              orientation="right"
              tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              width={30}
              domain={[0, 100]}
            />
            <Tooltip
              contentStyle={chartTooltipStyle}
              formatter={(value, name) =>
                name === 'میزان تکمیل' ? [`${value}%`, name] : [value, name]
              }
            />
            <Legend wrapperStyle={{ fontSize: 11, color: 'rgba(255,255,255,0.6)' }} />
            <Bar yAxisId="count" dataKey="total" name="کل تسک‌ها" fill="rgba(255,255,255,0.2)" radius={[6, 6, 0, 0]} />
            <Bar yAxisId="count" dataKey="done" name="انجام‌شده" fill="#38bdf8" radius={[6, 6, 0, 0]} />
            <Bar yAxisId="percent" dataKey="percent" name="میزان تکمیل" fill="#34ffb0" radius={[6, 6, 0, 0]} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="rounded-2xl border border-white/15 bg-white/5 p-4 backdrop-blur-lg">
        <h3 className="mb-3 font-medium text-white">مقایسه این هفته با هفته قبل</h3>
        <div className="flex items-center justify-between">
          <div className="text-center">
            <p className="text-xs text-white/40">هفته قبل</p>
            <p className="text-2xl font-bold text-white/70">{prevPercent}%</p>
            <p className="text-xs text-white/40">
              {prevWeekTotals?.done ?? 0} از {prevWeekTotals?.total ?? 0} تسک
            </p>
          </div>
          <div
            className={`rounded-full px-3 py-1 text-sm font-medium ${
              delta >= 0 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'
            }`}
          >
            {delta >= 0 ? '▲' : '▼'} {Math.abs(delta)}%
          </div>
          <div className="text-center">
            <p className="text-xs text-white/40">این هفته</p>
            <p className="text-2xl font-bold text-sky-300">{currentPercent}%</p>
            <p className="text-xs text-white/40">
              {currentWeekTotals.done} از {currentWeekTotals.total} تسک
            </p>
          </div>
        </div>
      </div>

      <TagBreakdownWidget />

      <GoalsStatsWidget />

      {streaks.length > 0 && (
        <div className="rounded-2xl border border-white/15 bg-white/5 p-4 backdrop-blur-lg">
          <h3 className="mb-3 font-medium text-white">رشته‌های پیوسته (Streak)</h3>
          <div className="space-y-2">
            {streaks.map((s) => (
              <div key={s.id} className="flex items-center justify-between text-sm">
                <span className="text-white/80">{s.title}</span>
                <span className="flex items-center gap-1 font-medium text-amber-300">
                  🔥 {s.streak} روز
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <motion.button
        onClick={handleOpenReport}
        whileTap={{ scale: 0.97 }}
        whileHover={{ scale: 1.01 }}
        className="flex w-full items-center justify-center gap-2 rounded-2xl border border-sky-400/20 bg-sky-500/10 py-3.5 text-sm font-medium text-sky-200 backdrop-blur-lg transition-colors hover:bg-sky-500/20"
      >
        <svg
          width="17"
          height="17"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 3v12" />
          <path d="M7 10l5 5 5-5" />
          <path d="M5 20h14" />
        </svg>
        دانلود گزارش کامل
      </motion.button>

      <ReportModal open={reportOpen} onClose={() => setReportOpen(false)} data={reportData} />
    </div>
  )
}
