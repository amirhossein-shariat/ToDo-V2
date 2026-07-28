import { useState } from 'react'
import { motion } from 'framer-motion'
import { login } from '../auth'
import { getServerUrl, setServerUrl } from '../config'
import { Capacitor } from '@capacitor/core'

export default function LoginScreen({ onSuccess }) {
  const [phone, setPhone] = useState('')
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [serverUrl, setServerUrlInput] = useState(getServerUrl())
  const isNative = Capacitor.isNativePlatform()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!phone.trim()) {
      setError('شماره تلفن را وارد کنید')
      return
    }
    if (!/^\d{4}$/.test(pin)) {
      setError('رمز باید دقیقاً ۴ رقم باشد')
      return
    }
    if (isNative && !serverUrl.trim()) {
      setError('آدرس سرور را وارد کنید')
      return
    }
    setBusy(true)
    try {
      if (isNative) setServerUrl(serverUrl)
      await login(phone.trim(), pin)
      onSuccess()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <motion.form
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-3xl border border-white/20 bg-white/10 p-6 text-center shadow-2xl backdrop-blur-2xl"
      >
        <img src="/logo.png" alt="Spark" className="mx-auto mb-3 h-16 w-16" />
        <h1
          className="mb-1 text-xl font-extrabold text-sky-300"
          style={{ fontFamily: 'var(--font-brand)' }}
        >
          Spark
        </h1>
        <p className="mb-6 text-sm text-white/50">ورود یا ساخت حساب با شماره تلفن</p>

        {isNative && (
          <input
            type="url"
            inputMode="url"
            dir="ltr"
            value={serverUrl}
            onChange={(e) => setServerUrlInput(e.target.value)}
            placeholder="آدرس سرور — مثلاً http://192.168.1.10:8000"
            className="mb-3 w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-center text-sm text-white placeholder-white/40 outline-none focus:border-sky-400"
          />
        )}

        <input
          type="tel"
          inputMode="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="شماره تلفن"
          className="mb-3 w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-center text-white placeholder-white/40 outline-none focus:border-sky-400"
        />
        <input
          type="password"
          inputMode="numeric"
          maxLength={4}
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
          placeholder="رمز ۴ رقمی"
          className="mb-4 w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-center text-2xl tracking-[0.5em] text-white placeholder-white/40 outline-none focus:border-sky-400"
        />

        {error && <p className="mb-3 text-sm text-red-300">{error}</p>}

        <motion.button
          whileTap={{ scale: 0.97 }}
          type="submit"
          disabled={busy}
          className="w-full rounded-xl bg-sky-500 py-3 font-medium text-white hover:bg-sky-400 disabled:opacity-50"
        >
          {busy ? 'در حال بررسی...' : 'ورود / ساخت حساب'}
        </motion.button>

        <p className="mt-4 text-xs text-white/30">
          اگه این شماره قبلاً ثبت شده، با همین رمز وارد حساب خودت می‌شی. اگه جدیده، یه حساب تازه
          ساخته می‌شه.
        </p>
      </motion.form>
    </div>
  )
}
