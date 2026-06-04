function ScoreCards({ overallScore, atsScore, roleAlignment }) {
   const alignmentColour = {
     Strong: { bg: '#e1f5ee', text: '#085041', label: 'Strong match' },
     Good: { bg: '#e1f5ee', text: '#085041', label: 'Solid match' },
     Moderate: { bg: '#fff8e1', text: '#7c5400', label: 'Partial match' },
     Weak: { bg: '#fff0f0', text: '#7c2020', label: 'Weak match' },
   }
   const alignment = alignmentColour[roleAlignment] || alignmentColour['Moderate']
 
   return (
     <div className="score-cards">
       <div className="score-card">
         <p className="score-card-label">Overall score</p>
         <p className="score-card-num" style={{ color: '#1d9e75' }}>{overallScore}</p>
         <div className="score-bar"><div className="score-fill" style={{ width: `${overallScore}%`, background: '#1d9e75' }} /></div>
       </div>
       <div className="score-card">
         <p className="score-card-label">ATS score</p>
         <p className="score-card-num" style={{ color: '#5dcaa5' }}>{atsScore}</p>
         <div className="score-bar"><div className="score-fill" style={{ width: `${atsScore}%`, background: '#5dcaa5' }} /></div>
       </div>
       <div className="score-card">
         <p className="score-card-label">Role alignment</p>
         <p className="score-card-num" style={{ color: '#1a2e25', fontSize: '28px' }}>{roleAlignment}</p>
         <span className="alignment-badge" style={{ background: alignment.bg, color: alignment.text }}>{alignment.label}</span>
       </div>
     </div>
   )
 }
 
 export default ScoreCards