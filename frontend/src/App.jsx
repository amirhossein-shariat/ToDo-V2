import { useState } from 'react'
import ViewTabs from './components/ViewTabs'
import DailyView from './components/DailyView'
import WeeklyView from './components/WeeklyView'
import MonthlyView from './components/MonthlyView'

export default function App() {
  const [view, setView] = useState('day')
  const [currentDate, setCurrentDate] = useState(new Date())

  const goToDay = (date) => {
    setCurrentDate(date)
    setView('day')
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-lg flex-col p-4 sm:p-6">
      <header className="mb-6 text-center">
        <h1 className="text-2xl font-bold text-white">TodoApp</h1>
        <p className="text-sm text-white/50">مدیریت روزانه کارها</p>
      </header>

      <ViewTabs view={view} setView={setView} />

      {view === 'day' && <DailyView currentDate={currentDate} setCurrentDate={setCurrentDate} />}
      {view === 'week' && (
        <WeeklyView currentDate={currentDate} setCurrentDate={setCurrentDate} onSelectDay={goToDay} />
      )}
      {view === 'month' && (
        <MonthlyView currentDate={currentDate} setCurrentDate={setCurrentDate} onSelectDay={goToDay} />
      )}
    </div>
  )
}
