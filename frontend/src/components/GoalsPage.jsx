import { useEffect, useState, useCallback } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { getGoals, createGoal, updateGoal, deleteGoal } from '../api'
import GoalModal from './GoalModal'
import GoalDetail from './GoalDetail'
import GoalCard from './GoalCard'

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
      <div className="flex-1 pb-24">
        {loading && <p className="text-center text-white/40">در حال بارگذاری...</p>}
        {error && <p className="text-center text-red-300">{error}</p>}
        {!loading && !error && goals.length === 0 && (
          <p className="text-center text-white/40">هنوز هدفی ثبت نشده</p>
        )}
        <div className="grid grid-cols-2 gap-3">
          <AnimatePresence mode="popLayout">
            {goals.map((goal) => (
              <GoalCard key={goal.id} goal={goal} onClick={() => setSelectedId(goal.id)} />
            ))}
          </AnimatePresence>
        </div>
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
