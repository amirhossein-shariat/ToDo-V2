import { useEffect, useState, useCallback } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { format, addDays } from 'date-fns'
import TaskItem from './components/TaskItem'
import TaskModal from './components/TaskModal'
import { getDailyTasks, createTask, updateTask, deleteTask, toggleTaskCompletion } from './api'
import { WEEK_DAYS } from './constants'

function toDateStr(d) {
  return format(d, 'yyyy-MM-dd')
}

function weekdayIndex(d) {
  return (d.getDay() + 1) % 7 // getDay: Sun=0..Sat=6 -> ours: Sat=0..Fri=6
}

export default function App() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingTask, setEditingTask] = useState(null)

  const dateStr = toDateStr(currentDate)

  const loadTasks = useCallback(() => {
    setLoading(true)
    getDailyTasks(dateStr)
      .then(setTasks)
      .catch(() => setError('اتصال به سرور برقرار نشد'))
      .finally(() => setLoading(false))
  }, [dateStr])

  useEffect(() => {
    loadTasks()
  }, [loadTasks])

  const handleToggle = async (task) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, completed: !t.completed } : t)),
    )
    try {
      await toggleTaskCompletion(task.id, dateStr)
    } catch {
      loadTasks()
    }
  }

  const handleDelete = async (task) => {
    setTasks((prev) => prev.filter((t) => t.id !== task.id))
    try {
      await deleteTask(task.id)
    } catch {
      loadTasks()
    }
  }

  const handleEdit = (task) => {
    setEditingTask(task)
    setModalOpen(true)
  }

  const handleAdd = () => {
    setEditingTask(null)
    setModalOpen(true)
  }

  const handleSubmit = async (payload) => {
    try {
      if (editingTask) {
        await updateTask(editingTask.id, payload)
      } else {
        await createTask(payload)
      }
      setModalOpen(false)
      loadTasks()
    } catch (e) {
      alert(e.message)
    }
  }

  const isToday = toDateStr(new Date()) === dateStr
  const doneCount = tasks.filter((t) => t.completed).length

  return (
    <div className="mx-auto flex min-h-screen max-w-lg flex-col p-4 sm:p-6">
      <header className="mb-6 text-center">
        <h1 className="text-2xl font-bold text-white">TodoApp</h1>
        <p className="text-sm text-white/50">مدیریت روزانه کارها</p>
      </header>

      <div className="mb-4 flex items-center justify-between rounded-2xl border border-white/15 bg-white/5 p-3 backdrop-blur-lg">
        <button
          onClick={() => setCurrentDate((d) => addDays(d, -1))}
          className="rounded-lg p-2 text-white/60 hover:bg-white/10"
        >
          ◀
        </button>
        <div className="text-center">
          <p className="font-medium text-white">
            {WEEK_DAYS[weekdayIndex(currentDate)]} {format(currentDate, 'yyyy/MM/dd')}
          </p>
          {!isToday && (
            <button
              onClick={() => setCurrentDate(new Date())}
              className="text-xs text-sky-300 hover:underline"
            >
              برو به امروز
            </button>
          )}
        </div>
        <button
          onClick={() => setCurrentDate((d) => addDays(d, 1))}
          className="rounded-lg p-2 text-white/60 hover:bg-white/10"
        >
          ▶
        </button>
      </div>

      {tasks.length > 0 && (
        <div className="mb-4 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
          <motion.div
            className="h-full bg-sky-400"
            initial={{ width: 0 }}
            animate={{ width: `${(doneCount / tasks.length) * 100}%` }}
            transition={{ duration: 0.4 }}
          />
        </div>
      )}

      <div className="flex-1 space-y-3">
        {loading && <p className="text-center text-white/40">در حال بارگذاری...</p>}
        {error && <p className="text-center text-red-300">{error}</p>}
        {!loading && !error && tasks.length === 0 && (
          <p className="text-center text-white/40">تسکی برای این روز ثبت نشده</p>
        )}
        <AnimatePresence mode="popLayout">
          {tasks.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              onToggle={handleToggle}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </AnimatePresence>
      </div>

      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={handleAdd}
        className="fixed bottom-6 left-1/2 -translate-x-1/2 rounded-full bg-sky-500 px-6 py-3 font-medium text-white shadow-lg shadow-sky-900/40 hover:bg-sky-400"
      >
        + تسک جدید
      </motion.button>

      <TaskModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
        initialTask={editingTask}
        defaultDate={dateStr}
      />
    </div>
  )
}
