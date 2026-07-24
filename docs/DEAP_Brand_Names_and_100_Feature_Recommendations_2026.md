# StaffiQ: Brand Names and 100 Feature Recommendations

Prepared 10 July 2026 for Ayodeji Falope, RevenStrat Integrated Services.

This document covers three deliverables: ten candidate brand names for the training and assessment platform, a record of the code cleanup performed, and one hundred feature recommendations split into fifty user simplicity items and fifty executive insight items for the CEO and Platform Owner. Every recommendation is grounded in what the codebase already contains, so each one is an extension of the current foundation rather than a fantasy.

## Part 1: Ten Brand Name Candidates

Each name is a maximum of two words, ranked from strongest to weakest. Before committing to any name, run a trademark search at the Nigerian Trademarks Registry and check domain availability. This is general guidance, not legal advice.

| Rank | Name | Why it works |
|------|------|--------------|
| 1 | SabiCheck | Built on the Pidgin word sabi, meaning to know. It instantly communicates verify what your people know to any Nigerian audience, it is warm, memorable, radio friendly, and it is distinctive enough that domains and trademarks are likely available. It travels well across West Africa. |
| 2 | SkillProof | Plain English, self explanatory, and it captures the core promise: proof of skill through assessment. Enterprise buyers understand it in one second. Strong fit for compliance driven clients who need evidence, which matches the audit trail and evidence pack features already in the app. |
| 3 | TalentGauge | A measurement metaphor that positions the product as a precision instrument for workforce capability. It sounds professional and analytical, which suits the AI Analytics module, and it appeals to HR directors and CEOs who think in metrics. |
| 4 | MeritLens | Suggests seeing merit clearly, which is exactly what the executive dashboards do. It carries a fairness connotation that resonates in organisations fighting favouritism, a genuine pain point in many Nigerian workplaces. Short, elegant, and likely available. |
| 5 | KnowRise | Knowledge plus growth in one compact word. It is aspirational for the employee side of the product, framing assessment as a ladder rather than a policing tool. Friendly for consumer style marketing and app store presence. |
| 6 | WorkSage | Positions the platform as the wise adviser of the workplace, which suits the AI help assistant and the CHATS guided learning layer. Memorable, easy to spell, and it supports a mascot or advisory brand voice. |
| 7 | PeakForm | A sporting metaphor: getting the workforce to peak condition. It works for training heavy positioning and motivational internal campaigns, and it gives marketing a rich vein of imagery. Slightly less specific about assessment. |
| 8 | BrightBench | Combines benchmarking with bright talent. It hints at the cohort comparison and benchmarking features on the roadmap. Alliteration makes it sticky, though it explains itself a little less quickly than the names above. |
| 9 | StaffIQ | Direct and analytical: intelligence about your staff. It describes the executive insight side perfectly. The risk is that IQ suffixed names are common in HR software, so a clearance search matters more here. |
| 10 | CrestPath | The path to the crest: a growth journey brand. It is pleasant and safe, works pan African, and suits certification pathways, but it is the least specific about what the product actually does, which is why it ranks last. |

## Part 2: Code Cleanup Performed (10 July 2026)

The audit ran the TypeScript compiler, ESLint and a production build across the project. TypeScript was already clean. ESLint reported six errors and one warning, all in src/App.tsx. All seven findings were fixed with behaviour preserving changes, and the app was rebuilt, smoke tested end to end, screenshotted at desktop and mobile widths, and redeployed to Firebase hosting.

