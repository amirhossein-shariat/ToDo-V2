import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { format, startOfWeek, addDays, isSameDay } from 'date-fns'
import { getRangeSummary } from '../api'
import { WEEK_DAYS } from '../constants'
import { formatJalali } from '../utils/jalali'
import DateNav from './DateNav'

function toDateStr(d) {
  return format(d, 'yyyy-MM-dd')
}

export default function WeeklyView({ currentDate, setCurrentDate, onSelectDay }) {
  const [summaries, setSummaries] = useState({})
  const [loading, setLoading] = useState(true)

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 6 })
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  useEffect(() => {
    setLoading(true)
    getRangeSummary(toDateStr(weekStart), toDateStr(addDays(weekStart, 6)))
      .then((rows) => {
        const map = {}
        rows.forEach((r) => (map[r.date] = r))
        setSummaries(map)
      })
      .finally(() => setLoading(false))
  }, [toDateStr(weekStart)])

  const today = new Date()

  return (
    <div className="flex flex-1 flex-col">
      <DateNav
        animKey={toDateStr(weekStart)}
        label={`${formatJalali(weekStart)} تا ${formatJalali(addDays(weekStart, 6))}`}
        onPrev={() => setCurrentDate((d) => addDays(d, -7))}
        onNext={() => setCurrentDate((d) => addDays(d, 7))}
      />

      <div className="grid flex-1 grid-cols-1 gap-3 pb-24 sm:grid-cols-2">
        {days.map((day, idx) => {
          const key = toDateStr(day)
          const summary = summaries[key]
          const ratio = summary && summary.total > 0 ? summary.done / summary.total : 0
          const isToday = isSameDay(day, today)

          return (
            <motion.button
              key={key}
              onClick={() => onSelectDay(day)}
              whileTap={{ scale: 0.97 }}
              className={`flex items-center gap-4 rounded-2xl border p-4 text-right backdrop-blur-lg transition-colors ${
                isToday
                  ? 'border-sky-400/60 bg-sky-500/10'
                  : 'border-white/15 bg-white/5 hover:bg-white/10'
              }`}
            >
              <div className="relative h-14 w-14 shrink-0">
                <svg viewBox="0 0 36 36" className="h-14 w-14 -rotate-90">
                  <circle cx="18" cy="18" r="15.5" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="3" />
                  <motion.circle
                    cx="18"
                    cy="18"
                    r="15.5"
                    fill="none"
                    stroke="#38bdf8"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeDasharray={2 * Math.PI * 15.5}
                    initial={{ strokeDashoffset: 2 * Math.PI * 15.5 }}
                    animate={{ strokeDashoffset: 2 * Math.PI * 15.5 * (1 - ratio) }}
                    transition={{ duration: 0.5 }}
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-white">
                  {summary ? `${summary.done}/${summary.total}` : '…'}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-white">{WEEK_DAYS[idx]}</p>
                <p className="text-xs text-white/50">{formatJalali(day)}</p>
              </div>
            </motion.button>
          )
        })}
      </div>

      {loading && <p className="text-center text-white/40">در حال بارگذاری...</p>}
    </div>
  )
}
