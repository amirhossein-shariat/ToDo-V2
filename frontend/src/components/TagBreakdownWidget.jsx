import { useEffect, useMemo, useState } from 'react'
import { format, startOfWeek, addDays } from 'date-fns'
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { getTagStats } from '../api'
import { onSyncStatus } from '../offline/sync'
import { TAG_COLORS, TAG_COLOR_FALLBACK } from '../constants'
import { gregorianToJalali, jalaliToGregorian, jalaliMonthLength } from '../utils/jalali'

function toDateStr(d) {
  return format(d, 'yyyy-MM-dd')
}

const PERIODS = [
  { key: 'day', label: 'روز' },
  { key: 'week', label: 'هفته' },
  { key: 'month', label: 'ماه' },
]

function getRange(period) {
  const today = new Date()
  if (period === 'day') {
    return [toDateStr(today), toDateStr(today)]
  }
  if (period === 'week') {
    const start = startOfWeek(today, { weekStartsOn: 6 })
    return [toDateStr(start), toDateStr(addDays(start, 6))]
  }
  const { jy, jm } = gregorianToJalali(today)
  const start = jalaliToGregorian(jy, jm, 1)
  const end = jalaliToGregorian(jy, jm, jalaliMonthLength(jy, jm))
  return [toDateStr(start), toDateStr(end)]
}

export default function TagBreakdownWidget() {
  const [period, setPeriod] = useState('week')
  const [stats, setStats] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = () => {
      setLoading(true)
      const [start, end] = getRange(period)
      getTagStats(start, end)
        .then(setStats)
        .finally(() => setLoading(false))
    }
    load()
    return onSyncStatus((status) => {
      if (status === 'synced' || status === 'partial') load()
    })
  }, [period])

  const total = stats.reduce((sum, s) => sum + s.count, 0)
  const chartData = useMemo(
    () =>
      stats
        .map((s) => ({
          name: s.tag || 'بدون برچسب',
          value: s.count,
          percent: total > 0 ? Math.round((s.count / total) * 100) : 0,
          color: s.tag ? TAG_COLORS[s.tag] || TAG_COLOR_FALLBACK : TAG_COLOR_FALLBACK,
        }))
        .sort((a, b) => b.value - a.value),
    [stats, total],
  )

  return (
    <div className="rounded-2xl border border-white/15 bg-white/5 p-4 backdrop-blur-lg">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-medium text-white">تفکیک برچسب‌ها (از ۱۰۰٪)</h3>
        <div className="flex gap-1 rounded-full bg-white/10 p-1">
          {PERIODS.map((p) => (
            <button
              key={p.key}
              onClick={() => setPeriod(p.key)}
              className={`rounded-full px-2.5 py-1 text-xs transition-colors ${
                period === p.key ? 'bg-sky-500 text-white' : 'text-white/60 hover:bg-white/10'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {loading && <p className="text-center text-white/40">در حال بارگذاری...</p>}

      {!loading && total === 0 && (
        <p className="text-center text-white/40">تسک تکمیل‌شده‌ای در این بازه ثبت نشده</p>
      )}

      {!loading && total > 0 && (
        <>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={chartData}
                dataKey="value"
                nameKey="name"
                innerRadius={45}
                outerRadius={75}
                paddingAngle={2}
              >
                {chartData.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: 'rgba(15, 23, 42, 0.9)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  borderRadius: 12,
                  color: '#fff',
                  fontSize: 12,
                  direction: 'rtl',
                }}
                formatter={(value, name, props) => [`${value} تسک (${props.payload.percent}%)`, name]}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-2 flex flex-wrap justify-center gap-x-4 gap-y-1">
            {chartData.map((entry) => (
              <div key={entry.name} className="flex items-center gap-1.5 text-xs text-white/70">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: entry.color }}
                />
                {entry.name} — {entry.value} تسک ({entry.percent}%)
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
