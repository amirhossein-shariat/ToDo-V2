import { useState, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { WEEK_DAYS } from '../constants'

const emptyForm = {
  title: '',
  description: '',
  recurrence_type: 'daily',
  recurrence_days: [],
  specific_date: '',
}

export default function TaskModal({ open, onClose, onSubmit, initialTask, defaultDate }) {
  const [form, setForm] = useState(emptyForm)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    if (initialTask) {
      setForm({
        title: initialTask.title,
        description: initialTask.description || '',
        recurrence_type: initialTask.recurrence_type,
        recurrence_days: initialTask.recurrence_days || [],
        specific_date: initialTask.specific_date || defaultDate,
      })
    } else {
      setForm({ ...emptyForm, specific_date: defaultDate, recurrence_days: [] })
    }
    setError('')
  }, [open, initialTask, defaultDate])

  const toggleDay = (idx) => {
    setForm((f) => ({
      ...f,
      recurrence_days: f.recurrence_days.includes(idx)
        ? f.recurrence_days.filter((d) => d !== idx)
        : [...f.recurrence_days, idx],
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.title.trim()) {
      setError('عنوان تسک را وارد کنید')
      return
    }
    if (form.recurrence_type === 'weekly_days' && form.recurrence_days.length === 0) {
      setError('حداقل یک روز را انتخاب کنید')
      return
    }
    if (form.recurrence_type === 'once' && !form.specific_date) {
      setError('تاریخ را انتخاب کنید')
      return
    }

    const payload = {
      title: form.title.trim(),
      description: form.description.trim() || null,
      recurrence_type: form.recurrence_type,
      recurrence_days: form.recurrence_type === 'weekly_days' ? form.recurrence_days : null,
      specific_date: form.recurrence_type === 'once' ? form.specific_date : null,
    }
    onSubmit(payload)
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
          <motion.form
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => e.stopPropagation()}
            onSubmit={handleSubmit}
            className="w-full max-w-sm rounded-3xl border border-white/20 bg-white/10 p-6 text-right shadow-2xl backdrop-blur-2xl"
          >
            <h2 className="mb-4 text-lg font-bold text-white">
              {initialTask ? 'ویرایش تسک' : 'تسک جدید'}
            </h2>

            <input
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="عنوان تسک"
              className="mb-3 w-full rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-white placeholder-white/40 outline-none focus:border-sky-400"
            />

            <div className="mb-3 flex gap-2">
              {['daily', 'weekly_days', 'once'].map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, recurrence_type: type }))}
                  className={`flex-1 rounded-xl px-2 py-2 text-xs font-medium transition-colors ${
                    form.recurrence_type === type
                      ? 'bg-sky-500 text-white'
                      : 'bg-white/10 text-white/60 hover:bg-white/20'
                  }`}
                >
                  {{ daily: 'هر روز', weekly_days: 'روزهای خاص', once: 'یک‌بار' }[type]}
                </button>
              ))}
            </div>

            {form.recurrence_type === 'weekly_days' && (
              <div className="mb-3 flex flex-wrap gap-2">
                {WEEK_DAYS.map((label, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => toggleDay(idx)}
                    className={`rounded-lg px-3 py-1.5 text-xs transition-colors ${
                      form.recurrence_days.includes(idx)
                        ? 'bg-sky-500 text-white'
                        : 'bg-white/10 text-white/60 hover:bg-white/20'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}

            {form.recurrence_type === 'once' && (
              <input
                type="date"
                value={form.specific_date}
                onChange={(e) => setForm((f) => ({ ...f, specific_date: e.target.value }))}
                className="mb-3 w-full rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-white outline-none focus:border-sky-400 [color-scheme:dark]"
              />
            )}

            <textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="توضیحات (اختیاری)"
              rows={2}
              className="mb-3 w-full resize-none rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-white placeholder-white/40 outline-none focus:border-sky-400"
            />

            {error && <p className="mb-3 text-sm text-red-300">{error}</p>}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-xl bg-white/10 py-2 text-white/70 hover:bg-white/20"
              >
                انصراف
              </button>
              <button
                type="submit"
                className="flex-1 rounded-xl bg-sky-500 py-2 font-medium text-white hover:bg-sky-400"
              >
                ذخیره
              </button>
            </div>
          </motion.form>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
