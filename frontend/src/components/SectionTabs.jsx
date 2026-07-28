const SECTIONS = [
  { key: 'tasks', label: 'کارها' },
  { key: 'goals', label: 'اهداف' },
  { key: 'stats', label: 'آمار' },
]

export default function SectionTabs({ section, setSection }) {
  return (
    <div className="mb-4 flex justify-center gap-6 border-b border-white/10">
      {SECTIONS.map((s) => (
        <button
          key={s.key}
          onClick={() => setSection(s.key)}
          className={`relative pb-3 text-sm font-medium transition-colors ${
            section === s.key ? 'text-white' : 'text-white/40 hover:text-white/70'
          }`}
        >
          {s.label}
          {section === s.key && (
            <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-sky-400" />
          )}
        </button>
      ))}
    </div>
  )
}
