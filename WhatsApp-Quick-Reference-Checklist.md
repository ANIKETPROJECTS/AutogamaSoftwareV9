# ✅ AUTO GAMMA - WhatsApp Quick Reference Checklist

## 📋 TEMPLATE CREATION CHECKLIST

Print this page and check off each template as you create it in Meta Business Manager.

---

## TEMPLATE 1: NEW LEAD
- [ ] **Template Name:** `service_new_lead`
- [ ] **Category:** `Utility`
- [ ] **Message:** 
```
Welcome! Your {{1}} ({{2}}) has been registered. We will contact you shortly.
```
- [ ] **Parameter 1:** Vehicle Name ({{1}})
- [ ] **Parameter 2:** Number Plate ({{2}})
- [ ] **Status:** ☐ Pending ☐ Approved ☐ Rejected
- [ ] **Date Submitted:** _____________

---

## TEMPLATE 2: INSPECTION DONE
- [ ] **Template Name:** `service_inspection_done`
- [ ] **Category:** `Utility`
- [ ] **Message:** 
```
Inspection completed for your {{1}} ({{2}}). Our team will share the report soon.
```
- [ ] **Parameter 1:** Vehicle Name ({{1}})
- [ ] **Parameter 2:** Number Plate ({{2}})
- [ ] **Status:** ☐ Pending ☐ Approved ☐ Rejected
- [ ] **Date Submitted:** _____________

---

## TEMPLATE 3: WORK IN PROGRESS
- [ ] **Template Name:** `service_work_in_progress`
- [ ] **Category:** `Utility`
- [ ] **Message:** 
```
Work has started on your {{1}} ({{2}}). We will keep you updated.
```
- [ ] **Parameter 1:** Vehicle Name ({{1}})
- [ ] **Parameter 2:** Number Plate ({{2}})
- [ ] **Status:** ☐ Pending ☐ Approved ☐ Rejected
- [ ] **Date Submitted:** _____________

---

## TEMPLATE 4: COMPLETED
- [ ] **Template Name:** `service_completed`
- [ ] **Category:** `Utility`
- [ ] **Message:** 
```
Thank you for choosing us! Service completed for your {{1}} ({{2}}). We hope to see you again!
```
- [ ] **Parameter 1:** Vehicle Name ({{1}})
- [ ] **Parameter 2:** Number Plate ({{2}})
- [ ] **Status:** ☐ Pending ☐ Approved ☐ Rejected
- [ ] **Date Submitted:** _____________

---

## TEMPLATE 5: CANCELLED
- [ ] **Template Name:** `service_cancelled`
- [ ] **Category:** `Utility`
- [ ] **Message:** 
```
Your service request for {{1}} ({{2}}) has been cancelled. Contact us for any queries.
```
- [ ] **Parameter 1:** Vehicle Name ({{1}})
- [ ] **Parameter 2:** Number Plate ({{2}})
- [ ] **Status:** ☐ Pending ☐ Approved ☐ Rejected
- [ ] **Date Submitted:** _____________

---

## 🔑 CREDENTIALS TO PROVIDE TO DEVELOPER

Once everything is ready, collect these 3 items:

| Item | Value | Where to Find |
|------|-------|---------------|
| **WHATSAPP_PHONE_NUMBER_ID** | _________________ | WhatsApp Manager → API Setup |
| **WHATSAPP_ACCESS_TOKEN** | _________________ | Meta Business Manager → System Users |
| **WHATSAPP_BUSINESS_ACCOUNT_ID** | _________________ | WhatsApp Manager → Settings |

---

## 📅 APPROVAL TIMELINE

**Day 1:** Create all 5 templates
**Day 2-5:** Wait for Meta approval (typically 24-48 hours)
**Day 3+:** Once approved, messages start sending automatically

---

## ⚠️ CRITICAL REQUIREMENTS

Before templates work, verify:

- [ ] Phone number is registered in WhatsApp
- [ ] Phone number is verified (via SMS/Call)
- [ ] You're NOT using this phone on regular WhatsApp app
- [ ] All templates are in "Utility" category
- [ ] Each template has exactly 2 parameters ({{1}} and {{2}})
- [ ] Template names match exactly (lowercase, underscores)

---

## 🧪 TEST BEFORE GOING LIVE

Once approved, test with a real customer:

- [ ] Create a job in the system
- [ ] Mark it as "Inspection Done"
- [ ] Check if customer received WhatsApp message
- [ ] Verify message has correct vehicle name and plate number

---

## 📞 MESSAGE EXAMPLES (What Customers Will See)

### When Job Created (New Lead)
```
Welcome! Your Maruti Suzuki Alto (MH02145) has been registered. 
We will contact you shortly.
```

### When Inspection Done
```
Inspection completed for your Maruti Suzuki Alto (MH02145). 
Our team will share the report soon.
```

### When Work In Progress
```
Work has started on your Maruti Suzuki Alto (MH02145). 
We will keep you updated.
```

### When Service Completed
```
Thank you for choosing us! Service completed for your 
Maruti Suzuki Alto (MH02145). We hope to see you again!
```

### When Job Cancelled
```
Your service request for Maruti Suzuki Alto (MH02145) 
has been cancelled. Contact us for any queries.
```

---

## 🚀 GO-LIVE CHECKLIST

- [ ] All 5 templates created
- [ ] All 5 templates approved by Meta
- [ ] Credentials collected and verified
- [ ] Phone number registered and active
- [ ] Test message received successfully
- [ ] Credentials provided to developer
- [ ] Developer confirms API is live
- [ ] Live testing with real customer completed

---

## 📱 HOW IT WORKS IN THE APP

```
Customer registers vehicle
        ↓
System creates job
        ↓
Automatic message sent: "Welcome! Your vehicle has been registered..."
        ↓
You mark as "Inspection Done"
        ↓
Automatic message sent: "Inspection completed..."
        ↓
You mark as "Work In Progress"
        ↓
Automatic message sent: "Work has started..."
        ↓
You mark as "Completed"
        ↓
Automatic message sent: "Thank you for choosing us..."
        ↓
OR You mark as "Cancelled"
        ↓
Automatic message sent: "Your service request has been cancelled..."
```

---

## ❓ FAQ

**Q: Can I change the message text?**
A: Yes, after initial approval, you can update templates in WhatsApp Manager. Changes take 24-48 hours to approve.

**Q: What if customer doesn't receive message?**
A: Check: 1) Template is approved 2) Phone has country code (+91) 3) Network connection

**Q: Can I use my personal WhatsApp on this number?**
A: No, this number is exclusively for Business API. Using both will cause conflicts.

**Q: How many customers can I send to?**
A: After initial 5-number limit, you can request unlimited. Contact Meta support.

**Q: Can I customize messages per customer?**
A: Not in templates, but only vehicle name and plate number are dynamic. Other text is fixed.

---

**Print this checklist and use it as your tracking document!**
