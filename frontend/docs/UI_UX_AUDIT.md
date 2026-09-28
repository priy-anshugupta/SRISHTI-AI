# Frontend UI/UX audit

Updated: 27 September 2026

## Scope

The public site, login, all 12 dashboard route templates, shared navigation, dialogs, and the ROI calculator now use one semantic design system. Existing operational content, API calls, role restrictions, telemetry, and action handlers are retained.

## Findings and fixes

| Finding | Implemented correction |
| --- | --- |
| Neon accents and inconsistent dark surface colours competed with operational warnings. | Central canvas, surface, inset, text, border, action, and severity tokens; navy-led light default and coordinated night view. |
| Small typography, crowded cards, and inconsistent heading styles reduced scanability. | Readable 13px small text, consistent page headings, tabular figures, larger section spacing, and distinct cards. |
| Full-screen photography and decorative effects mixed with landing-page content. | Separate editorial image panel, solid navigation, clean section backgrounds, and removal of decorative gradients, glows, and emoji. |
| Header controls overflowed at laptop and phone widths. | Responsive action row and a separate wrapping telemetry row. |
| Desktop-only navigation consumed most of a phone screen. | Mobile drawer, labelled open/close controls, Escape dismissal, and automatic close after route selection. |
| Planning and review pages were not exposed in the main navigation. | Both routes added to Engineering & Data; active route marked with `aria-current`. |
| Dynamic Tailwind comparison-column interpolation could omit grid styles. | Explicit responsive column classes; aligned comparison card headers and mobile well selectors. |
| Alerts controls and analytics tabs clipped on narrow screens. | Responsive well-selector grid and wrapping filters/tabs. |
| Chat height and automatic scrolling obscured the page header and evidence on phones. | Responsive chat/evidence layout; automatic scrolling limited to the message stream. |
| Map and schematic labels relied on dark-only colours. | Theme-aware labels and tooltip surfaces; bundled Leaflet CSS replaces runtime CDN stylesheet loading. |
| Trace and evidence dialogs lacked keyboard focus management. | Named dialogs, initial focus, Tab containment, Escape dismissal, focus restoration, and mobile scrolling. |
| Inconsistent focus visibility and decorative motion. | Visible keyboard focus, skip link, labelled key inputs, keyboard-accessible login choices, and reduced-motion support. |

## Design conventions

- Use `bg-canvas`, `bg-surface`, and `bg-surface-muted` to distinguish the page, cards, and inset data.
- Use `text-ink`, `text-secondary`, and `text-muted` for text hierarchy.
- Use `bg-brand` for primary actions and `accent` for navigation/selection.
- Reserve `danger`, `warning`, and `success` for meaningful status, with text labels alongside colour.
- Use the shared `page-title` style for page headings. Keep engineering units and tabular figures intact.
- Keep wide tables inside horizontal scroll containers. Avoid interpolated Tailwind class names.
- Retain the persisted theme preference; light is the default for new sessions.

## Verification

- Production build and TypeScript checks passed for all routes.
- Visually inspected `/`, `/login`, `/map`, `/alerts`, `/doghouse`, `/compare`, `/analytics`, `/knowledge`, `/plan`, `/report`, `/ingest`, `/review`, `/ask`, and `/well/MOR-29`.
- Inspected mobile layouts at 390 × 844, including a route-wide check for primary controls extending beyond the viewport outside intentional horizontal scroll regions. Corrected the alerts and analytics issues found during that check.
- Exercised demo headquarters sign-in, mobile navigation, severity filtering, light/night switching, trace-dialog opening, Escape dismissal, and focus restoration.
- Compared lint results against the original tracked source: 62 original errors, 60 after the changes, with no newly introduced error messages in the comparison. Remaining errors concern existing typing, hooks, and JSX issues outside the visual redesign.
- Backend mutations, document uploads, safety sign-offs, and export output were not exercised as part of the visual verification.

This records UI and interaction checks, not formal accessibility or government compliance certification.
