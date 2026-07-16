# KitchenOps Mobile Navigation Update

This update adds a phone and portrait-tablet navigation drawer without changing the desktop sidebar.

## Included

- Hamburger button on screens below the desktop breakpoint
- Slide-out navigation drawer
- Tap-outside-to-close overlay
- Close button
- Escape-key close support
- Automatic close after changing page
- Page scrolling locked while drawer is open
- Current user, role and site shown in the drawer
- Mobile logout button
- Desktop sidebar remains visible on large screens

## Test

1. Run `npm run typecheck`.
2. Run `npm run build`.
3. Run `npm run dev`.
4. Open KitchenOps on a phone.
5. Tap the menu button in the top-left.
6. Open several pages and confirm the drawer closes after selection.
7. Confirm logout works from the drawer.
8. Test a tablet in portrait and landscape.
