import { useEffect, useRef, useState } from 'react'
import { getGoals } from '../api'
import { onSyncStatus } from '../offline/sync'
import { TAG_COLORS, TAG_COLOR_FALLBACK } from '../constants'

function goalPercent(goal) {
  const total = goal.tasks.length
  if (total === 0) return 0
  const done = goal.tasks.filter((t) => t.is_done).length
  return Math.round((done / total) * 100)
}

export default function GoalsStatsWidget() {
  const [goals, setGoals] = useState([])
  const [loading, setLoading] = useState(true)
  const loadedRef = useRef(false)

  useEffect(() => {
    const load = () => {
      if (!loadedRef.current) setLoading(true)
      getGoals()
        .then(setGoals)
        .finally(() => {
          loadedRef.current = true
          setLoading(false)
        })
    }
    load()
    return onSyncStatus((status) => {
      if (status === 'synced' || status === 'partial') load()
    })
  }, [])

  if (loading) {
    return <p className="text-center text-white/40">در حال بارگذاری...</p>
  }

  if (goals.length === 0) {
    return null
  }

  const rows = goals
    .map((g) => ({
      id: g.id,
      title: g.title,
      tag: g.tag,
      total: g.tasks.length,
      done: g.tasks.filter((t) => t.is_done).length,
      percent: goalPercent(g),
    }))
    .sort((a, b) => b.percent - a.percent)

  const tagMap = new Map()
  for (const r of rows) {
    const key = r.tag || 'بدون برچسب'
    if (!tagMap.has(key)) tagMap.set(key, { count: 0, percentSum: 0 })
    const t = tagMap.get(key)
    t.count += 1
    t.percentSum += r.percent
  }
  const tagRows = Array.from(tagMap.entries())
    .map(([tag, t]) => ({
      tag,
      count: t.count,
      avgPercent: Math.round(t.percentSum / t.count),
      color: TAG_COLORS[tag] || TAG_COLOR_FALLBACK,
    }))
    .sort((a, b) => b.avgPercent - a.avgPercent)

  return (
    <>
      <div className="rounded-2xl border border-white/15 bg-white/5 p-4 backdrop-blur-lg">
        <h3 className="mb-3 font-medium text-white">پیشرفت اهداف</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-right text-xs text-white/40">
                <th className="pb-2 font-normal">هدف</th>
                <th className="pb-2 font-normal">زیرتسک‌ها</th>
                <th className="pb-2 font-normal">پیشرفت</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t border-white/10">
                  <td className="py-2 text-white/80">{r.title}</td>
                  <td className="py-2 text-white/60">
                    {r.done} از {r.total}
                  </td>
                  <td className="py-2">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-white/10">
                        <div
                          className="h-full bg-sky-400"
                          style={{ width: `${r.percent}%` }}
                        />
                      </div>
                      <span className="text-xs text-white/60">{r.percent}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-2xl border border-white/15 bg-white/5 p-4 backdrop-blur-lg">
        <h3 className="mb-3 font-medium text-white">تفکیک اهداف بر اساس برچسب</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-right text-xs text-white/40">
                <th className="pb-2 font-normal">برچسب</th>
                <th className="pb-2 font-normal">تعداد اهداف</th>
                <th className="pb-2 font-normal">میانگین پیشرفت</th>
              </tr>
            </thead>
            <tbody>
              {tagRows.map((t) => (
                <tr key={t.tag} className="border-t border-white/10">
                  <td className="py-2">
                    <span className="flex items-center gap-1.5 text-white/80">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: t.color }}
                      />
                      {t.tag}
                    </span>
                  </td>
                  <td className="py-2 text-white/60">{t.count}</td>
                  <td className="py-2 text-white/60">{t.avgPercent}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
