import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { createGoalTask, updateGoalTask, deleteGoalTask } from '../api'

export default function GoalDetail({ goal, onBack, onChanged, onEdit, onDelete }) {
  const [newTitle, setNewTitle] = useState('')
  const [busy, setBusy] = useState(false)

  const total = goal.tasks.length
  const done = goal.tasks.filter((t) => t.is_done).length
  const ratio = total > 0 ? done / total : 0

  const handleAdd = async (e) => {
    e.preventDefault()
    if (!newTitle.trim()) return
    setBusy(true)
    try {
      await createGoalTask(goal.id, newTitle.trim())
      setNewTitle('')
      onChanged()
    } finally {
      setBusy(false)
    }
  }

  const handleToggle = async (task) => {
    await updateGoalTask(task.id, { is_done: !task.is_done })
    onChanged()
  }

  const handleDeleteTask = async (task) => {
    await deleteGoalTask(task.id)
    onChanged()
  }

  return (
    <div className="flex flex-1 flex-col">
      <button
        onClick={onBack}
        className="mb-3 flex w-fit items-center gap-1 text-sm text-white/60 hover:text-white"
      >
        بازگشت به لیست اهداف ›
      </button>

      <div className="mb-4 rounded-2xl border border-white/15 bg-white/5 p-4 backdrop-blur-lg">
        <div className="mb-2 flex items-start justify-between gap-2">
          <div className="text-right">
            <h2 className="font-bold text-white">{goal.title}</h2>
            {goal.description && <p className="mt-1 text-sm text-white/50">{goal.description}</p>}
          </div>
          <div className="flex shrink-0 gap-1">
            <button
              onClick={() => onEdit(goal)}
              className="rounded-lg p-2 text-white/50 hover:bg-white/10 hover:text-white"
              aria-label="ویرایش"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            </button>
            <button
              onClick={() => onDelete(goal)}
              className="rounded-lg p-2 text-white/50 hover:bg-red-500/20 hover:text-red-300"
              aria-label="حذف"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 7h12M9 7V5a1 1 0 011-1h4a1 1 0 011 1v2m2 0v13a2 2 0 01-2 2H8a2 2 0 01-2-2V7h12z" />
              </svg>
            </button>
          </div>
        </div>

        <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
          <motion.div
            className="h-full bg-sky-400"
            initial={{ width: 0 }}
            animate={{ width: `${ratio * 100}%` }}
            transition={{ duration: 0.4 }}
          />
        </div>
        <p className="mt-1 text-left text-xs text-white/40">
          {done} از {total} تکمیل شده
        </p>
      </div>

      <form onSubmit={handleAdd} className="mb-3 flex gap-2">
        <input
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="زیرتسک جدید..."
          className="flex-1 rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-white placeholder-white/40 outline-none focus:border-sky-400"
        />
        <button
          type="submit"
          disabled={busy}
          className="rounded-xl bg-sky-500 px-4 py-2 font-medium text-white hover:bg-sky-400 disabled:opacity-50"
        >
          افزودن
        </button>
      </form>

      <div className="flex-1 space-y-2 pb-24">
        {total === 0 && <p className="text-center text-white/40">هنوز زیرتسکی اضافه نشده</p>}
        <AnimatePresence mode="popLayout">
          {goal.tasks.map((task) => (
            <motion.div
              layout
              key={task.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="flex items-center gap-3 rounded-xl border border-white/15 bg-white/5 p-3 backdrop-blur-lg"
            >
              <motion.button
                whileTap={{ scale: 0.85 }}
                onClick={() => handleToggle(task)}
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                  task.is_done ? 'border-sky-400 bg-sky-400/80' : 'border-white/40'
                }`}
              >
                {task.is_done && (
                  <svg viewBox="0 0 24 24" className="h-3 w-3 text-white" fill="none" stroke="currentColor" strokeWidth="3">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </motion.button>
              <p className={`flex-1 text-right ${task.is_done ? 'text-white/40 line-through' : 'text-white'}`}>
                {task.title}
              </p>
              <button
                onClick={() => handleDeleteTask(task)}
                className="rounded-lg p-1.5 text-white/40 hover:bg-red-500/20 hover:text-red-300"
                aria-label="حذف"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}
