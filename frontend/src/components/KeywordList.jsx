function KeywordList({ keywords }) {
   if (!keywords || keywords.length === 0) return null
 
   return (
     <div className="result-card">
       <div className="result-card-title">
         <span className="result-icon">🔑</span> Missing keywords
       </div>
       <div className="keyword-tags">
         {keywords.map((kw) => (
           <span className="keyword-tag" key={kw}>{kw}</span>
         ))}
       </div>
     </div>
   )
 }
 
 export default KeywordList