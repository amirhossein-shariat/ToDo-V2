import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
} from 'date-fns'
import { getRangeSummary } from '../api'
import { WEEK_DAYS } from '../constants'

function toDateStr(d) {
  return format(d, 'yyyy-MM-dd')
}

export default function MonthlyView({ currentDate, setCurrentDate, onSelectDay }) {
  const [summaries, setSummaries] = useState({})
  const [loading, setLoading] = useState(true)

  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 6 })
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 6 })
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd })

  useEffect(() => {
    setLoading(true)
    getRangeSummary(toDateStr(gridStart), toDateStr(gridEnd))
      .then((rows) => {
        const map = {}
        rows.forEach((r) => (map[r.date] = r))
        setSummaries(map)
      })
      .finally(() => setLoading(false))
  }, [toDateStr(gridStart), toDateStr(gridEnd)])

  const today = new Date()

  return (
    <div className="flex flex-1 flex-col">
      <div className="mb-4 flex items-center justify-between rounded-2xl border border-white/15 bg-white/5 p-3 backdrop-blur-lg">
        <button
          onClick={() => setCurrentDate((d) => addMonths(d, -1))}
          className="rounded-lg p-2 text-white/60 hover:bg-white/10"
        >
          ◀
        </button>
        <p className="font-medium text-white">{format(currentDate, 'yyyy/MM')}</p>
        <button
          onClick={() => setCurrentDate((d) => addMonths(d, 1))}
          className="rounded-lg p-2 text-white/60 hover:bg-white/10"
        >
          ▶
        </button>
      </div>

      <div className="mb-2 grid grid-cols-7 gap-1 text-center text-[11px] text-white/40">
        {WEEK_DAYS.map((label) => (
          <span key={label}>{label[0]}</span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1 pb-24">
        {days.map((day) => {
          const key = toDateStr(day)
          const summary = summaries[key]
          const ratio = summary && summary.total > 0 ? summary.done / summary.total : 0
          const inMonth = isSameMonth(day, currentDate)
          const isToday = isSameDay(day, today)

          return (
            <motion.button
              key={key}
              onClick={() => onSelectDay(day)}
              whileTap={{ scale: 0.9 }}
              className={`aspect-square rounded-lg text-xs font-medium transition-colors ${
                isToday ? 'ring-1 ring-sky-400' : ''
              } ${inMonth ? 'text-white' : 'text-white/25'}`}
              style={{
                backgroundColor:
                  summary && summary.total > 0
                    ? `rgba(56, 189, 248, ${0.15 + ratio * 0.65})`
                    : 'rgba(255,255,255,0.05)',
              }}
            >
              {format(day, 'd')}
            </motion.button>
          )
        })}
      </div>

      {loading && <p className="text-center text-white/40">در حال بارگذاری...</p>}
    </div>
  )
}
