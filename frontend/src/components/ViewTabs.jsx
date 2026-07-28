const TABS = [
  { key: 'day', label: 'روزانه' },
  { key: 'week', label: 'هفتگی' },
  { key: 'month', label: 'ماهانه' },
]

export default function ViewTabs({ view, setView }) {
  return (
    <div className="mb-4 flex gap-1 rounded-2xl border border-white/15 bg-white/5 p-1 backdrop-blur-lg">
      {TABS.map((tab) => (
        <button
          key={tab.key}
          onClick={() => setView(tab.key)}
          className={`flex-1 rounded-xl py-2 text-sm font-medium transition-colors ${
            view === tab.key ? 'bg-sky-500 text-white' : 'text-white/60 hover:bg-white/10'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}
