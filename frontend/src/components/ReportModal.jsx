import { AnimatePresence, motion } from 'framer-motion'
import { buildReportHtml, downloadWordReport } from '../utils/report'

export default function ReportModal({ open, onClose, data }) {
  if (!data) return null
  const html = buildReportHtml(data)

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 10 }}
            className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-3xl bg-white shadow-2xl"
          >
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-black/10 p-4">
              <h2 className="font-bold text-black">پیش‌نمایش گزارش</h2>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => window.print()}
                  className="rounded-xl bg-sky-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-sky-400 sm:text-sm"
                >
                  چاپ / PDF
                </button>
                <button
                  onClick={() => downloadWordReport(html)}
                  className="rounded-xl bg-emerald-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-400 sm:text-sm"
                >
                  Word
                </button>
                <button
                  onClick={onClose}
                  className="rounded-xl bg-black/5 px-3 py-1.5 text-xs text-black/60 hover:bg-black/10 sm:text-sm"
                >
                  بستن
                </button>
              </div>
            </div>
            <div className="overflow-y-auto overscroll-contain p-2">
              <div id="print-report" dangerouslySetInnerHTML={{ __html: html }} />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
