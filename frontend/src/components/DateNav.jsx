import { AnimatePresence, motion } from 'framer-motion'

function ChevronRight(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 6l6 6-6 6" />
    </svg>
  )
}

function ChevronLeft(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 6l-6 6 6 6" />
    </svg>
  )
}

// در RTL: دکمهٔ «قبلی» سمت راست با پیکان راستگرد، دکمهٔ «بعدی» سمت چپ با پیکان چپگرد
export default function DateNav({ label, sublabel, animKey, onPrev, onNext }) {
  return (
    <div className="mb-4 flex items-center justify-between gap-2 rounded-full border border-white/15 bg-white/5 py-1.5 pr-1.5 pl-1.5 backdrop-blur-lg">
      <motion.button
        whileTap={{ scale: 0.85 }}
        onClick={onPrev}
        aria-label="قبلی"
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white/60 transition-colors hover:bg-white/10 hover:text-white"
      >
        <ChevronRight className="h-5 w-5" />
      </motion.button>

      <div className="min-w-0 flex-1 overflow-hidden text-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={animKey}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18 }}
          >
            <p className="truncate font-medium text-white">{label}</p>
            {sublabel}
          </motion.div>
        </AnimatePresence>
      </div>

      <motion.button
        whileTap={{ scale: 0.85 }}
        onClick={onNext}
        aria-label="بعدی"
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white/60 transition-colors hover:bg-white/10 hover:text-white"
      >
        <ChevronLeft className="h-5 w-5" />
      </motion.button>
    </div>
  )
}
