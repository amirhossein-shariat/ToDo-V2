import { motion } from 'framer-motion'
import { TAG_COLORS, TAG_COLOR_FALLBACK } from '../constants'

function motivation(percent, total) {
  if (total === 0) return 'اولین زیرتسک رو اضافه کن'
  if (percent === 0) return 'شروع کن! 🚀'
  if (percent === 100) return 'تکمیل شد 🎉'
  if (percent >= 75) return 'تقریباً رسیدی! 🔥'
  if (percent >= 40) return 'ادامه بده، خوب پیش می‌ری 💪'
  return 'قدم اول برداشته شد ✨'
}

export default function GoalCard({ goal, onClick }) {
  const total = goal.tasks.length
  const done = goal.tasks.filter((t) => t.is_done).length
  const percent = total > 0 ? Math.round((done / total) * 100) : 0
  const color = goal.tag ? TAG_COLORS[goal.tag] || TAG_COLOR_FALLBACK : TAG_COLOR_FALLBACK

  const r = 42
  const circumference = 2 * Math.PI * r

  return (
    <motion.button
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      whileHover={{ y: -3 }}
      whileTap={{ scale: 0.96 }}
      onClick={onClick}
      className="relative flex aspect-square flex-col items-center justify-between overflow-hidden rounded-3xl border border-white/15 p-4 text-center backdrop-blur-lg"
      style={{
        background: `radial-gradient(120% 120% at 50% 0%, ${color}33 0%, rgba(255,255,255,0.04) 60%)`,
      }}
    >
      {goal.tag && (
        <span
          className="absolute right-3 top-3 rounded-full px-2 py-0.5 text-[10px] font-medium text-black/80"
          style={{ backgroundColor: color }}
        >
          {goal.tag}
        </span>
      )}

      <h3 className="mt-4 line-clamp-2 px-2 text-sm font-bold text-white">{goal.title}</h3>

      <div className="relative flex h-24 w-24 items-center justify-center">
        <svg viewBox="0 0 100 100" className="h-24 w-24 -rotate-90">
          <circle cx="50" cy="50" r={r} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="7" />
          <motion.circle
            cx="50"
            cy="50"
            r={r}
            fill="none"
            stroke={color}
            strokeWidth="7"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: circumference * (1 - percent / 100) }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          />
        </svg>
        <div className="absolute flex flex-col items-center">
          <span className="text-xl font-extrabold text-white">{percent}%</span>
          <span className="text-[10px] text-white/50">
            {done}/{total}
          </span>
        </div>
      </div>

      <p className="mb-1 text-xs font-medium text-white/70">{motivation(percent, total)}</p>
    </motion.button>
  )
}
