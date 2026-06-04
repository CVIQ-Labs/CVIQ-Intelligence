function BulletRewrites({ bullets }) {
   if (!bullets || bullets.length === 0) return null
 
   return (
     <div className="result-card">
       <div className="result-card-title">
         <span className="result-icon">✏️</span> Suggested bullet rewrites
       </div>
       {bullets.map((b, i) => (
         <div className="bullet-rewrite" key={i}>
           <div className="bullet-before">{b.original}</div>
           <div className="bullet-arrow">↓ improved</div>
           <div className="bullet-after">{b.improved}</div>
         </div>
       ))}
     </div>
   )
 }
 
 export default BulletRewrites