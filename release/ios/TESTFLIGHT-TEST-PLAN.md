# KitchenOps — TestFlight Test Plan

## Goal

Verify that KitchenOps works properly as an iOS app before App Store submission.

The first target is not public release.

The first target is:

Install KitchenOps through TestFlight on a real iPhone and confirm all critical workflows work correctly.

---

# 1. Installation

Confirm:

- TestFlight installation completes
- App icon displays correctly
- App name displays as KitchenOps
- App launches without crashing
- Splash screen displays correctly
- Production KitchenOps app loads

---

# 2. Authentication

Test:

- Login with valid account
- Invalid login
- Logout
- Login again
- Session persistence after closing app
- Session persistence after restarting iPhone
- Expired session behaviour

Expected:

User should not be unexpectedly logged out during normal use.

---

# 3. Trial Signup

Test:

- Start new business trial
- Complete signup
- Business is created
- Site is created
- Trial starts correctly
- Welcome email is received
- KitchenOps opens after signup

Confirm:

- 30-day trial
- No payment card required
- Correct trial expiry date
- User cannot bypass trial entitlement rules

---

# 4. Dashboard

Test:

- Dashboard loads
- Site selector works
- Correct site data shown
- All Sites works where applicable
- Dashboard cards navigate correctly
- Needs Your Attention updates correctly

---

# 5. Prep Planner

Test:

- Open Prep Planner
- View Today
- View Tomorrow
- Add prep where permitted
- Change quantity
- Start prep
- Complete prep
- Awaiting Approval state
- Approve prep
- Recipe button
- Carry incomplete prep forward

Confirm:

- buttons are easy to tap
- no clipped cards
- no horizontal layout problems

---

# 6. Recipes

Test:

- Recipe library loads
- Search recipes
- Open recipe
- Ingredients display
- Method displays
- Cost information displays where applicable

---

# 7. Products

Test:

- Product list loads
- Search products
- Open product
- Categories display correctly
- Supplier information displays
- Stock information displays

---

# 8. Inventory

Test:

- Inventory loads
- Current stock displays
- Inventory movements display
- Delivery movements
- Production movements
- Waste movements
- Stocktake movements
- Adjustments

---

# 9. Purchasing

Test:

- Purchasing page loads
- Create order
- Add products
- Change quantities
- Save order
- Send order
- View order status
- Receive order
- Enter delivered quantities
- Enter prices
- Complete receiving

Confirm inventory updates correctly.

---

# 10. Waste

Test:

- Open Waste
- Add waste entry
- Select product
- Enter quantity
- Save waste
- Recent waste appears
- Inventory reduces appropriately

---

# 11. Stocktakes

Test:

- Open stocktakes
- Start stocktake
- Enter quantities
- Complete stocktake
- Review totals
- Inventory updates correctly
- Previous stocktake information remains accessible where applicable

---

# 12. Handover

Test:

- View today's handover
- Create tomorrow's handover
- Save handover
- Reload app
- Confirm handover remains saved
- Confirm correct site attribution

---

# 13. Suppliers

Test:

- Supplier list loads
- Supplier details load
- Contact information displays
- Lead time displays
- Delivery days display

---

# 14. Users

Test:

- Users page loads
- Roles display correctly
- Shared login behaviour
- Individual account behaviour
- Remembered team member behaviour
- Quick switching where available

---

# 15. Settings

Test:

- Business settings
- Sites
- Users
- Integrations
- Product options
- Release notes
- About
- Help
- Feedback
- Logout

---

# 16. Trial Expiry

Using a controlled test account:

- Expire trial
- Relaunch app
- Confirm operational access is blocked
- Confirm subscription-required screen appears
- Confirm existing business data remains preserved
- Restore entitlement
- Confirm access returns

---

# 17. Subscription Expiry

Once Stripe is implemented:

Test:

- Active subscription
- Expired/cancelled subscription
- Failed payment state if applicable
- Restored subscription
- Billing portal flow

---

# 18. Account Deletion

Before App Store submission:

Test complete deletion flow.

Confirm:

- deletion can be initiated correctly
- confirmation is clear
- user understands consequences
- app handles deleted account gracefully
- user cannot continue using deleted credentials

---

# 19. External Links

Test all external links:

- Privacy Policy
- Support
- Website
- Any supplier URLs
- Subscription/billing links if permitted

Confirm links open correctly on iOS.

---

# 20. Mobile UI

Check every major screen for:

- Safe area / notch spacing
- Bottom navigation spacing
- Keyboard overlap
- Modal height
- Scroll behaviour
- Button size
- Text clipping
- Horizontal scrolling
- Dropdown behaviour
- Input focus
- Date pickers
- Number inputs

---

# 21. Background / Resume

Test:

1. Open KitchenOps
2. Navigate into a workflow
3. Background the app
4. Wait 30 seconds
5. Resume

Repeat after:

- 5 minutes
- 30 minutes
- several hours

Confirm app resumes safely.

---

# 22. Network Testing

Test:

- Good Wi-Fi
- Mobile data
- Slow connection
- Temporary loss of connection
- Reconnect after network loss

Confirm:

- app does not crash
- useful loading/error states appear
- user data is not accidentally duplicated

---

# 23. Device Testing

Minimum target:

- One current iPhone
- One smaller-screen iPhone where possible

Recommended later:

- iPad if KitchenOps officially supports iPad

---

# 24. TestFlight Release Gate

Do not move to App Store Review until:

- [ ] Installation works
- [ ] Login works
- [ ] Trial signup works
- [ ] Dashboard works
- [ ] Prep Planner works
- [ ] Recipes work
- [ ] Products work
- [ ] Inventory works
- [ ] Purchasing works
- [ ] Waste works
- [ ] Stocktakes work
- [ ] Handover works
- [ ] Suppliers work
- [ ] Users work
- [ ] Settings work
- [ ] Trial expiry works
- [ ] Account deletion checked
- [ ] Subscription behaviour checked
- [ ] No major iOS layout problems
- [ ] No crashes
- [ ] Privacy declarations verified
- [ ] Reviewer account ready