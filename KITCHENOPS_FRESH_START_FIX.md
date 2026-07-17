# KitchenOps Fresh Start Fix

This update prevents a newly created business from inheriting another business's browser catalogue.

## Included changes

- Cloud catalogue is now separated by the authenticated business ID.
- Switching to a different business clears the previous business's browser catalogue before loading cloud data.
- An empty cloud catalogue remains empty and is never filled with demo/browser data automatically.
- Suppliers, products and storage areas no longer create starter records when their local store is empty.
- The Dashboard site selector and site cards now use the active sites belonging to the signed-in business instead of the Pudding Pantry demo site list.
- The first site entered during business creation remains, because this is the only onboarding step retained.

## No database migration

This update changes application behaviour only. No SQL migration is required.

## Expected result

A brand-new business contains:

- the business;
- the Operations user;
- the first site entered during signup.

It does not inherit suppliers, products, storage areas, stock or additional Pudding Pantry sites.
