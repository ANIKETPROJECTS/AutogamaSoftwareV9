# ✅ AUTO GAMMA - WhatsApp API Setup Checklist

## Complete Checklist for Getting WhatsApp Credentials

Print this page and check off each step as you complete it.

---

## PART 1: META BUSINESS MANAGER ACCOUNT

- [ ] **Step 1.1:** Go to https://business.facebook.com
- [ ] **Step 1.2:** Log in with Facebook account
- [ ] **Step 1.3:** Create business account with:
  - [ ] Business Name: ___________________
  - [ ] Your Name: ___________________
  - [ ] Business Email: ___________________
  - [ ] Country: ___________________
- [ ] **Step 1.4:** Verify email if needed
- [ ] **Status:** Business account created and verified

---

## PART 2: META DEVELOPER APP

- [ ] **Step 2.1:** Go to https://developers.facebook.com
- [ ] **Step 2.2:** Click "My Apps" → "Create App"
- [ ] **Step 2.3:** Select app type: **"Business"**
- [ ] **Step 2.4:** Fill app details:
  - [ ] App Name: ___________________
  - [ ] Contact Email: ___________________
  - [ ] Select your Business Account
- [ ] **Step 2.5:** Save your App ID: ___________________
- [ ] **Step 2.5:** Save your App Secret: ___________________ (KEEP SAFE!)
- [ ] **Status:** Developer app created

---

## PART 3: ADD WHATSAPP & GET PHONE NUMBER ID

- [ ] **Step 3.1:** Add WhatsApp product to app
- [ ] **Step 3.2:** Complete WhatsApp Setup Wizard:
  - [ ] Select your business account
  - [ ] Enter phone number: ___________________
  - [ ] Choose verification method: ☐ SMS ☐ Call
- [ ] **Step 3.3:** Verify phone number with code
- [ ] **Step 3.3:** Copy and save Phone Number ID

### 🔴 CREDENTIAL #1: PHONE NUMBER ID

**Key:** `WHATSAPP_PHONE_NUMBER_ID`

**Value:** ___________________

**Format:** (All numbers, like: 120212121212121)

---

## PART 4: CREATE SYSTEM USER & GET ACCESS TOKEN

### Subsection 4.1-4.3: Create System User

- [ ] **Step 4.1:** Go to business.facebook.com → Settings
- [ ] **Step 4.1:** Click Users → System Users
- [ ] **Step 4.2:** Click "Add" to create new system user
- [ ] **Step 4.2:** Fill in:
  - [ ] Name: "WhatsApp Bot" (or similar)
  - [ ] Role: **"Admin"**
- [ ] **Step 4.3:** Assign your WhatsApp app to system user
- [ ] **Step 4.4:** Assign permissions:
  - [ ] ✅ whatsapp_business_management
  - [ ] ✅ whatsapp_business_messaging
  - [ ] ✅ whatsapp_business_manage_events

### Subsection 4.5: Generate Token

- [ ] **Step 4.5:** Click "Generate New Token" button
- [ ] **Step 4.5:** In popup:
  - [ ] Select app: Your WhatsApp app
  - [ ] Token Expiration: **"Never"**
  - [ ] Permissions: Already checked (3 above)
- [ ] **Step 4.5:** Click "Generate Token"
- [ ] **Step 4.5:** Copy token immediately

### 🔴 CREDENTIAL #2: ACCESS TOKEN

**Key:** `WHATSAPP_ACCESS_TOKEN`

**Value:** ___________________

**Format:** (Long string starting with EAAD, like: EAAD7VzH5Jo...)

**⚠️ IMPORTANT:** This token won't show again! Copy it NOW!

---

## PART 5: REGISTER PHONE NUMBER (OPTIONAL)

- [ ] **Step 5.1:** Open Terminal/Command Prompt
- [ ] **Step 5.2:** Run the registration command:

