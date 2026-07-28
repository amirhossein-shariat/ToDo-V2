import { useState, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { format, addDays } from 'date-fns'
import { DURATION_PRESETS, WEEK_DAYS } from '../constants'
import { formatJalali } from '../utils/jalali'

export default function DurationModal({ open, onClose, task, onSubmit }) {
  const [customDate, setCustomDate] = useState('')
  const [recurrenceType, setRecurrenceType] = useState('daily')
  const [recurrenceDays, setRecurrenceDays] = useState([])
  const [patternError, setPatternError] = useState('')

  useEffect(() => {
    if (!open || !task) return
    setCustomDate(task.end_date || '')
    setRecurrenceType(task.recurrence_type)
    setRecurrenceDays(task.recurrence_days || [])
    setPatternError('')
  }, [open, task])

  if (!task) return null

  const toggleDay = (idx) => {
    setRecurrenceDays((days) =>
      days.includes(idx) ? days.filter((d) => d !== idx) : [...days, idx],
    )
  }

  const applyPreset = (days) => {
    onSubmit({ end_date: format(addDays(new Date(), days), 'yyyy-MM-dd') })
  }

  const applyCustom = (e) => {
    e.preventDefault()
    if (customDate) onSubmit({ end_date: customDate })
  }

  const applyPattern = () => {
    if (recurrenceType === 'weekly_days' && recurrenceDays.length === 0) {
      setPatternError('حداقل یک روز را انتخاب کنید')
      return
    }
    onSubmit({
      recurrence_type: recurrenceType,
      recurrence_days: recurrenceType === 'weekly_days' ? recurrenceDays : null,
    })
  }

  const terminateNow = () => {
    if (!confirm('این تسک از امروز به بعد کاملاً متوقف می‌شود (تاریخچه قبلی حفظ می‌ماند). ادامه می‌دهید؟')) return
    onSubmit({ end_date: format(addDays(new Date(), -1), 'yyyy-MM-dd') })
  }

  return (
    <AnimatePresence>
      {open && (
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
            transition={{ duration: 0.2 }}
            onClick={(e) => e.stopPropagation()}
            className="max-h-[85vh] w-full max-w-sm overflow-y-auto rounded-3xl border border-white/20 bg-white/10 p-6 text-right shadow-2xl backdrop-blur-2xl"
          >
            <h2 className="mb-1 text-lg font-bold text-white">تنظیمات تکرار</h2>
            <p className="mb-4 text-xs text-white/50">{task.title}</p>

            <p className="mb-1.5 text-xs text-white/50">الگوی تکرار</p>
            <div className="mb-2 flex gap-2">
              {['daily', 'weekly_days'].map((type) => (
                <button
                  key={type}
                  onClick={() => setRecurrenceType(type)}
                  className={`flex-1 rounded-xl px-2 py-2 text-xs font-medium transition-colors ${
                    recurrenceType === type
                      ? 'bg-sky-500 text-white'
                      : 'bg-white/10 text-white/60 hover:bg-white/20'
                  }`}
                >
                  {type === 'daily' ? 'هر روز' : 'روزهای خاص'}
                </button>
              ))}
            </div>
            {recurrenceType === 'weekly_days' && (
              <div className="mb-2 flex flex-wrap gap-2">
                {WEEK_DAYS.map((label, idx) => (
                  <button
                    key={idx}
                    onClick={() => toggleDay(idx)}
                    className={`rounded-lg px-3 py-1.5 text-xs transition-colors ${
                      recurrenceDays.includes(idx)
                        ? 'bg-sky-500 text-white'
                        : 'bg-white/10 text-white/60 hover:bg-white/20'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}
            {patternError && <p className="mb-2 text-xs text-red-300">{patternError}</p>}
            <button
              onClick={applyPattern}
              className="mb-4 w-full rounded-xl bg-sky-500 py-2 text-sm font-medium text-white hover:bg-sky-400"
            >
              ذخیره الگوی تکرار
            </button>

            <div className="mb-3 border-t border-white/10 pt-3">
              <p className="mb-1.5 text-xs text-white/50">
                مدت تکرار — وضعیت فعلی:{' '}
                <span className="text-white">
                  {task.end_date ? `تا ${formatJalali(new Date(task.end_date))}` : 'نامحدود'}
                </span>
              </p>
            </div>

            <div className="mb-3 grid grid-cols-2 gap-2">
              {DURATION_PRESETS.map((p) => (
                <button
                  key={p.label}
                  onClick={() => applyPreset(p.days)}
                  className="rounded-xl bg-white/10 py-2 text-sm text-white hover:bg-sky-500/30"
                >
                  {p.label}
                </button>
              ))}
            </div>

            <button
              onClick={() => onSubmit({ end_date: null })}
              className="mb-4 w-full rounded-xl bg-white/10 py-2 text-sm text-white hover:bg-emerald-500/30"
            >
              نامحدود
            </button>

            <form onSubmit={applyCustom} className="flex gap-2">
              <input
                type="date"
                value={customDate}
                onChange={(e) => setCustomDate(e.target.value)}
                className="flex-1 rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-sm text-white outline-none focus:border-sky-400 [color-scheme:dark]"
              />
              <button
                type="submit"
                className="rounded-xl bg-sky-500 px-4 py-2 text-sm font-medium text-white hover:bg-sky-400"
              >
                ثبت
              </button>
            </form>

            <button
              onClick={terminateNow}
              className="mt-4 w-full rounded-xl bg-red-500/20 py-2 text-sm font-medium text-red-300 hover:bg-red-500/30"
            >
              حذف کامل تسک (از امروز به بعد)
            </button>

            <button
              onClick={onClose}
              className="mt-2 w-full rounded-xl bg-white/5 py-2 text-sm text-white/60 hover:bg-white/10"
            >
              بستن
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
