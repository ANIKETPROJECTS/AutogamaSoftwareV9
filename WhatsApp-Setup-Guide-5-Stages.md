# 🚗 AUTO GAMMA - WhatsApp Setup Guide for 5 Job Stages

## COMPLETE GUIDE: Create WhatsApp Message Templates

This guide will help you set up automated WhatsApp messages for all 5 job stages in your Auto Gamma service management system.

---

## WHAT ARE THE 5 STAGES?

Your system sends automatic WhatsApp messages when a job moves through these stages:

1. **New Lead** → Customer registers a vehicle
2. **Inspection Done** → Inspection is completed
3. **Work In Progress** → Work has started on the vehicle
4. **Completed** → Vehicle service is finished and ready
5. **Cancelled** → Service request was cancelled

---

# PART A: PREPARE WHATSAPP BUSINESS ACCOUNT

## Step A1: Log Into Meta Business Manager
1. Go to https://business.facebook.com
2. Log in with your Facebook account (the one you created earlier)
3. You should see your WhatsApp Business Account in the dashboard

## Step A2: Go to WhatsApp Manager
1. In the left menu, find **"WhatsApp"**
2. Click on your WhatsApp Business Account
3. Click **"WhatsApp Manager"** or **"Message Templates"**

---

# PART B: CREATE TEMPLATE 1 - NEW LEAD

## Step B1: Start Creating New Template
1. Click **"Create Template"** button (top right)
2. You'll see a form to fill

## Step B2: Fill in Template Details

**Template Name:** `service_new_lead`

**Category:** `Utility` (from dropdown)

**Message Content:** Copy-paste exactly:
```
Welcome! Your {{1}} ({{2}}) has been registered. We will contact you shortly.
```

**Parameters:**
- {{1}} = Vehicle Name (e.g., "Maruti Suzuki Alto")
- {{2}} = Number Plate (e.g., "MH02145")

## Step B3: Preview
You should see the message preview in the right panel.

## Step B4: Submit for Approval
- Click **"Submit"** button
- Meta will review (takes 1-5 days)
- Status will show: **"Pending Approval"** or **"Approved"**

---

# PART C: CREATE TEMPLATE 2 - INSPECTION DONE

## Step C1: Create Another Template
1. Click **"Create Template"** again
2. Fill in the form

## Step C2: Fill in Template Details

**Template Name:** `service_inspection_done`

**Category:** `Utility`

**Message Content:**
```
Inspection completed for your {{1}} ({{2}}). Our team will share the report soon.
```

**Parameters:**
- {{1}} = Vehicle Name
- {{2}} = Number Plate

## Step C3: Submit for Approval
- Click **"Submit"**
- Wait for approval

---

# PART D: CREATE TEMPLATE 3 - WORK IN PROGRESS

## Step D1: Create Another Template
1. Click **"Create Template"** again

## Step D2: Fill in Template Details

**Template Name:** `service_work_in_progress`

**Category:** `Utility`

**Message Content:**
```
Work has started on your {{1}} ({{2}}). We will keep you updated.
```

**Parameters:**
- {{1}} = Vehicle Name
- {{2}} = Number Plate

## Step D3: Submit for Approval
- Click **"Submit"**

---

# PART E: CREATE TEMPLATE 4 - COMPLETED

## Step E1: Create Another Template
1. Click **"Create Template"** again

## Step E2: Fill in Template Details

**Template Name:** `service_completed`

**Category:** `Utility`

**Message Content:**
```
Thank you for choosing us! Service completed for your {{1}} ({{2}}). We hope to see you again!
```

**Parameters:**
- {{1}} = Vehicle Name
- {{2}} = Number Plate

## Step E3: Submit for Approval
- Click **"Submit"**

---

# PART F: CREATE TEMPLATE 5 - CANCELLED

## Step F1: Create Another Template
1. Click **"Create Template"** again

## Step F2: Fill in Template Details

**Template Name:** `service_cancelled`

**Category:** `Utility`

**Message Content:**
```
Your service request for {{1}} ({{2}}) has been cancelled. Contact us for any queries.
```

**Parameters:**
- {{1}} = Vehicle Name
- {{2}} = Number Plate

## Step F3: Submit for Approval
- Click **"Submit"**

---

# VERIFICATION CHECKLIST

✅ Make sure you've created all 5 templates:

- [ ] `service_new_lead` - Submitted
- [ ] `service_inspection_done` - Submitted
- [ ] `service_work_in_progress` - Submitted
- [ ] `service_completed` - Submitted
- [ ] `service_cancelled` - Submitted

✅ All templates are in **"Utility"** category

✅ Each template has exactly 2 parameters: {{1}} and {{2}}

---

