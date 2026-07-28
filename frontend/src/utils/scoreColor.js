export function scoreColor(n, max = 100) {
   const p = max === 10 ? n * 10 : n
   if (p >= 80) return '#16a34a'
   if (p >= 60) return '#d97706'
   return '#ef4444'
 }