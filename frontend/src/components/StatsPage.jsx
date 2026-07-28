import { useEffect, useMemo, useState } from 'react'
import { format, startOfWeek, addDays } from 'date-fns'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  LineChart,
  Line,
} from 'recharts'
import { getRangeSummary, getTaskStreaks, getGoals } from '../api'
import { onSyncStatus } from '../offline/sync'
import { WEEK_DAYS } from '../constants'
import { gregorianToJalali, jalaliToGregorian, jalaliMonthLength } from '../utils/jalali'
import ReportModal from './ReportModal'
import TagBreakdownWidget from './TagBreakdownWidget'

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

  useEffect(() => {
    const loadStats = () => {
      setLoading(true)
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
        .finally(() => setLoading(false))
    }

    loadStats()
    return onSyncStatus((status) => {
      if (status === 'synced' || status === 'partial') loadStats()
    })
  }, [toDateStr(weekStart), toDateStr(monthStart), toDateStr(monthEnd)])

  const weeklyTrend = useMemo(() => {
    const groups = new Map()
    for (const row of monthSummaries) {
      const day = new Date(row.date)
      const key = toDateStr(startOfWeek(day, { weekStartsOn: 6 }))
      if (!groups.has(key)) groups.set(key, { done: 0, total: 0 })
      const g = groups.get(key)
      g.done += row.done
      g.total += row.total
    }
    return Array.from(groups.entries())
      .sort(([a], [b]) => (a < b ? -1 : 1))
      .map(([, g], idx) => ({
        label: `هفته ${idx + 1}`,
        percent: g.total > 0 ? Math.round((g.done / g.total) * 100) : 0,
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
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={weekData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" vertical={false} />
            <XAxis dataKey="label" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis
              tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              width={30}
              domain={[0, 100]}
            />
            <Tooltip
              contentStyle={chartTooltipStyle}
              formatter={(value) => [`${value}%`, 'میزان تکمیل']}
            />
            <Bar dataKey="percent" fill="#38bdf8" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="rounded-2xl border border-white/15 bg-white/5 p-4 backdrop-blur-lg">
        <h3 className="mb-3 font-medium text-white">روند هفتگی این ماه</h3>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={weeklyTrend}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" vertical={false} />
            <XAxis dataKey="label" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis
              tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              width={30}
              domain={[0, 100]}
            />
            <Tooltip contentStyle={chartTooltipStyle} formatter={(value) => [`${value}%`, 'میزان تکمیل']} />
            <Line type="monotone" dataKey="percent" stroke="#38bdf8" strokeWidth={2.5} dot={{ r: 4, fill: '#38bdf8' }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="rounded-2xl border border-white/15 bg-white/5 p-4 backdrop-blur-lg">
        <h3 className="mb-3 font-medium text-white">مقایسه این هفته با هفته قبل</h3>
        <div className="flex items-center justify-between">
          <div className="text-center">
            <p className="text-xs text-white/40">هفته قبل</p>
            <p className="text-2xl font-bold text-white/70">{prevPercent}%</p>
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
          </div>
        </div>
      </div>

      <TagBreakdownWidget />

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

      <button
        onClick={handleOpenReport}
        className="w-full rounded-2xl border border-white/15 bg-sky-500/20 p-4 font-medium text-sky-200 backdrop-blur-lg hover:bg-sky-500/30"
      >
        📄 دانلود گزارش کامل (PDF / Word)
      </button>

      <ReportModal open={reportOpen} onClose={() => setReportOpen(false)} data={reportData} />
    </div>
  )
}
