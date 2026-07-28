import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, isToday } from 'date-fns'
import {
  gregorianToJalali,
  jalaliToGregorian,
  jalaliMonthLength,
  addJalaliMonths,
  formatJalaliMonthYear,
} from '../utils/jalali'
import { WEEK_DAYS } from '../constants'

function toDateStr(d) {
  return format(d, 'yyyy-MM-dd')
}

export default function DatePickerModal({ open, onClose, onSelect, initialDate }) {
  const [viewDate, setViewDate] = useState(initialDate || new Date())

  if (!open) return null

  const { jy, jm } = gregorianToJalali(viewDate)
  const monthStart = jalaliToGregorian(jy, jm, 1)
  const monthEnd = jalaliToGregorian(jy, jm, jalaliMonthLength(jy, jm))
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 6 })
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 6 })
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd })

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-sm rounded-3xl border border-white/20 bg-white/10 p-6 text-right shadow-2xl backdrop-blur-2xl"
        >
          <h2 className="mb-4 text-lg font-bold text-white">انتخاب تاریخ</h2>

          <div className="mb-3 flex items-center justify-between">
            <button
              onClick={() => setViewDate((d) => addJalaliMonths(d, -1))}
              className="rounded-lg p-2 text-white/60 hover:bg-white/10"
            >
              ▶
            </button>
            <p className="font-medium text-white">{formatJalaliMonthYear(viewDate)}</p>
            <button
              onClick={() => setViewDate((d) => addJalaliMonths(d, 1))}
              className="rounded-lg p-2 text-white/60 hover:bg-white/10"
            >
              ◀
            </button>
          </div>

          <div className="mb-2 grid grid-cols-7 gap-1 text-center text-[11px] text-white/40">
            {WEEK_DAYS.map((label) => (
              <span key={label}>{label[0]}</span>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {days.map((day) => {
              const dayJalali = gregorianToJalali(day)
              const inMonth = dayJalali.jy === jy && dayJalali.jm === jm
              return (
                <button
                  key={toDateStr(day)}
                  onClick={() => onSelect(toDateStr(day))}
                  className={`aspect-square rounded-lg text-xs font-medium transition-colors ${
                    isToday(day) ? 'ring-1 ring-sky-400' : ''
                  } ${inMonth ? 'text-white hover:bg-sky-500/30' : 'text-white/25 hover:bg-white/10'}`}
                >
                  {dayJalali.jd}
                </button>
              )
            })}
          </div>

          <button
            onClick={onClose}
            className="mt-4 w-full rounded-xl bg-white/5 py-2 text-sm text-white/60 hover:bg-white/10"
          >
            انصراف
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