| # | Location | Problem | Fix applied |
|---|----------|---------|-------------|
| 1 | Platform Owner Notifications view | Date.now() called during render for the latest event age, breaking the React hooks purity rule | Added a notificationsNowTick state refreshed every 30 seconds, mirroring the pattern already used at the dashboard countdown, and referenced it in render |
| 2 | Settings token panel | Date.now() called during render for tokens due for rotation | Added a settingsNowTick state refreshed every 60 seconds and referenced it |
| 3 | Settings token panel | Date.now() called during render for tokens expiring within 14 days | Same settingsNowTick state referenced |
| 4 | Settings token panel JSX | Date.now() called during render for the rotation due badge | Same settingsNowTick state referenced |
| 5 | Token metadata export | tokenHash destructured but unused, flagged by the unused variables rule | Renamed to excludedTokenHash with an explicit void reference inside a block bodied map, so the export still strips secret values exactly as before |
| 6 | Sortable value comparator | A mutable result variable assigned a value that was never used | Replaced with a single const ternary expression |
| 7 | Help centre | HelpFeedbackButtons was defined inside the HelpFaq component, causing a missing dependency warning in a useMemo and a stale closure risk | Lifted HelpFeedbackButtons to a module level component receiving rating and an onRate callback as props, converted recordHelpEvent and rateHelpContent to useCallback, updated all five call sites and both dependency arrays |

Verification results: TypeScript clean, ESLint zero errors and zero warnings, production build succeeded in 1.03 seconds, the full Playwright smoke suite passed against the new build, and the live site now serves the new bundle. One UX observation was recorded for Part 3: the text size, dark mode and learning tips controls render twice on the login screen, which pushes the mobile login card far down the page.

## Part 3: Fifty Features to Make the App Simpler and Friendlier for Users

Ordered by importance, most important first. Effort and impact are rated Low, Medium or High.

