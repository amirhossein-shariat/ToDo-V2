import { useState, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { format, addDays } from 'date-fns'
import { DURATION_PRESETS } from '../constants'
import { formatJalali } from '../utils/jalali'

export default function DurationModal({ open, onClose, task, onSubmit }) {
  const [customDate, setCustomDate] = useState('')

  useEffect(() => {
    if (open) setCustomDate(task?.end_date || '')
  }, [open, task])

  if (!task) return null

  const applyPreset = (days) => {
    onSubmit(format(addDays(new Date(), days), 'yyyy-MM-dd'))
  }

  const applyCustom = (e) => {
    e.preventDefault()
    if (customDate) onSubmit(customDate)
  }

  const terminateNow = () => {
    if (!confirm('این تسک از امروز به بعد کاملاً متوقف می‌شود (تاریخچه قبلی حفظ می‌ماند). ادامه می‌دهید؟')) return
    onSubmit(format(addDays(new Date(), -1), 'yyyy-MM-dd'))
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
            className="w-full max-w-sm rounded-3xl border border-white/20 bg-white/10 p-6 text-right shadow-2xl backdrop-blur-2xl"
          >
            <h2 className="mb-1 text-lg font-bold text-white">تنظیم مدت تکرار</h2>
            <p className="mb-4 text-xs text-white/50">{task.title}</p>

            <p className="mb-3 text-sm text-white/60">
              وضعیت فعلی:{' '}
              <span className="text-white">
                {task.end_date ? `تا ${formatJalali(new Date(task.end_date))}` : 'نامحدود'}
              </span>
            </p>

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
              onClick={() => onSubmit(null)}
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