# HOW THE SYSTEM WORKS

Once templates are approved, here's what happens:

| Job Stage | Auto Message Sent | Who Receives It |
|-----------|-------------------|-----------------|
| **Customer registers vehicle** | "Welcome! Your [Vehicle] ([Plate]) has been registered..." | Customer's WhatsApp |
| **You mark "Inspection Done"** | "Inspection completed for your [Vehicle] ([Plate])..." | Customer's WhatsApp |
| **You mark "Work In Progress"** | "Work has started on your [Vehicle] ([Plate])..." | Customer's WhatsApp |
| **You mark "Completed"** | "Thank you for choosing us! Service completed..." | Customer's WhatsApp |
| **You mark "Cancelled"** | "Your service request for [Vehicle] ([Plate]) has been cancelled..." | Customer's WhatsApp |

---

# TEMPLATE STATUS TRACKING

After you submit all templates:

1. **Pending Approval** (1-5 days)
   - Meta is reviewing your templates
   - You can't use them yet

2. **Approved** ✅
   - Template is ready to use
   - Messages will start sending automatically

3. **Rejected** ❌ (rare)
   - Review the rejection reason
   - Edit template and resubmit

### Check Status:
- Go to **WhatsApp Manager** → **Message Templates**
- Click on each template to see its status
- Status shows at the top of each template card

---

# IMPORTANT NOTES FOR YOUR CLIENT

⚠️ **Before Messages Start Sending:**

1. **Phone Number Must Be Registered**
   - The phone number you added to WhatsApp must be verified
   - You can't use your personal WhatsApp app on this number
   - It's exclusively for business WhatsApp API

2. **All 5 Templates Must Be Approved**
   - Don't change job stages until templates are approved
   - If you change status before approval, messages won't send

3. **Customer Phone Numbers Must Have Country Code**
   - Example: `+91 9876543210` (for India)
   - Without country code (+91), messages won't send

4. **24-Hour Window Rule**
   - After customer's first reply, you have 24 hours to send free messages
   - After 24 hours, you must use an approved template again

5. **Test First**
   - Before going live, test with 1-2 customers
   - Make sure messages arrive correctly
   - Check customer's WhatsApp inbox (messages appear as business messages, not regular chats)

---

# EXAMPLE OF WHAT CUSTOMER SEES

When a job status is updated, customer receives:

### Message 1: New Lead
```
Welcome! Your Maruti Suzuki Alto (MH02145) has been registered. We will contact you shortly.
```

### Message 2: Inspection Done
```
Inspection completed for your Maruti Suzuki Alto (MH02145). Our team will share the report soon.
```

### Message 3: Work In Progress
```
Work has started on your Maruti Suzuki Alto (MH02145). We will keep you updated.
```

### Message 4: Completed
```
Thank you for choosing us! Service completed for your Maruti Suzuki Alto (MH02145). We hope to see you again!
```

### Message 5: Cancelled
```
Your service request for Maruti Suzuki Alto (MH02145) has been cancelled. Contact us for any queries.
```

---

# TIMELINE OVERVIEW

| Step | Timeline | What to Do |
|------|----------|-----------|
| **Day 1** | Now | Create all 5 templates in Meta |
| **Day 1-2** | Wait 24-48 hours | Meta approves templates |
| **Day 3** | When approved | Start using the system |
| **Day 3 onwards** | Every day | Job status changes → Automatic messages |

---

# NEXT STEPS AFTER TEMPLATES ARE APPROVED

Once all templates are approved:

1. **Provide These Credentials to Your Developer:**
   - WHATSAPP_PHONE_NUMBER_ID (you got this earlier)
   - WHATSAPP_ACCESS_TOKEN (you got this earlier)

2. **Developer Will:**
   - Add credentials to your app
   - Connect the real WhatsApp API
   - Messages start sending automatically

3. **You Will:**
   - Use the app normally
   - Change job statuses like before
   - Messages send to customers automatically

---

# TROUBLESHOOTING

| Problem | Solution |
|---------|----------|
| Template says "Rejected" | Read the rejection reason. Common: Template text too similar to another. Edit and resubmit |
| Template still "Pending" after 5 days | Check email for approval notification. Contact Meta support if stuck longer |
| Message not arriving to customer | Check: 1) Template approved 2) Customer phone has country code 3) Phone number verified in WhatsApp |
| Wrong vehicle name/plate in message | The system pulls this automatically from your database. Check job details |

---

# SUPPORT

If you have questions:
1. Check this guide again
2. Contact your developer with the specific template name that's having issues
3. Check Meta's WhatsApp documentation: https://developers.facebook.com/docs/whatsapp

---

**You're all set! Once templates are approved, your WhatsApp automation is live.** 🎉
