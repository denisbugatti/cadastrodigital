# Responsive Audit Findings

## Dashboard
- Already has mobile sidebar drawer, hamburger menu, mobile search bar
- Header buttons have sm: responsive classes
- Cards grid is grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 (good)
- Issue: Too many header buttons on mobile (corretores, bell, import, create) - overflow
- Issue: Sidebar uses lg:block but hamburger uses lg:hidden - should be consistent
- Fix: Simplify header on mobile, group actions into dropdown

## Builder/Editor
- Header has sm: responsive classes for tabs
- Left sidebar: hidden md:block (good)
- Right config panel: hidden lg:block (good)
- Issue: On mobile, NO way to access sidebar or config panel
- Issue: No bottom navigation or swipe to access panels on mobile
- Fix: Add mobile bottom bar with sidebar/config toggles
- Fix: Add slide-over panels for mobile

## FormContainer (form filling)
- Already has sm: responsive classes
- Navigation arrows positioned responsively
- Issue: Content max-width and padding could be tighter on mobile
- Issue: pr-16 sm:pr-20 leaves too much right padding on mobile

## Responses page
- Already has good sm: responsive classes
- Header, cards, and detail view are responsive
- Issue: Stats cards could be better on mobile

## Key Fixes Needed:
1. Dashboard: Simplify header on mobile, reduce button clutter
2. Builder: Add mobile bottom navigation for sidebar/config access
3. Builder: Add slide-over sheets for sidebar and config on mobile
4. FormContainer: Tighten mobile padding
5. General: Improve touch targets (min 44px)
6. General: Add safe-area insets for notched phones