| # | Feature | What it does and why it matters | Effort | Impact |
|---|---------|--------------------------------|--------|--------|
| 1 | Single accessibility control strip | Remove the duplicated text size, dark mode and learning tips controls on the login screen (confirmed in screenshots on both widths). One strip, consistently placed. First impressions decide adoption. | Low | High |
| 2 | Guided first login tour | A three step overlay on first login: here are your tests, here are your results, here is help. Learners confused on day one disengage permanently. | Medium | High |
| 3 | Resume where you left off card | A dashboard card that returns the user to their last incomplete test or lesson in one tap. The session data already exists. | Low | High |
| 4 | One tap start next test | The single most common employee action, promoted to a large primary button on the dashboard. | Low | High |
| 5 | Pre submit review screen | Before final submission, show answered, unanswered and flagged questions in a grid so nobody submits blanks by accident. | Medium | High |
| 6 | Question flagging | Let users mark a question to revisit before time runs out. Standard assessment comfort feature. | Low | High |
| 7 | Per question saved indicator | A small tick confirming each answer is stored. The sync state machinery already exists; surfacing it reduces anxiety on shaky networks. | Low | High |
| 8 | Plain language result summary | After each test: you passed, your strongest topic, your next focus. The topic tags and mastery data already exist to power it. | Medium | High |
| 9 | Countdown warnings | Gentle alerts at five minutes and one minute remaining, plus a visible progress bar throughout. | Low | High |
| 10 | Auto submit with grace note | When time expires, submit what exists and say so kindly, rather than losing work. | Low | High |
| 11 | Forgotten password self service | A reset flow so staff are not blocked waiting for an admin. | Medium | High |
| 12 | Password visibility toggle | Show or hide password on login plus a caps lock warning. Tiny change, fewer support calls. | Low | Medium |
| 13 | Mobile bottom navigation | My Tests, My Results and Help as a fixed bottom bar on phones, where thumbs actually are. | Medium | High |
| 14 | Bigger answer cards | Replace small radio targets with full width tappable answer cards, minimum 44 pixel touch height. | Low | High |
| 15 | Offline banner with auto retry | The app already tracks offline state; show a calm banner and retry automatically instead of failing silently. | Low | High |
| 16 | Practice mode | Untimed practice with instant explanations. The question schema already stores explanations, so this is mostly a display mode. | Medium | High |
| 17 | Keyboard answering | Keys A to E select options, arrow keys navigate questions on desktop. | Low | Medium |
| 18 | Deadline calendar view | A simple calendar of upcoming test deadlines in My Tests. | Medium | Medium |
| 19 | Reminder nudges | Notifications before a deadline, with a daily digest option instead of many pings. | Medium | High |
| 20 | Personal progress trends | A line chart in My Results showing score trends over time. Session history already stores everything needed. | Medium | High |
| 21 | Certificate download | A branded PDF certificate on passing, which staff genuinely value and share. | Medium | High |
| 22 | Contribution points in header | The points system already exists; showing it in the profile header rewards participation. | Low | Medium |
| 23 | Universal search box | One search across tests, results and help articles from the top bar. | Medium | Medium |
| 24 | What is this page button | A single help trigger per view powered by the existing CHATS registry, for people who missed the tooltips. | Low | Medium |
| 25 | Friendly error messages | Replace technical failures with plain words and a retry button, everywhere. | Medium | High |
| 26 | Empty states with next steps | Every empty list gets one sentence and one button pointing to the obvious next action. | Low | Medium |
| 27 | Session timeout warning | Warn before logout and offer one tap to extend, protecting test progress. | Low | Medium |
| 28 | Continue on another device | Prompt to resume a test or lesson started elsewhere; the session merge logic already preserves the newer state. | Medium | Medium |
| 29 | Test instructions checklist | A standard ready screen before starting: duration, question count, pass mark, rules. | Low | Medium |
| 30 | Bite size lesson chunks | Split long training content into short sections with completion ticks; module progress tracking already exists. | Medium | High |
| 31 | Playback speed controls | Speed options for video and audio training content. | Low | Medium |
| 32 | Recently viewed content | A short list of the last training items opened, for quick return. | Low | Medium |
| 33 | Download my results | A personal PDF export of results, matching the workbook exports admins already enjoy. | Medium | Medium |
| 34 | Remember display preferences | Persist font scale and dark mode per user account across devices, not just per browser. | Low | Medium |
| 35 | Pidgin microcopy option | An optional friendly language layer for buttons and hints. Distinctive, inclusive and very Nigerian. | Medium | Medium |
| 36 | Two tap post test feedback | Was this test fair, yes or no plus optional comment, feeding the existing feedback module. | Low | Medium |
| 37 | Onboarding checklist widget | For new staff: complete profile, take practice test, take first real test, each with a tick. | Medium | Medium |
| 38 | Profile self service | Let staff update their photo and phone number without asking an admin. | Medium | Low |
| 39 | Image zoom in questions | Tap to enlarge any question image on mobile. | Low | Medium |
| 40 | Colour contrast pass | Audit all badges and status chips to WCAG AA contrast, in both themes. | Medium | Medium |
| 41 | Screen reader labels | Complete aria labels for the sidebar, dashboard widgets and test controls. | Medium | Medium |
| 42 | Reduced motion support | Respect the reduced motion preference for transitions and chart animations. | Low | Low |
| 43 | Skip to content link | A keyboard skip link past the sidebar for faster navigation. | Low | Low |
| 44 | Standardised toasts | One consistent confirmation style for saves, submissions and errors across all views. | Low | Medium |
| 45 | Clear back buttons | Consistent back navigation in nested views so nobody feels lost. | Low | Medium |
| 46 | Progressive settings disclosure | Show basic settings first with advanced panels collapsed, shrinking the wall of options. | Low | Medium |
| 47 | Estimated reading time | Show estimated minutes on each training item so staff can plan. | Low | Low |
| 48 | Saved help articles shelf | The save button already exists in help; give saved items a visible shelf on the dashboard. | Low | Low |
| 49 | Sound and vibration cues | Optional subtle cues for timer warnings on mobile. | Low | Low |
| 50 | Celebration moments | A brief congratulations animation on passing or completing a course. Small delight, real retention. | Low | Low |

## Part 4: Fifty Features to Give the CEO and Platform Owner More Insight

