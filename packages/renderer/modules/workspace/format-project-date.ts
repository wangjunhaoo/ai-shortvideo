export function formatProjectDate(dateString: string) {
  const date = new Date(dateString)
  const beijingTime = new Date(date.getTime() + 8 * 60 * 60 * 1000)
  return beijingTime.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Shanghai',
  })
}
