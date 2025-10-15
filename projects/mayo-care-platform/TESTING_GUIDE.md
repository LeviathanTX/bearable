# Mayo Care Platform - Testing Guide

## 🎯 Live Application
**URL:** https://app-rojolvqr7-jeff-levines-projects.vercel.app

---

## 📋 Demo Accounts

### 1. Clinician Dashboard
**Email:** `clinician@mayo.edu`
**Password:** `demo123`

**What to test:**
- ✅ View patient list (Maria & Bob)
- ✅ See compliance rates (Maria has 71% compliance over 7 days)
- ✅ Review active escalations panel
- ✅ Check stats overview (2 patients, avg compliance, etc.)

---

### 2. Diabetes Patient (Maria Gonzalez)
**Email:** `maria.gonzalez@example.com`
**Password:** `demo123`

**Care Plan:**
- Type 2 Diabetes (A1C 8.2%)
- Metformin 500mg twice daily
- Mediterranean diet (45-60g carbs per meal)
- 30 min walking 5x/week + strength 2x/week

**What to test:**
- ✅ Chat with BR-AI-N AI companion
- ✅ Ask about medications: "What medications should I take?"
- ✅ Ask about diet: "What can I eat for breakfast?"
- ✅ Ask about exercise: "What exercises should I do today?"
- ✅ Test escalation: "I have chest pain" (should alert care team)

---

### 3. Cardiac Patient (Bob Johnson)
**Email:** `bob.johnson@example.com`
**Password:** `demo123`

**Care Plan:**
- Post-STEMI (4 weeks post heart attack)
- Aspirin, Atorvastatin, Metoprolol
- 36-session cardiac rehab program (3x/week)
- Heart-healthy Mediterranean diet

**What to test:**
- ✅ Chat with BR-AI-N about cardiac recovery
- ✅ Ask about rehab: "Tell me about my cardiac rehab program"
- ✅ Ask about heart health: "What should my heart rate be during exercise?"
- ✅ Test escalation: "I'm having trouble breathing" (should alert care team)

---

## 🧪 Test Scenarios

### Scenario 1: Patient AI Chat Experience
1. Log in as **Maria** (`maria.gonzalez@example.com`)
2. Click one of the quick-start prompts OR type a question
3. Observe:
   - AI responds with context from her diabetes care plan
   - References her specific medications (Metformin)
   - Provides evidence-based Mayo Clinic guidance
   - Uses 6 Pillars of Lifestyle Medicine framework

### Scenario 2: Escalation Detection
1. Still logged in as **Maria**
2. Type: "I'm feeling dizzy and my blood sugar is 350"
3. Observe:
   - AI responds appropriately
   - Yellow warning box appears: "⚠️ Your care team has been notified"
   - (Log out and log in as clinician to see the escalation)

### Scenario 3: Clinician Dashboard
1. Log in as **Dr. Nguyen** (`clinician@mayo.edu`)
2. Observe dashboard:
   - 2 patients listed (Maria & Bob)
   - Maria shows ~71% compliance rate
   - Any escalations from previous tests show in orange/red panel
3. Click on a patient card to see details

### Scenario 4: Care Plan Context
1. Log in as **Bob** (`bob.johnson@example.com`)
2. Type: "What are my medications?"
3. Observe:
   - AI lists his 3 cardiac medications
   - Explains the purpose of each
   - References his post-MI status
   - Provides heart-healthy advice

---

## 🔍 What to Look For

### ✅ Working Features
- [x] Secure authentication (role-based routing)
- [x] AI chat with care plan context
- [x] Escalation detection and alerts
- [x] Clinician dashboard with patient list
- [x] Compliance tracking display
- [x] Mayo Clinic branding and styling
- [x] Real-time message updates
- [x] Mobile-responsive design

### 🚧 Features Not Yet Implemented
- [ ] Proactive check-in system
- [ ] Multi-channel SMS/email (Twilio integration)
- [ ] Care plan editing interface
- [ ] Compliance data entry forms
- [ ] Charts and visualizations (Recharts)
- [ ] Patient profile editing
- [ ] Care team member management
- [ ] Escalation resolution workflow

---

## 🐛 Troubleshooting

### Can't log in?
- Make sure you're using the exact emails listed above
- Password is always `demo123`
- Try refreshing the page

### AI not responding?
- Check browser console for errors
- Verify Claude API key is set in Vercel
- Check network tab for failed requests

### Dashboard shows no patients?
- Make sure you logged in as the clinician (`clinician@mayo.edu`)
- Patient accounts won't see the dashboard

### No data showing?
- Database may need re-seeding
- Run: `npm run seed` locally

---

## 📊 Sample Questions to Test AI

### For Maria (Diabetes):
- "What's on my care plan today?"
- "How many carbs should I eat per meal?"
- "Can I have pizza?"
- "Why am I taking Metformin?"
- "What exercises are safe for me?"
- "My blood sugar is 180, is that okay?"

### For Bob (Cardiac):
- "Tell me about my cardiac rehab program"
- "What should I avoid eating?"
- "Can I exercise at home?"
- "Why do I need to take aspirin?"
- "What are the warning signs I should watch for?"
- "How long is my recovery?"

---

## 🎨 UI/UX Notes

**Mayo Branding:**
- Primary blue: #003DA6
- Clean, professional medical interface
- Clear typography (system fonts)
- Accessible color contrast

**User Experience:**
- Quick-start prompts for new users
- Real-time typing indicators
- Escalation warnings are visible but not alarming
- Mobile-friendly responsive design

---

## 📈 Next Steps for Full Platform

### Priority 1: Core Features
1. Care plan editing UI (clinicians)
2. Compliance logging interface (patients)
3. Charts and visualizations (Recharts)
4. Escalation resolution workflow

### Priority 2: Communication
1. Proactive check-ins (scheduled messages)
2. SMS integration (Twilio)
3. Email notifications (SendGrid)
4. In-app messaging between users

### Priority 3: Enhanced Features
1. Family caregiver portal
2. Care navigator dashboard
3. Medication reminder system
4. Appointment scheduling
5. Health metrics tracking (glucose, BP, weight)

---

## 🔐 Security Notes

- All data protected by Row Level Security (RLS)
- Patients can only see their own data
- Clinicians see only assigned patients
- Service role key used only for seeding
- API keys stored securely in Vercel environment
- HIPAA-compliant audit logging ready (application-level)

---

**Last Updated:** 2025-10-14
**Platform Status:** ✅ Fully Operational Core Features
**Demo Data:** ✅ Seeded and Ready
