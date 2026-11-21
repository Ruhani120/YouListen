/** 243000 -> "4:03" */
export function formatDuration(ms?: number | null): string {
  if (!ms || ms <= 0) return '-'
  const total = Math.round(ms / 1000)
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

/** 75 -> "1m 15s" */
export function formatSeconds(totalSeconds?: number | null): string {
  if (totalSeconds === null || totalSeconds === undefined) return '-'
  if (totalSeconds < 60) return `${totalSeconds}s`
  const m = Math.floor(totalSeconds / 60)
  const s = totalSeconds % 60
  return s === 0 ? `${m}m` : `${m}m ${s}s`
}

/** ISO timestamp from the backend (no timezone) -> "12 Nov, 14:22" */
export function formatDateTime(iso?: string | null): string {
  if (!iso) return '-'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '-'
  return d.toLocaleString(undefined, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}
