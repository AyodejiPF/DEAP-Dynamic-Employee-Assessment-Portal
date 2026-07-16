# StaffiQ website prompt workflow and execution brief

## Original request summary

Rebrand the employee training and assessment product as StaffiQ, prepare it for `www.staffiq.ng`, create a complete multipage public website inside `staffiq-website`, establish an original visual identity and logo, position StaffiQ for the same Nigerian and African SME market as TaskPulse, explain how the two products complement one another, publish the website immediately on Firebase, and leave the site ready for the custom domain.

## Result A

<result_a>
Act as a senior SaaS brand strategist, Nigerian SME product marketer, product designer, content architect, accessibility specialist, frontend engineer, quality assurance lead, and Firebase deployment engineer. Build and publish the complete public website for StaffiQ, a workforce training and assessment platform created by RevenStrat Integrated Services for Nigerian and African SMEs.

Create the website inside the existing project under a dedicated `staffiq-website` folder. Preserve the existing StaffiQ application and its production hosting. Treat the public website as a separate deployment surface with its own build checks, Firebase configuration, assets, security headers, and rollback path.

Position StaffiQ as the practical way for SME owners and managers to train employees, run fair assessments, understand capability gaps, manage learning records, and make better people decisions from evidence. Use plain language for general visitors. Avoid technical terms unless they explain a clear business benefit. Position TaskPulse as the complementary accountability product: StaffiQ shows what people know and where they need support, while TaskPulse shows what work is being completed and validated.

Create a coherent original identity using the exact brand spelling `StaffiQ`. Select a distinctive colour system, typography, symbol, product mockup language, and component system suited to serious Nigerian SMEs. The design should feel modern, credible, calm, and locally grounded without becoming childish, generic, or visually noisy.

Deliver a strong home page plus dedicated pages for features, training, plans, about, contact, and a useful not found page. Include clear calls to action, a real sign in path to the current StaffiQ application, mobile navigation, accessible forms, search friendly metadata, social sharing metadata, a sitemap, robots instructions, and a clear StaffiQ plus TaskPulse cross sell story.

Do not publish invented customer testimonials, placeholder telephone numbers, an unapproved free trial, or claims that depend on unavailable cloud services. Approved monthly pricing is Starter at N7,500 per user with five users minimum, Growth at N12,500 per user with ten users minimum, and Command at N15,000 per user with ten users minimum. Do not use the former client brand anywhere on the public website. Refer to tests as assessments. Use UK English.

Make the site usable from 320 pixel mobile screens through large desktop screens. Prevent horizontal overflow, clipped text, inaccessible controls, hidden content when JavaScript fails, and layout shift. Support keyboard navigation, visible focus, reduced motion, semantic headings, labelled form controls, useful errors, and WCAG Level AA contrast.

Use a fast static architecture with no unnecessary framework or runtime dependency. Add repeatable local verification and build scripts. Deploy only a generated public artefact to a dedicated Firebase Hosting site. Confirm that every page, asset, internal link, security header, mobile layout, and public URL works before reporting completion.
</result_a>

## Result B

<result_b>
Build a production ready StaffiQ marketing website that converts SME owners, HR leaders, operations managers, training providers, and business consultants into demo enquiries.

The home page must establish StaffiQ as a workforce training and assessment product in the first viewport. It must show the product itself through a realistic interface visual, explain the commercial problem in plain terms, and provide a clear demo action. The first viewport must remain compact enough to reveal the next content band on both mobile and desktop.

The information architecture must include Home, Features, Training, Plans, About, Contact, and Not Found. Every page must use the same navigation, exact brand spelling, generated StaffiQ symbol, footer, sign in destination, metadata, colour system, typography, and interaction rules.

The features page must describe only capabilities grounded in the current application: role aware dashboards, training content, question banks, timed assessments, user management, result records, analytics, report export, notifications, help content, bug reporting, contribution points, personalised layouts, audit records, private feature inventory, and token governance. General visitor copy must focus on outcomes. Privileged internal governance detail must not be exposed on the public marketing website.

The training page must present practical SME learning areas and explain the learning loop without claiming that every proposed course is already bundled. The plans page must explain commercial packaging without inventing prices, discounts, trial terms, employee limits, or service levels. The contact form must be short, accessible, safe, and honest about its email based delivery until a server side lead endpoint is available.

Use a static HTML, CSS, and JavaScript implementation. Add progressive enhancement so content remains visible without JavaScript. Avoid decorative gradient orbs. Keep cards restrained with small radii. Keep letter spacing at zero. Use stable dimensions for the product mockup and brand assets. Use responsive rules that remove the current mobile overflow and keep all touch targets comfortable.

Add a build script that copies only public assets into a deployment folder, a verification script that checks links and forbidden placeholders, and a dedicated Firebase configuration with strict security headers and cache rules. Do not modify or deploy the existing StaffiQ application hosting target.

Validate all pages locally, check mobile and desktop screenshots, test navigation and interactive controls, run the build and verifier, deploy to a new Firebase Hosting site, then verify the live page title, page content, assets, headers, and key routes.
</result_b>

## Super prompt

<super_prompt>
Create and publish the complete StaffiQ public website inside `staffiq-website`. Use the original request, Result A, and Result B as one authoritative brief. Preserve the existing application and production data. Build a truthful, polished, accessible, responsive, multipage static site for Nigerian and African SMEs. Use the exact spelling StaffiQ, the new original brand symbol, simple business language, and a clear StaffiQ plus TaskPulse relationship. Remove unapproved prices, trials, fake testimonials, placeholder contact details, unavailable service claims, and every use of “tests” in public product copy. Link Sign in to the current StaffiQ application. Add production build checks, isolated Firebase Hosting configuration, browser validation, and a dedicated live URL. Complete the build, deployment, and live verification in one delivery.
</super_prompt>

## Acceptance criteria

1. The site lives only inside `staffiq-website` apart from shared coordination notes.
2. The current StaffiQ application and its hosting target are not changed by this website deployment.
3. Every public page uses the exact StaffiQ spelling and assessment terminology.
4. Mobile widths from 320 pixels do not overflow or clip content.
5. No fake testimonial, placeholder telephone number, invented price, unapproved trial, or unavailable cloud claim is published.
6. Sign in opens the current StaffiQ application.
7. Keyboard access, focus, reduced motion, semantic structure, labels, and readable contrast are present.
8. The production build contains only public website files.
9. Automated verification and browser checks pass.
10. Firebase serves the expected site on a dedicated live URL.
