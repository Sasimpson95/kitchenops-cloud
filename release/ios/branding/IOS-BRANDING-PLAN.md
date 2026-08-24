# KitchenOps — iOS Branding Plan

## App Name
KitchenOps

## Brand
KitchenOps by Simpson Software

## Bundle ID
com.kitchenops.app

---

# 1. App Icon

We need one high-quality master icon before building the iOS project.

Master file:

KitchenOps-App-Icon-1024.png

Required master dimensions:

1024 × 1024 px

Requirements:

- Square image
- No transparent background
- No rounded corners baked into the image
- No screenshot-style content
- No tiny text
- Must still be recognisable at very small sizes
- Keep important artwork away from the extreme edges

Apple will apply the final icon masking/rounding.

---

# 2. Recommended KitchenOps Icon Direction

Use the existing KitchenOps visual identity rather than inventing a completely different iOS brand.

Preferred concept:

- KitchenOps "K" mark
- Purple KitchenOps background
- Clean, simple composition
- High contrast
- No "by Simpson Software" text inside the icon

The app icon should be recognisable as KitchenOps even without the product name beside it.

---

# 3. Files To Prepare

Store these inside:

release/ios/branding/

Required:

- KitchenOps-App-Icon-1024.png

Useful source versions:

- KitchenOps-App-Icon-Master.png
- KitchenOps-Logo-Transparent.png
- KitchenOps-Logo-Dark.png
- KitchenOps-Logo-Light.png

Do not create dozens of manually resized iOS icons yet.

The final iOS/Xcode asset catalogue will be generated when the iOS project exists.

---

# 4. Splash / Launch Screen

Current KitchenOps Capacitor configuration uses:

- White background
- KitchenOps branding
- Short launch duration

For iOS, keep the launch screen simple.

Preferred:

- White background
- KitchenOps logo centred
- No marketing copy
- No loading text
- No buttons

The launch screen should only bridge the short period before the cloud application loads.

---

# 5. App Store Screenshots

Screenshots are separate from the app icon.

They should use:

- KitchenOps purple branding
- Real KitchenOps UI
- Consistent typography
- Short benefit-led headlines
- Clean background
- No customer data

See:

release/ios/SCREENSHOT-PLAN.md

---

# 6. App Store Product Branding

Use consistently:

KitchenOps

Supporting brand:

by Simpson Software

Do not alternate between:

- Kitchen Ops
- Kitchen-ops
- KitchenOPS
- Kitchenops

unless the product brand is deliberately changed later.

---

# 7. Colours

Use the existing KitchenOps website/application colours.

Primary visual direction:

- KitchenOps purple
- White
- Neutral greys

Do not introduce a separate iOS-only colour scheme.

---

# 8. Typography

The app itself should continue using its existing web typography.

App Store marketing artwork should:

- remain easy to read on a phone
- use bold short headlines
- avoid large blocks of copy
- visually match kitchenops.co.uk

---

# 9. Final Branding Check

Before App Store submission:

- [ ] 1024 × 1024 master app icon created
- [ ] Icon has no transparency
- [ ] Icon has no baked-in rounded corners
- [ ] Icon readable at small size
- [ ] KitchenOps name consistent
- [ ] Simpson Software attribution consistent
- [ ] Launch screen tested
- [ ] Screenshot artwork consistent
- [ ] No old branding remains in native project