Replace in this command:
- `YOUR_PHONE_NUMBER_ID` = Your Phone Number ID from above
- `YOUR_ACCESS_TOKEN` = Your Access Token from above

```bash
curl -X POST \
  'https://graph.facebook.com/v21.0/YOUR_PHONE_NUMBER_ID/register' \
  -H 'Authorization: Bearer YOUR_ACCESS_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "messaging_product": "whatsapp",
    "pin": "123456"
  }'
```

- [ ] **Step 5.2:** Press Enter and wait for response
- [ ] **Step 5.2:** Should see: `{"success":true}`
- [ ] **Status:** Phone number registered (if successful)

---

## PART 6: VERIFY BOTH CREDENTIALS

### Credential 1 Verification
- [ ] **Phone Number ID:**
  - [ ] Length: ~12-15 digits (all numbers)
  - [ ] Format: `120212121212121` ✓
  - [ ] Saved in safe place: YES ☐

### Credential 2 Verification
- [ ] **Access Token:**
  - [ ] Starts with: EAAD...
  - [ ] Very long string (200+ characters)
  - [ ] Format: `EAAD7VzH5Jo...` ✓
  - [ ] Saved in safe place: YES ☐

---

## PART 7: TEST CREDENTIALS (OPTIONAL)

To verify your credentials work:

Replace values and run:
```bash
curl -X GET \
  'https://graph.facebook.com/v21.0/YOUR_PHONE_NUMBER_ID?access_token=YOUR_ACCESS_TOKEN'
```

- [ ] **Step 7:** Run test command
- [ ] **Step 7:** Check response (should show phone number info)
- [ ] **Status:** ☐ Success ☐ Failed (but OK to proceed)

---

## FINAL SUMMARY

### ✅ You Now Have 2 Credentials

| # | Credential Name | Your Value | Saved? |
|---|-----------------|-----------|--------|
| 1 | WHATSAPP_PHONE_NUMBER_ID | _______________ | ☐ |
| 2 | WHATSAPP_ACCESS_TOKEN | _______________ | ☐ |

---

## 📋 BEFORE PROVIDING TO DEVELOPER

- [ ] Both credentials copied and verified
- [ ] Credentials stored in secure location
- [ ] Phone number is registered and verified
- [ ] NOT using this phone on personal WhatsApp app
- [ ] Credentials are ready to share

---

## ⚠️ IMPORTANT REMINDERS

| Item | Requirement |
|------|-------------|
| **Phone Number** | Cannot be used on personal WhatsApp app |
| **Access Token** | Keep PRIVATE - never share publicly |
| **Storage** | Save credentials in password manager or safe location |
| **Sharing** | Only give to your trusted developer |
| **Expiration** | Access token is permanent (set to "Never") |

---

## 🚀 NEXT STEPS

Once you have both credentials:

1. **Provide to Developer:** Share both credential values
2. **Developer Action:** They add to app as "Secrets"
3. **Wait for Confirmation:** Developer confirms setup is complete
4. **Test:** Send test message through app
5. **Go Live:** Messages start sending automatically!

---

## 🆘 IF YOU GET STUCK

| Error/Issue | What to Do |
|------------|-----------|
| Can't log in | Use Facebook account you created. Forgot password? Reset at facebook.com |
| Phone verification fails | Check number format: +91 9876543210 (country code required) |
| Can't find System Users | Go to business.facebook.com → Settings (bottom left) → Users → System Users |
| Token shows invalid | Make sure you copied the FULL token (very long string) |
| Registration command fails | This is optional - skip it. API works without it. |
| Don't know what value to use | Contact your developer - they can help identify each field |

---

## 📞 SUPPORT CONTACTS

- **Meta WhatsApp Documentation:** https://developers.facebook.com/docs/whatsapp
- **Meta Business Help:** https://business.facebook.com/help
- **Your Developer:** Send them the error message you received

---

**Print this checklist and use it to track your progress!**

**Once complete, you have everything needed for WhatsApp to work in your app!** ✅
