import { useState } from 'react'
import SectionTabs from './components/SectionTabs'
import ViewTabs from './components/ViewTabs'
import DailyView from './components/DailyView'
import WeeklyView from './components/WeeklyView'
import MonthlyView from './components/MonthlyView'
import GoalsPage from './components/GoalsPage'
import StatsPage from './components/StatsPage'

export default function App() {
  const [section, setSection] = useState('tasks')
  const [view, setView] = useState('day')
  const [currentDate, setCurrentDate] = useState(new Date())

  const goToDay = (date) => {
    setCurrentDate(date)
    setView('day')
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-lg flex-col p-4 sm:p-6">
      <header className="mb-4 flex flex-col items-center gap-1 text-center" dir="ltr">
        <img src="/logo.png" alt="Spark" className="h-16 w-16" />
        <h1
          className="text-2xl font-extrabold text-sky-300"
          style={{ fontFamily: 'var(--font-brand)' }}
        >
          Spark
        </h1>
        <p className="text-sm text-white/50">Manage Tasks &amp; Goals</p>
      </header>

      <SectionTabs section={section} setSection={setSection} />

      {section === 'tasks' && (
        <>
          <ViewTabs view={view} setView={setView} />
          {view === 'day' && (
            <DailyView currentDate={currentDate} setCurrentDate={setCurrentDate} />
          )}
          {view === 'week' && (
            <WeeklyView
              currentDate={currentDate}
              setCurrentDate={setCurrentDate}
              onSelectDay={goToDay}
            />
          )}
          {view === 'month' && (
            <MonthlyView
              currentDate={currentDate}
              setCurrentDate={setCurrentDate}
              onSelectDay={goToDay}
            />
          )}
        </>
      )}

      {section === 'goals' && <GoalsPage />}
      {section === 'stats' && <StatsPage />}
    </div>
  )
}
