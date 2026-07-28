import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { onSyncStatus, runSync, pendingCount } from '../offline/sync'

export default function SyncButton() {
  const [status, setStatus] = useState('idle')
  const [online, setOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true)
  const [pending, setPending] = useState(0)

  useEffect(() => {
    const refresh = () => pendingCount().then(setPending)
    refresh()

    const unsub = onSyncStatus((s) => {
      setStatus(s)
      if (s === 'offline') setOnline(false)
      refresh()
    })

    const goOnline = () => setOnline(true)
    const goOffline = () => setOnline(false)
    window.addEventListener('online', goOnline)
    window.addEventListener('offline', goOffline)

    return () => {
      unsub()
      window.removeEventListener('online', goOnline)
      window.removeEventListener('offline', goOffline)
    }
  }, [])

  const colorClass = !online
    ? 'text-amber-300 bg-amber-500/15 border-amber-400/30'
    : status === 'syncing'
      ? 'text-sky-300 bg-sky-500/15 border-sky-400/30'
      : status === 'error'
        ? 'text-red-300 bg-red-500/15 border-red-400/30'
        : 'text-emerald-300 bg-emerald-500/15 border-emerald-400/30'

  const label = !online
    ? 'آفلاین — برای تلاش مجدد بزنید'
    : status === 'syncing'
      ? 'در حال همگام‌سازی...'
      : pending > 0
        ? `${pending} تغییر در انتظار — برای همگام‌سازی بزنید`
        : 'همگام است — برای همگام‌سازی دستی بزنید'

  return (
    <motion.button
      onClick={() => runSync()}
      whileTap={{ scale: 0.88 }}
      whileHover={{ scale: 1.05 }}
      className={`fixed left-3 top-3 z-40 flex h-8 w-8 items-center justify-center rounded-full border backdrop-blur-lg shadow-md ${colorClass}`}
      aria-label={label}
      title={label}
    >
      <motion.svg
        viewBox="0 0 24 24"
        className="h-3.5 w-3.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        animate={status === 'syncing' ? { rotate: 360 } : { rotate: 0 }}
        transition={
          status === 'syncing'
            ? { repeat: Infinity, duration: 1, ease: 'linear' }
            : { duration: 0.3 }
        }
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M4 4v5h5M20 20v-5h-5M4.5 9a7.5 7.5 0 0113-5M19.5 15a7.5 7.5 0 01-13 5"
        />
      </motion.svg>

      {pending > 0 && (
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -right-1 -top-1 flex h-3 w-3 items-center justify-center rounded-full bg-red-500 text-[7px] font-bold text-white"
        >
          {pending}
        </motion.span>
      )}
    </motion.button>
  )
}
