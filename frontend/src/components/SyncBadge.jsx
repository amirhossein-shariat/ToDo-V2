import { useEffect, useState } from 'react'
import { onSyncStatus, pendingCount } from '../offline/sync'

export default function SyncBadge() {
  const [online, setOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true)
  const [pending, setPending] = useState(0)
  const [status, setStatus] = useState('idle')

  useEffect(() => {
    const refreshPending = () => pendingCount().then(setPending)
    refreshPending()

    const unsub = onSyncStatus((s) => {
      setStatus(s)
      if (s === 'offline') setOnline(false)
      refreshPending()
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

  if (online && pending === 0) return null

  return (
    <div
      className={`mx-auto mb-2 w-fit rounded-full px-3 py-1 text-[11px] font-medium ${
        !online
          ? 'bg-amber-500/20 text-amber-300'
          : status === 'syncing'
            ? 'bg-sky-500/20 text-sky-300'
            : 'bg-white/10 text-white/60'
      }`}
    >
      {!online
        ? pending > 0
          ? `آفلاین — ${pending} تغییر در صف ارسال`
          : 'آفلاین'
        : status === 'syncing'
          ? 'در حال همگام‌سازی...'
          : `${pending} تغییر در انتظار ارسال`}
    </div>
  )
}
