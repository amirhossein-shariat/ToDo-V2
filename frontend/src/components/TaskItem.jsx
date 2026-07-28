import { motion } from 'framer-motion'
import { RECURRENCE_LABELS, TAG_COLORS, TAG_COLOR_FALLBACK } from '../constants'
import { formatJalali } from '../utils/jalali'

export default function TaskItem({ task, onToggle, onEdit, onDelete, onDuration }) {
  const isRecurring = task.recurrence_type === 'daily' || task.recurrence_type === 'weekly_days'

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="flex items-center gap-3 rounded-2xl border border-white/15 bg-white/5 p-4 backdrop-blur-lg"
    >
      <motion.button
        whileTap={{ scale: 0.85 }}
        onClick={() => onToggle(task)}
        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
          task.completed
            ? 'border-sky-400 bg-sky-400/80'
            : 'border-white/40 bg-transparent'
        }`}
      >
        {task.completed && (
          <motion.svg
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            viewBox="0 0 24 24"
            className="h-4 w-4 text-white"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </motion.svg>
        )}
      </motion.button>

      <div className="min-w-0 flex-1 text-right">
        <p
          className={`truncate font-medium ${
            task.completed ? 'text-white/40 line-through' : 'text-white'
          }`}
        >
          {task.title}
        </p>
        <p className="flex flex-wrap items-center gap-1.5 text-xs text-white/40">
          <span>{RECURRENCE_LABELS[task.recurrence_type]}</span>
          {isRecurring && (
            <span>{task.end_date ? `تا ${formatJalali(new Date(task.end_date))}` : 'نامحدود'}</span>
          )}
          {task.tag && (
            <span
              className="rounded-full px-2 py-0.5 text-[10px] font-medium text-black/80"
              style={{ backgroundColor: TAG_COLORS[task.tag] || TAG_COLOR_FALLBACK }}
            >
              {task.tag}
            </span>
          )}
          {task.streak > 0 && (
            <span className="inline-flex items-center gap-0.5 text-amber-300">
              🔥 {task.streak}
            </span>
          )}
        </p>
      </div>

      <div className="flex shrink-0 gap-1">
        {isRecurring ? (
          <button
            onClick={() => onDuration(task)}
            className="rounded-lg p-2 text-white/50 hover:bg-white/10 hover:text-white"
            aria-label="تنظیم مدت تکرار"
            title="تنظیم مدت تکرار"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="9" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 7v5l3 3" />
            </svg>
          </button>
        ) : (
          <>
            <button
              onClick={() => onEdit(task)}
              className="rounded-lg p-2 text-white/50 hover:bg-white/10 hover:text-white"
              aria-label="ویرایش"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            </button>
            <button
              onClick={() => onDelete(task)}
              className="rounded-lg p-2 text-white/50 hover:bg-red-500/20 hover:text-red-300"
              aria-label="حذف"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 7h12M9 7V5a1 1 0 011-1h4a1 1 0 011 1v2m2 0v13a2 2 0 01-2 2H8a2 2 0 01-2-2V7h12z" />
              </svg>
            </button>
          </>
        )}
      </div>
    </motion.div>
  )
}
