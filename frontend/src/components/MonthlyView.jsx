import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay } from 'date-fns'
import { getRangeSummary } from '../api'
import { WEEK_DAYS } from '../constants'
import {
  gregorianToJalali,
  jalaliToGregorian,
  jalaliMonthLength,
  addJalaliMonths,
  formatJalaliMonthYear,
} from '../utils/jalali'
import DateNav from './DateNav'

function toDateStr(d) {
  return format(d, 'yyyy-MM-dd')
}

export default function MonthlyView({ currentDate, setCurrentDate, onSelectDay }) {
  const [summaries, setSummaries] = useState({})
  const [loading, setLoading] = useState(true)

  const { jy, jm } = gregorianToJalali(currentDate)
  const monthStart = jalaliToGregorian(jy, jm, 1)
  const monthEnd = jalaliToGregorian(jy, jm, jalaliMonthLength(jy, jm))
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
      <DateNav
        animKey={`${jy}-${jm}`}
        label={formatJalaliMonthYear(currentDate)}
        onPrev={() => setCurrentDate((d) => addJalaliMonths(d, -1))}
        onNext={() => setCurrentDate((d) => addJalaliMonths(d, 1))}
      />

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
          const dayJalali = gregorianToJalali(day)
          const inMonth = dayJalali.jy === jy && dayJalali.jm === jm
          const isToday = isSameDay(day, today)
          const isPast = day < today && !isToday

          const fullyDone = summary && summary.total > 0 && summary.done === summary.total
          const isGreen = (isPast || isToday) && fullyDone
          const isRed = isPast && summary?.has_incomplete_once

          let bg
          let glow = 'none'
          if (isGreen) {
            bg = 'linear-gradient(135deg, #34ffb0 0%, #10d98a 55%, #06b876 100%)'
            glow = '0 0 4px rgba(16, 217, 138, 0.45)'
          } else if (isRed) {
            bg = 'rgba(248, 113, 113, 0.55)'
          } else if (summary && summary.total > 0) {
            bg = `rgba(56, 189, 248, ${0.15 + ratio * 0.65})`
          } else {
            bg = 'rgba(255,255,255,0.05)'
          }

          return (
            <motion.button
              key={key}
              onClick={() => onSelectDay(day)}
              whileTap={{ scale: 0.9 }}
              animate={isGreen ? { scale: [1, 1.08, 1] } : { scale: 1 }}
              transition={isGreen ? { duration: 0.5, ease: 'easeOut' } : {}}
              className={`aspect-square rounded-lg text-xs font-bold transition-colors ${
                isToday && !isGreen ? 'ring-1 ring-sky-400' : ''
              } ${isGreen ? 'text-emerald-950' : inMonth ? 'text-white' : 'text-white/25'}`}
              style={{ background: bg, boxShadow: glow }}
            >
              {dayJalali.jd}
            </motion.button>
          )
        })}
      </div>

      {loading && <p className="text-center text-white/40">در حال بارگذاری...</p>}
    </div>
  )
}
