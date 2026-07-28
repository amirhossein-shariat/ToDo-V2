import { useEffect, useState } from 'react'
import SectionTabs from './components/SectionTabs'
import ViewTabs from './components/ViewTabs'
import DailyView from './components/DailyView'
import WeeklyView from './components/WeeklyView'
import MonthlyView from './components/MonthlyView'
import GoalsPage from './components/GoalsPage'
import StatsPage from './components/StatsPage'
import SyncBadge from './components/SyncBadge'
import SyncButton from './components/SyncButton'
import LoginScreen from './components/LoginScreen'
import { isLoggedIn, getPhone, logout } from './auth'
import { clearAllData } from './offline/db'
import { runSync, onSyncStatus } from './offline/sync'

export default function App() {
  const [loggedIn, setLoggedIn] = useState(isLoggedIn())
  const [section, setSection] = useState('tasks')
  const [view, setView] = useState('day')
  const [currentDate, setCurrentDate] = useState(new Date())

  useEffect(() => {
    return onSyncStatus((status) => {
      if (status === 'unauthorized') setLoggedIn(false)
    })
  }, [])

  const goToDay = (date) => {
    setCurrentDate(date)
    setView('day')
  }

  const handleLoginSuccess = async () => {
    await clearAllData()
    setLoggedIn(true)
    runSync()
  }

  const handleLogout = async () => {
    if (!confirm('از حساب خارج می‌شوید؟')) return
    await logout()
    await clearAllData()
    setLoggedIn(false)
  }

  if (!loggedIn) {
    return <LoginScreen onSuccess={handleLoginSuccess} />
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-lg flex-col p-4 sm:p-6">
      <header className="mb-2 flex flex-col items-center gap-1 text-center" dir="ltr">
        <img src="/logo.png" alt="Spark" className="h-16 w-16" />
        <h1
          className="text-2xl font-extrabold text-sky-300"
          style={{ fontFamily: 'var(--font-brand)' }}
        >
          Spark
        </h1>
        <p className="text-sm text-white/50">Manage Tasks &amp; Goals</p>
      </header>

      <div dir="ltr" className="mb-4 flex items-center justify-center gap-2 text-xs text-white/30">
        <span>{getPhone()}</span>
        <button onClick={handleLogout} className="text-red-300/70 hover:text-red-300 hover:underline">
          خروج
        </button>
      </div>

      <SyncButton />
      <SyncBadge />

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
