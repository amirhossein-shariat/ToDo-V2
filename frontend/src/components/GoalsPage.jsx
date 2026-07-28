import { useEffect, useState, useCallback } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { getGoals, createGoal, updateGoal, deleteGoal } from '../api'
import GoalModal from './GoalModal'
import GoalDetail from './GoalDetail'
import { TAG_COLORS, TAG_COLOR_FALLBACK } from '../constants'

export default function GoalsPage() {
  const [goals, setGoals] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedId, setSelectedId] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingGoal, setEditingGoal] = useState(null)

  const loadGoals = useCallback(() => {
    setLoading(true)
    getGoals()
      .then(setGoals)
      .catch(() => setError('اتصال به سرور برقرار نشد'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    loadGoals()
  }, [loadGoals])

  const selectedGoal = goals.find((g) => g.id === selectedId)

  const handleAdd = () => {
    setEditingGoal(null)
    setModalOpen(true)
  }

  const handleEdit = (goal) => {
    setEditingGoal(goal)
    setModalOpen(true)
  }

  const handleDelete = async (goal) => {
    await deleteGoal(goal.id)
    if (selectedId === goal.id) setSelectedId(null)
    loadGoals()
  }

  const handleSubmit = async (payload) => {
    if (editingGoal) {
      await updateGoal(editingGoal.id, payload)
    } else {
      await createGoal(payload)
    }
    setModalOpen(false)
    loadGoals()
  }

  if (selectedGoal) {
    return (
      <>
        <GoalDetail
          goal={selectedGoal}
          onBack={() => setSelectedId(null)}
          onChanged={loadGoals}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
        <GoalModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          onSubmit={handleSubmit}
          initialGoal={editingGoal}
        />
      </>
    )
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex-1 space-y-3 pb-24">
        {loading && <p className="text-center text-white/40">در حال بارگذاری...</p>}
        {error && <p className="text-center text-red-300">{error}</p>}
        {!loading && !error && goals.length === 0 && (
          <p className="text-center text-white/40">هنوز هدفی ثبت نشده</p>
        )}
        <AnimatePresence mode="popLayout">
          {goals.map((goal) => {
            const total = goal.tasks.length
            const done = goal.tasks.filter((t) => t.is_done).length
            const ratio = total > 0 ? done / total : 0
            const percent = total > 0 ? Math.round(ratio * 100) : 0
            const tagColor = goal.tag ? TAG_COLORS[goal.tag] || TAG_COLOR_FALLBACK : null
            return (
              <motion.button
                layout
                key={goal.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: 20 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedId(goal.id)}
                className="w-full rounded-2xl border border-white/15 bg-white/5 p-4 text-right backdrop-blur-lg hover:bg-white/10"
              >
                <div className="mb-2 flex items-center justify-between gap-2">
                  <h3 className="font-medium text-white">{goal.title}</h3>
                  <div className="flex shrink-0 items-center gap-2">
                    {goal.tag && (
                      <span
                        className="rounded-full px-2 py-0.5 text-[10px] font-medium text-black/80"
                        style={{ backgroundColor: tagColor }}
                      >
                        {goal.tag}
                      </span>
                    )}
                    <span className="text-xs text-white/40">
                      {percent}% ({done}/{total})
                    </span>
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
              </motion.button>
            )
          })}
        </AnimatePresence>
      </div>

      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={handleAdd}
        className="fixed bottom-6 left-1/2 -translate-x-1/2 rounded-full bg-sky-500 px-6 py-3 font-medium text-white shadow-lg shadow-sky-900/40 hover:bg-sky-400"
      >
        + هدف جدید
      </motion.button>

      <GoalModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
        initialGoal={editingGoal}
      />
    </div>
  )
}
