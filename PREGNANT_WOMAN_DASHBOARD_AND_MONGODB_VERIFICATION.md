# Pregnant Woman Dashboard & MongoDB Verification

## Summary of Changes

### 1. **Login & session (correct details for logged-in pregnant woman)**
- **authService.js**: Session now stores the **full user object** (including `roleSpecificData`, `phone`, etc.) so the pregnant woman dashboard can show real data.
- Session is created with `id: result.data.user.id || result.data.user._id` so the dashboard can call the pregnancy profile API with the correct user ID.

### 2. **Registration → MongoDB**
- **auth.js – main register (`POST /api/auth/register`)**: When role is `pregnant-woman`, after creating the **User** document, a **PregnantWoman** document is also created and linked via `userId` and `registeredBy`. Address is normalized to match the PregnantWoman schema (street, village, block, district, state, pincode).
- **auth.js – register-pregnant-woman (`POST /api/auth/register-pregnant-woman`)**: PregnantWoman creation now uses the correct schema: `lastMenstrualPeriod`, `expectedDeliveryDate`, `anganwadiCenter`, nested `address`, and `registeredBy`.
- **RegisterPage.jsx**: Sends `dateOfBirth` and full address in `roleSpecificData.pregnantWomanDetails` and in `address` for pregnant-woman registration.

### 3. **Pregnancy profile API**
- **pregnancy.js**: Profile is resolved by **userId** (logged-in user’s ID). Uses PregnantWoman fields: `lastMenstrualPeriod`, `expectedDeliveryDate`, `anganwadiCenter` (no `lmp`/`edd`/`assignedCenter`). Related data (health, supplements, visits, alerts) is queried using **PregnantWoman _id** (`pwId`).
- Response shape is aligned with the dashboard: `woman`, `health`, `supplements`, `appointments`, `visits`, `alerts`, `milestones`, `aiPrediction`.

### 4. **Pregnant woman dashboard**
- **PregnancyMonitoringDashboard.jsx**: Calls `GET /api/pregnancy/profile/:userId` first (using session user id). On success, uses that profile; on failure or 404, falls back to profile built from session user data (`createProfileFromUserData`).
- **PregnantWomanDashboard.jsx**: Passes `womanId = user?.id || user?._id` and full `userData` so the child component can load the correct profile.

### 5. **PregnantWoman model**
- Index added on `userId` for fast lookup when loading profile by logged-in user.

---

## Verifying data in MongoDB Compass

### 1. **After self-registration (Register page as Pregnant Woman)**

1. Open **MongoDB Compass** and connect to your database.
2. Open the database used by the app (e.g. the one in `MONGODB_URI` or your local DB name).
3. Check these collections:

**`users`**
- Find the new user by `email` (the one used to register).
- Confirm:
  - `role`: `"pregnant-woman"`
  - `roleSpecificData.pregnantWomanDetails`: has `husbandName`, `lastMenstrualPeriod`, `expectedDeliveryDate`, `pregnancyNumber`, `anganwadiCenter`, etc.
  - `address`: has the address you entered.

**`pregnantwomen`** (or the actual name of the PregnantWoman collection, often `pregnantwomen`)
- Find the document where `userId` equals the **ObjectId** of the user you just found in `users`.
- Confirm:
  - `name`, `phone`, `email` match the registration form.
  - `lastMenstrualPeriod`, `expectedDeliveryDate` are dates.
  - `address`: has `street`, `village`, `block`, `district`, `state`, `pincode`.
  - `anganwadiCenter` is set.
  - `registeredBy` and `userId` both reference the same User `_id`.

### 2. **Quick checklist**

| What to check | Where | Expected |
|---------------|--------|----------|
| User created | `users` | One document with `role: "pregnant-woman"` and correct email/name/phone. |
| PregnantWoman created | `pregnantwomen` | One document with `userId` = that user’s `_id`. |
| Link user ↔ woman | Both collections | `users._id` = `pregnantwomen.userId` and `pregnantwomen.registeredBy`. |
| Pregnancy dates | `pregnantwomen` | `lastMenstrualPeriod`, `expectedDeliveryDate` as dates. |
| Address | `pregnantwomen.address` | `street`, `village`, `block`, `district`, `state`, `pincode` present. |

### 3. **Testing flow**

1. **Register**: On the app’s Register page, choose “Pregnant Woman”, fill the form (including date of birth, LMP, husband name, anganwadi center, address), and submit.
2. **Compass**: Refresh the `users` and `pregnantwomen` collections and confirm the new user and the new PregnantWoman document as above.
3. **Login**: Log in with the same email and role “Pregnant Woman”.
4. **Dashboard**: Open the Pregnant Woman dashboard; it should show the same name, pregnancy details, and address (from the profile API, which reads from the PregnantWoman document by `userId`).

If the dashboard still shows generic or wrong data, check:
- Backend logs for `GET /api/pregnancy/profile/:id` (status 200 vs 404).
- Browser devtools → Network: response of the pregnancy profile request.
- Session: in Application → Local Storage, inspect the session JSON and confirm it contains `roleSpecificData` and that `id` or `_id` is the same as the user’s `_id` in the `users` collection.

---

## API used by the dashboard

- **GET** `/api/pregnancy/profile/:id`  
  - `:id` = current user’s ID (from session: `user.id` or `user._id`).  
  - Backend finds **PregnantWoman** by `userId`, then returns the profile in the shape expected by the pregnancy dashboard.