Ordered by importance, most important first. Research note: current learning analytics practice holds that pass and fail rates are the least useful slice of assessment data; question level patterns reveal whether a problem is a content problem or a people problem, and executive reporting should tie training to business outcomes with a handful of headline metrics.

| # | Feature | What it does and why it matters | Effort | Impact |
|---|---------|--------------------------------|--------|--------|
| 1 | Executive summary dashboard | One screen with three to five headline numbers: workforce readiness score, compliance rate, at risk count, trend arrow, next deadline. The CEO should understand the organisation in ten seconds. | Medium | High |
| 2 | Question level failure analysis | When seventy percent of a team misses the same question, that is a content problem, not a people problem. Rank questions by failure rate with drill down. Exposure counts and session answers already exist. | Medium | High |
| 3 | Skill mastery heat map | Topics across departments in one colour coded grid, powered by the existing mastery tracking. Gaps become visible in one glance. | Medium | High |
| 4 | At risk employee early warning | A ranked list combining low scores, repeated failures and inactivity, so managers intervene before audits or incidents. | Medium | High |
| 5 | Compliance posture panel | Who is certified, who is overdue, what expires within 30, 60 and 90 days, with one tap chase up notifications. | Medium | High |
| 6 | Month on month trend lines | Pass rates, participation and average scores over time, per department and per test. Direction matters more than snapshots. | Medium | High |
| 7 | Cohort comparison | Compare departments, roles, locations or hire date cohorts side by side on any metric. | Medium | High |
| 8 | Score distribution histograms | See the shape of results per test, not just the average; a twin peaked distribution tells a very different story. | Low | High |
| 9 | Anomaly alerts | Automatic flags when a metric moves sharply: failure spike on a test, sudden drop in participation, unusual login pattern. | Medium | High |
| 10 | Weekly executive email digest | An automated Monday morning summary of the five numbers that changed and why, delivered without logging in. | Medium | High |
| 11 | Integrity signals | Flag suspiciously fast completions and identical answer patterns between users; timing data per session already exists. | Medium | High |
| 12 | Item difficulty calibration | Compare labelled difficulty against actual performance and suggest relabelling, keeping the question bank honest. | Medium | Medium |
| 13 | Distractor analysis | Show which wrong option each question pulls people towards, exposing misconceptions and badly worded items. | Medium | Medium |
| 14 | Question bank health score | Stale questions, overexposed questions (exposure counts already tracked) and topics with too few items, in one panel. | Medium | Medium |
| 15 | Manager roll up views | Give each manager a scoped dashboard of only their team, with the CEO seeing the roll up of roll ups. | High | High |
| 16 | Training ROI view | Link assessment improvements to business measures the CEO already tracks, entered as simple targets, so training spend can be defended in the boardroom. | High | High |
| 17 | Readiness forecasting | Project compliance readiness by a chosen date from current completion velocity: at this pace, 84 percent ready by 1 September. | High | High |
| 18 | Abandonment analysis | Which question do people quit on, and where in the funnel do assigned tests stall: assigned, started, completed. | Medium | Medium |
| 19 | Mastery decay curves | Retention of topic mastery over time, informing when recertification should happen rather than guessing. | High | Medium |
| 20 | Recertification engine | Automatic reassignment of assessments on expiry cycles, with escalation when ignored. | High | High |
| 21 | AI narrative insights | Use the existing Perplexity function integration to turn each dashboard into five sentences of plain executive prose: what changed, why it matters, what to do. | Medium | High |
| 22 | Custom report builder | Pick metrics, filters and grouping, save the view, share it. Saved views become the organisation's standard reports. | High | High |
| 23 | Report snapshot freezing | Freeze a report as at a timestamp so a board pack never changes under later data edits. The smoke test fixtures already anticipate this concept. | Medium | High |
| 24 | Board pack generator | One click assembly of the monthly KPIs, trends and narrative into a branded PDF or slide deck. | High | High |
| 25 | Scheduled report delivery | Any saved report can be emailed on a schedule to named recipients. | Medium | Medium |
| 26 | Export centre | One place listing every workbook export ever generated, with re download and history; export logic already exists. | Low | Medium |
| 27 | Audit trail search | Full text search and filtered export over the existing audit events, ready for external auditors. | Medium | High |
| 28 | Permission change alerts | Instant notification to the Platform Owner when roles or permissions change, using the existing audit stream. | Low | High |
| 29 | Usage heat map | Logins and activity by hour and weekday, revealing when training actually happens and when to schedule launches. | Low | Medium |
| 30 | Adoption funnel | Invited, activated, first test completed, regularly active: the four stages of rollout in one funnel chart. | Medium | High |
| 31 | Learning engagement index | A single composite per employee blending recency, frequency and depth of activity from the existing analytics events. | Medium | Medium |
| 32 | Inactivity churn list | Everyone silent for 30 days or more, one tap to nudge them all. | Low | Medium |
| 33 | Data quality panel | Users without departments, tests without topics, unanswered imports: dirty data quietly poisons every chart above. | Medium | Medium |
| 34 | Goal tracking | Set a target such as 90 percent pass rate in Sales by Q4 and watch a progress bar, turning dashboards into direction. | Medium | High |
| 35 | Benchmark against organisation | Every department metric shown against the organisation average, making over and under performance obvious. | Low | Medium |
| 36 | Topic to content gap mapping | When a topic fails widely and no training module covers it, say so and suggest creating one, closing the loop between assessment and training. | High | High |
| 37 | Bug and feedback trends | Trend and resolution time panels over the existing problem reports module, with severity mix and SLA tracking. | Medium | Medium |
| 38 | Contribution culture metrics | Leaderboards and trends from the existing contribution points, showing who strengthens the platform. | Low | Low |
| 39 | Sync and system health panel | Uptime, sync failures and client diagnostics (already recorded locally) surfaced for the Platform Owner. | Medium | Medium |
| 40 | Token governance dashboard | The API token registry already tracks rotation, risk and usage; add a summary panel with expiry calendar and risk trends. | Low | Medium |
| 41 | Segmented announcements | Send targeted notifications to precise cohorts: everyone who failed test X, every manager, one department. | Medium | Medium |
| 42 | Question author quality | Which authors or sources produce items that perform well statistically, informing where to commission new content. | Medium | Low |
| 43 | HRIS import mappings | Saved column mappings for the existing CSV and Excel imports so monthly staff updates become one click. | Medium | Medium |
| 44 | What if simulator | Slide the pass mark and instantly see how many people would pass or fail, before committing a policy change. | Medium | Medium |
| 45 | Multi branch roll up | Group results by branch or subsidiary with a consolidated executive view, opening the door to serving client organisations. | High | High |
| 46 | Read only executive mobile view | A phone friendly, read only dashboard for the CEO with the headline numbers and digest. | Medium | Medium |
| 47 | Peer industry benchmarking | Anonymous aggregate comparison across participating organisations, a future differentiator when the platform serves many clients. | High | Medium |
| 48 | Cost per completion metric | Enter a training budget and see cost per completed certification trend downward as adoption grows. | Low | Medium |
| 49 | Retention correlation view | Where staff exit data is provided, correlate assessment engagement with retention, a story CEOs remember. | High | Medium |
| 50 | Public trust page | An optional certification verification page where third parties confirm a certificate ID is genuine, adding external credibility. | Medium | Low |

## Research Sources

Grounding for the analytics and UX positions above: [Absorb LMS on the top reports to track](https://www.absorblms.com/blog/top-lms-reports), [Disprz on LMS analytics metrics](https://disprz.ai/blog/lms-analytics-reporting-guide), [Apps365 on LMS dashboard practice](https://www.apps365.com/blog/lms-dashboard/), and [eLeaP on choosing learning platforms](https://www.eleapsoftware.com/best-lms-systems-in-2026-a-practical-data-driven-guide-to-choosing-the-right-learning-platform/).
