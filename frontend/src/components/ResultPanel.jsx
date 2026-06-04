function ResultPanel({ strengths, weaknesses }) {
   return (
     <div className="result-panels">
       <div className="result-card">
         <div className="result-card-title strengths-title">
           <span className="result-icon">💪</span> Strengths
         </div>
         {strengths.map((s, i) => (
           <div className="panel-item" key={i}>
             <span className="panel-tick tick-good">✓</span>
             <span>{s}</span>
           </div>
         ))}
       </div>
       <div className="result-card">
         <div className="result-card-title weaknesses-title">
           <span className="result-icon">⚠️</span> Weaknesses
         </div>
         {weaknesses.map((w, i) => (
           <div className="panel-item" key={i}>
             <span className="panel-tick tick-bad">✕</span>
             <span>{w}</span>
           </div>
         ))}
       </div>
     </div>
   )
 }
 
 export default ResultPanel