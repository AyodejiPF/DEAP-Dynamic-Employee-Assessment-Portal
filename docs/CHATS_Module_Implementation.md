# CHATS Module Implementation Guide

CHATS means Contextual Hover-Activated Tooltip Learning System. It is a dependency-free learning layer that teaches users what each interface element does at the moment they show interest.

## Integration Steps

1. Import the module and stylesheet:

```ts
import { CHATS } from './chats-module'
import './chats-module.css'
```

2. Initialise once after the app mounts:

```ts
CHATS.init({
  enabled: true,
  hoverDelay: 3000,
  focusDelay: 1000,
  touchDelay: 500,
  registry: {
    'save-user': {
      title: 'Save user',
      body: 'Save the current user changes and sync them to the shared portal.',
      admin: 'Permission and account changes affect what this user can access.',
    },
  },
})
```

3. Add direct content where a precise tooltip is needed:

```html
<button data-tooltip="Save the changes on this screen and sync them to the cloud.">
  Save changes
</button>
```

4. Use a registry key when content should be managed centrally:

```html
<button data-tooltip-key="save-user">Save user</button>
```

5. Let CHATS generate fallback copy for normal buttons, inputs, tables, panels, badges, navigation, metrics, and admin controls when no data attribute is present.

## Sample Instrumented HTML

```html
<nav>
  <a href="/analytics" data-tooltip="Open analytics to review trends, weak topics, user performance, and decision intelligence.">
    Analytics
  </a>
</nav>

<button data-tooltip="Refresh the current screen with the latest cloud-published data before you make a decision.">
  Refresh
</button>

<label>
  Employee name
  <input data-tooltip="Enter the employee name exactly as it should appear in reports and dashboards." />
</label>

<button aria-label="Delete report" data-tooltip="Move this report entry out of active reporting." data-tooltip-admin="Deleted report entries stop influencing analytics until restored.">
  Delete
</button>

<button data-tooltip-key="token-create" data-tooltip-admin="Only Ayodeji Falope should create or copy token packages.">
  Generate Token Package
</button>
```

The runtime creates the single shared `<div role="tooltip" id="chats-global-tooltip">` node and adds `aria-describedby` to discovered trigger elements.

## Administrator Tooltip Writing Guidelines

Write tooltips in active voice and second person. Keep them useful in under 60 words. Explain what the element does, when to use it, and what happens after activation. For admin-only controls, add an admin note that states the system impact, whether the action changes shared data, and what should be checked before continuing.

Use this structure:

- Title: 2 to 5 words.
- Body: 1 to 3 short sentences.
- Guidance: only when the element is part of a workflow.
- Admin note: only for actions that affect users, tests, analytics, reports, branding, permissions, or tokens.

Avoid marketing language, vague phrases, and implementation jargon. Prefer “Use this to refresh the latest test availability” over “This button invokes the sync handler.”

## Quality Checklist

- Hover delay is 3000ms.
- Keyboard focus delay is 1000ms.
- Touch long-press delay is 500ms.
- Escape dismisses the active tooltip.
- Only one shared tooltip node is used.
- Dynamic content is discovered with MutationObserver.
- Tooltips stay inside the viewport.
- Tooltip text meets WCAG contrast expectations in light and dark mode.
- Reduced-motion users do not receive animation.
- Users can turn learning tips off from the display controls.
