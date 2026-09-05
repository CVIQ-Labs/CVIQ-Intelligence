Quality Assurance Notes – CV Upload & ATS Scoring Feature (Phase 2 – Fall 2026)
Front-End QA & User Experience Review
While testing the expanded CV upload, ATS scoring, and recruiter simulation workflow for Phase 2, several new improvements were identified to enhance interactivity, role-specific accuracy, and real-time feedback for candidates.

Current State
Users upload their CV and receive:

ATS Score (%)

Recruiter Feedback Score (/10)

Category-level breakdowns

Line-level feedback and rewrite suggestions

The platform provides a strong baseline of ATS compatibility and recruiter-style insights.

Proposed Enhancements (Phase 2)
Introduce a Role Fit Score (/100) based on job-family intelligence (Software Engineering, Data, ML/AI, Cloud, Cybersecurity, Product).

Present scoring using role-specific rubrics aligned with real recruiter expectations.

Include new visual indicators such as:

CV Heatmap (strong vs weak sections)

Keyword Density Meter (live updating)

Experience Depth Index

Skill Coverage Map

Before/After revision snapshots

Add enhanced colour-coded feedback categories:

8–10 = Strong Application

5–7 = Competitive but requires improvement

0–4 = Significant optimisation required

Improve loading states during CV analysis by:

Displaying multi-stage progress indicators

Showing analysis stages (Parsing CV → Semantic Mapping → Role Fit Analysis → Recruiter Simulation → Rewrite Suggestions)

Providing estimated completion times and micro-animations

QA Testing Considerations
Validate role-specific scoring consistency across job families.

Test CV heatmap accuracy across different CV formats (.pdf, .docx).

Stress-test real-time rewrite engine under heavy editing.

Verify revision snapshots persist across user sessions.

Ensure mobile and desktop responsiveness for the interactive editor.

Test user experience under slower network conditions and large CV files.

Back-End QA & Data Quality Review
Knowledge Base & RAG Validation
The effectiveness of ATS scoring, recruiter simulation, and role-fit analysis depends heavily on the quality and freshness of the Retrieval-Augmented Generation (RAG) system and job-family intelligence packs.

Key Validation Areas
Ensure the knowledge base contains up-to-date job-family intelligence for:

Software Engineering roles

Data Engineering roles

Machine Learning and AI positions

Cloud Engineering opportunities

Cybersecurity positions

Product & Technical Analyst roles

Consulting & Healthcare roles (new)

Validate:

Skill taxonomies

Recruiter heuristics

Impact benchmarks

Common failure patterns

Validate that retrieved job descriptions accurately match user-selected career paths.

Monitor retrieval accuracy and relevance scores across multiple vectors (skills, responsibilities, seniority).

Detect and remove duplicate or near-duplicate job listings.

Verify data integrity during ingestion, clustering, and indexing processes.

CI/CD Pipeline Requirements
To maintain data quality and platform reliability:

Automate ingestion of job-family intelligence packs.

Schedule regular updates of job descriptions and industry requirements.

Implement automated regression testing for:

Role Fit Engine

Rewrite engine

Recruiter simulation

Validate embeddings and vector database updates after each refresh.

Monitor API performance, retrieval latency, and model drift.

Establish rollback procedures for scoring anomalies or failed deployments.

Track changes to job market trends and keyword requirements over time.

QA Success Metrics
CV upload success rate > 99%.

ATS scoring response time < 10 seconds.

Role Fit Score accuracy > 90%.

Rewrite engine latency < 3 seconds.

Heatmap generation < 2 seconds.

Knowledge base refresh success rate > 95%.

Retrieval relevance score maintained above target threshold.

Zero critical deployment failures in production.

Consistent ATS, recruiter, and role-fit outputs across repeated test cases.

Future Enhancement Opportunities
Recruiter persona selection (Startup Recruiter, FAANG Recruiter, Consulting Recruiter, Healthcare Recruiter).

Industry-specific ATS scoring models.

Cover Letter Intelligence Engine integration.

Real-time labour market intelligence.

Benchmarking against successful CVs from similar roles.

Personalised career progression recommendations powered by the AI Matrix.
