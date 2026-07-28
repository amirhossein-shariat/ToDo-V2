import { formatJalali } from './jalali'

function esc(str) {
  return String(str ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[c])
}

export function buildReportHtml({ weekData, weeklyTrend, streaks, goals }) {
  const generatedAt = formatJalali(new Date())

  const weekRows = weekData
    .map(
      (r) =>
        `<tr><td>${esc(r.label)}</td><td>${r.done} از ${r.total}</td><td>${r.percent}%</td></tr>`,
    )
    .join('')

  const trendRows = weeklyTrend
    .map((r) => `<tr><td>${esc(r.label)}</td><td>${r.percent}%</td></tr>`)
    .join('')

  const streakRows = streaks.length
    ? streaks.map((s) => `<tr><td>${esc(s.title)}</td><td>${s.streak} روز</td></tr>`).join('')
    : '<tr><td colspan="2">رشته فعالی ثبت نشده</td></tr>'

  const goalsHtml = goals.length
    ? goals
        .map((g) => {
          const total = g.tasks.length
          const done = g.tasks.filter((t) => t.is_done).length
          const percent = total > 0 ? Math.round((done / total) * 100) : 0
          const items = g.tasks
            .map((t) => `<li>${t.is_done ? '☑' : '☐'} ${esc(t.title)}</li>`)
            .join('')
          return `
            <div style="margin-bottom:16px;">
              <p style="font-weight:bold;margin:0 0 4px;">${esc(g.title)} — ${percent}% (${done}/${total})</p>
              ${g.description ? `<p style="margin:0 0 6px;color:#555;">${esc(g.description)}</p>` : ''}
              <ul style="margin:0;padding-inline-start:20px;">${items}</ul>
            </div>`
        })
        .join('')
    : '<p>هدفی ثبت نشده</p>'

  return `
<div dir="rtl" lang="fa" style="font-family: Tahoma, Arial, sans-serif; color:#111; background:#fff; padding:24px; max-width:700px; margin:0 auto;">
  <h1 style="font-size:20px; margin-bottom:4px;">گزارش TodoApp</h1>
  <p style="color:#666; margin-top:0; font-size:12px;">تاریخ تولید گزارش: ${generatedAt}</p>

  <h2 style="font-size:16px; border-bottom:1px solid #ccc; padding-bottom:4px;">وضعیت روزهای هفته جاری</h2>
  <table style="width:100%; border-collapse:collapse; margin-bottom:20px; font-size:13px;">
    <thead><tr style="background:#f2f2f2;"><th style="text-align:right;padding:6px;border:1px solid #ddd;">روز</th><th style="text-align:right;padding:6px;border:1px solid #ddd;">انجام‌شده</th><th style="text-align:right;padding:6px;border:1px solid #ddd;">درصد</th></tr></thead>
    <tbody>${weekRows.replace(/<td>/g, '<td style="padding:6px;border:1px solid #ddd;">')}</tbody>
  </table>

  <h2 style="font-size:16px; border-bottom:1px solid #ccc; padding-bottom:4px;">روند هفتگی ماه جاری</h2>
  <table style="width:100%; border-collapse:collapse; margin-bottom:20px; font-size:13px;">
    <thead><tr style="background:#f2f2f2;"><th style="text-align:right;padding:6px;border:1px solid #ddd;">هفته</th><th style="text-align:right;padding:6px;border:1px solid #ddd;">درصد تکمیل</th></tr></thead>
    <tbody>${trendRows.replace(/<td>/g, '<td style="padding:6px;border:1px solid #ddd;">')}</tbody>
  </table>

  <h2 style="font-size:16px; border-bottom:1px solid #ccc; padding-bottom:4px;">رشته‌های پیوسته (Streak)</h2>
  <table style="width:100%; border-collapse:collapse; margin-bottom:20px; font-size:13px;">
    <thead><tr style="background:#f2f2f2;"><th style="text-align:right;padding:6px;border:1px solid #ddd;">تسک</th><th style="text-align:right;padding:6px;border:1px solid #ddd;">رشته فعلی</th></tr></thead>
    <tbody>${streakRows.replace(/<td/g, '<td style="padding:6px;border:1px solid #ddd;"')}</tbody>
  </table>

  <h2 style="font-size:16px; border-bottom:1px solid #ccc; padding-bottom:4px;">اهداف</h2>
  ${goalsHtml}
</div>`
}

export function downloadWordReport(html, filename = 'گزارش-todoapp.doc') {
  const fullHtml = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="utf-8"></head><body>${html}</body></html>`
  const blob = new Blob(['﻿', fullHtml], { type: 'application/msword' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
