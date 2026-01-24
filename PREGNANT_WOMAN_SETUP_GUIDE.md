# Pregnant Woman Registration & Dashboard - Setup Guide

## ✅ What's Been Implemented

### Backend
1. **User Model Updated**
   - Added `pregnant-woman` role to enum
   - Added `pregnantWomanDetails` to roleSpecificData schema

2. **Registration Endpoint**
   - `/api/auth/register` - Handles all roles including pregnant-woman
   - Validates pregnant woman data
   - Creates user with pregnancy information

3. **Validation Fixed**
   - Updated validation middleware to accept `pregnant-woman` role
   - Fixed syntax errors in auth.js

### Frontend
1. **Registration Form** (RegisterPage.jsx)
   - Added "Pregnant Woman" as registration option
   - Full pregnancy information form including:
     - Personal details (DOB, blood group, height, weight)
     - Pregnancy information (LMP, EDD, pregnancy number)
     - Spouse information
     - Anganwadi center selection
     - Special medical needs

2. **Login Page** (LoginPage.jsx)
   - Added "Pregnant Woman" to role options
   - Routes to `/pregnant-woman-dashboard` after login

3. **Pregnant Woman Dashboard**
   - Pregnancy progress tracking (weeks and days remaining)
   - Trimester information with health tips
   - Health checklist (8 prenatal care items)
   - Pregnancy milestones (weeks 12-40)
   - Personal and spouse information management

4. **Routing** (App.jsx)
   - Added `/pregnant-woman-dashboard` route
   - Protected route with role-based access

## 🔧 How to Test

### Prerequisites
1. **Backend Server Running**
   ```bash
   cd backend
   npm install
   npm start
   ```
   Server should run on: `http://localhost:5005`

2. **Frontend Development Server**
   ```bash
   cd forntend
   npm install
   npm run dev
   ```
   Frontend should run on: `http://localhost:5173` (or as shown)

3. **MongoDB Running**
   - Make sure MongoDB is running locally or connection string is correct

### Test Registration
1. Go to `/register`
2. Select "Pregnant Woman" as role
3. Fill in the form with test data:
   - Name: Your Name
   - Email: yourname@example.com
   - Password: TestPassword123
   - Phone: 10-digit number
   - Date of Birth: Select a date (15-50 years old)
   - Blood Group: Select one
   - Last Menstrual Period: Recent date
   - Expected Delivery Date: 280 days from LMP
   - Pregnancy Number: 1
   - Spouse Name & Phone: Optional but recommended
   - Height, Pre-Pregnancy Weight, Current Weight: Numbers in cm/kg
   - Anganwadi Center: Select from dropdown
   - Special Needs: Optional notes

4. Click "Create Account as Pregnant Woman"
5. You should see success message

### Test Login
1. Go to `/login`
2. Select "Pregnant Woman" role
3. Enter email and password from registration
4. Click Login
5. Should redirect to `/pregnant-woman-dashboard`

## 📊 Dashboard Features

Once logged in, pregnant women can:
- View pregnancy progress (weeks completed & days remaining)
- See current trimester information
- Track health checklist items
- View pregnancy milestones
- View and manage personal information
- Access health tips

## 🐛 If You See "Failed to Fetch"

This error usually means:
1. **Backend server not running** - Check if `npm start` is running in backend folder
2. **MongoDB not running** - Ensure MongoDB is accessible at `mongodb://localhost:27017`
3. **Port conflict** - Ensure port 5005 is available
4. **CORS issue** - Check browser console for CORS errors

### Quick Fix Checklist
```bash
# Kill any process on port 5005 (if on Windows)
netstat -ano | findstr :5005
taskkill /PID <PID> /F

# Restart backend
cd backend
npm start

# In another terminal, start frontend
cd forntend
npm run dev
```

## 📝 Files Modified

### Backend
- `/backend/models/User.js` - Added pregnant-woman role and schema
- `/backend/routes/auth.js` - Added registerPregnantWoman endpoint
- `/backend/middleware/validation.js` - Updated to accept pregnant-woman role

### Frontend
- `/forntend/src/pages/RegisterPage.jsx` - Added pregnant woman registration form
- `/forntend/src/pages/LoginPage.jsx` - Added pregnant woman to roles
- `/forntend/src/pages/PregnantWomanDashboard.jsx` - New dashboard component
- `/forntend/src/App.jsx` - Added dashboard route

## ✨ API Endpoints

### Register Pregnant Woman
```
POST /api/auth/register
Content-Type: application/json

{
  "name": "string",
  "email": "string",
  "password": "string",
  "phone": "string (10 digits)",
  "role": "pregnant-woman",
  "address": {
    "street": "string",
    "city": "string",
    "state": "string",
    "pincode": "string (6 digits)"
  },
  "roleSpecificData": {
    "pregnantWomanDetails": {
      "husbandName": "string",
      "husbandPhone": "string (10 digits)",
      "lastMenstrualPeriod": "date",
      "expectedDeliveryDate": "date",
      "pregnancyNumber": "number",
      "bloodGroup": "string",
      "height": "number (cm)",
      "prePregnancyWeight": "number (kg)",
      "currentWeight": "number (kg)",
      "anganwadiCenter": "string",
      "specialNeeds": "string"
    }
  }
}
```

### Login
```
POST /api/auth/login
Content-Type: application/json

{
  "email": "string",
  "password": "string",
  "role": "pregnant-woman"
}
```

## 🎯 Next Steps (Optional Enhancements)

1. **Add Prenatal Care Records**
   - Track doctor visits
   - Store medical reports
   - Log symptoms/concerns

2. **Add Notifications**
   - Upcoming checkup reminders
   - Health tips based on pregnancy stage
   - Important milestone notifications

3. **PDF Reports**
   - Download pregnancy summary
   - Print health records
   - Share with healthcare providers

4. **Integration with Workers**
   - ASHA workers can add prenatal records
   - Anganwadi workers can track nutrition programs
   - Automated health alerts based on data

5. **Mobile App**
   - React Native version
   - Offline support
   - Push notifications

## 📞 Support

If you encounter any issues:
1. Check the browser console (F12) for error messages
2. Check backend logs in terminal
3. Verify MongoDB connection
4. Ensure ports 5005 (backend) and 5173 (frontend) are available
5. Clear browser cache if needed

---
**Status**: ✅ All features implemented and tested
**Last Updated**: January 24, 2026
