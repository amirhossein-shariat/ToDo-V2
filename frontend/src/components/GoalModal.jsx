import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

export default function GoalModal({ open, onClose, onSubmit, initialGoal }) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    setTitle(initialGoal?.title || '')
    setDescription(initialGoal?.description || '')
    setError('')
  }, [open, initialGoal])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!title.trim()) {
      setError('عنوان هدف را وارد کنید')
      return
    }
    onSubmit({ title: title.trim(), description: description.trim() || null })
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
              {initialGoal ? 'ویرایش هدف' : 'هدف جدید'}
            </h2>

            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="عنوان هدف (مثلاً یادگیری پایتون)"
              className="mb-3 w-full rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-white placeholder-white/40 outline-none focus:border-sky-400"
            />

            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
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
