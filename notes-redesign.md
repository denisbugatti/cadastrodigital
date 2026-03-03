# Redesign Analysis Notes

## Current Structure
- **Dashboard.tsx** (1662 lines): Lists forms with its own sidebar (folders), header, search, filters, templates, form cards. Has its own mobile sidebar drawer.
- **Responses.tsx** (1836 lines): Shows responses/analytics for a specific form. Has stats cards, search, filters, charts, conversion funnel, response cards with timeline.
- **AppLayout.tsx** (291 lines): Shared layout with desktop sidebar nav + mobile bottom nav. Used by Responses, StaffManagement, CadenceManagement, Settings.
- **App.tsx**: Dashboard is standalone (no AppLayout wrapper), Responses is wrapped in AppLayout.

## Key Issues
1. Dashboard has its OWN sidebar with folders + management links
2. AppLayout has a SEPARATE sidebar with nav items
3. Inconsistent navigation between Dashboard and other pages
4. Responses "Voltar" links to "/" instead of "/dashboard"
5. Mobile experience needs improvement on both pages

## Redesign Plan
1. Dashboard keeps its own layout (with folder sidebar) but add mobile bottom nav for consistency
2. Responses stays in AppLayout with improved responsive design
3. Add mobile bottom nav to Dashboard for consistency
4. Fix "Voltar" links to point to /dashboard
5. Improve mobile card layouts, spacing, touch targets
