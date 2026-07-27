import { useEffect, useState } from 'react'

function App() {
  const [status, setStatus] = useState('در حال بررسی اتصال به سرور...')

  useEffect(() => {
    fetch('/api/health')
      .then((res) => res.json())
      .then((data) => setStatus(`اتصال برقرار است — ${data.message}`))
      .catch(() => setStatus('اتصال به سرور برقرار نشد'))
  }, [])

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-md rounded-3xl border border-white/20 bg-white/10 p-8 text-center shadow-2xl backdrop-blur-xl">
        <h1 className="mb-2 text-2xl font-bold">TodoApp</h1>
        <p className="text-white/70">{status}</p>
      </div>
    </div>
  )
}

export default App
