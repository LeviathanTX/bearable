# Consent Management UI/UX Wireframes and User Journeys

## Table of Contents

1. [Onboarding Journey](#onboarding-journey)
2. [Privacy Dashboard](#privacy-dashboard)
3. [Just-in-Time Consent](#just-in-time-consent)
4. [Caregiver Management](#caregiver-management)
5. [Access Log Viewer](#access-log-viewer)
6. [Data Export Flow](#data-export-flow)
7. [Consent Revocation](#consent-revocation)
8. [Mobile Experience](#mobile-experience)

---

## Onboarding Journey

### Step 1: Welcome Screen

```
┌────────────────────────────────────────────────────────┐
│                                                         │
│                      🔒                                 │
│                                                         │
│             Your Privacy Matters                        │
│                                                         │
│  Welcome, Jane! Let's set up your privacy preferences. │
│                                                         │
│  ┌────────────────────────────────────────────────┐   │
│  │ What you'll control:                            │   │
│  │                                                  │   │
│  │ ✓ Which AI specialists can access your data    │   │
│  │ ✓ What caregivers and providers can see        │   │
│  │ ✓ How your data is used for personalization    │   │
│  │ ✓ Third-party app integrations                 │   │
│  └────────────────────────────────────────────────┘   │
│                                                         │
│  ┌────────────────────────────────────────────────┐   │
│  │ 🏥 HIPAA Compliant                              │   │
│  │                                                  │   │
│  │ Your health data is protected under federal law.│   │
│  │ You can change these settings anytime, and we'll│   │
│  │ always ask before sharing your information.     │   │
│  └────────────────────────────────────────────────┘   │
│                                                         │
│              [Get Started]                              │
│                                                         │
│              Skip for now                               │
│                                                         │
└────────────────────────────────────────────────────────┘

[====●─────] Step 1 of 6
```

**Design Notes:**
- Large, friendly lock icon
- Welcoming, reassuring tone
- Bullet points for scannability
- HIPAA badge for trust
- Option to skip (but encourage completion)

---

### Step 2: Essential AI Consent

```
┌────────────────────────────────────────────────────────┐
│                                                         │
│           Essential AI Services                         │
│                                                         │
│  Your personal Bearable AI companion needs access to   │
│  basic health information to help you.                 │
│                                                         │
│  ┌────────────────────────────────────────────────┐   │
│  │  🐻 Wellness Bear                               │   │
│  │  Your personal AI health companion              │   │
│  │                                          [ON ●] │   │
│  │                                                  │   │
│  │  Data access permissions:                       │   │
│  │                                                  │   │
│  │  ☑ Basic Profile                                │   │
│  │    Age, gender, location                        │   │
│  │                                                  │   │
│  │  ☑ Health Metrics                               │   │
│  │    Weight, blood pressure, vitals               │   │
│  │                                                  │   │
│  │  ☑ Activity Logs                                │   │
│  │    Exercise, sleep, nutrition tracking          │   │
│  │                                                  │   │
│  │  ☐ Medical History                              │   │
│  │    Conditions, diagnoses                        │   │
│  │                                                  │   │
│  │  ☐ Medications                                  │   │
│  │    Current and past medications                 │   │
│  └────────────────────────────────────────────────┘   │
│                                                         │
│  ⚠️  Disabling your personal AI will limit the app's   │
│     ability to provide personalized health insights.   │
│                                                         │
│              [Back]      [Continue]                     │
│                                                         │
└────────────────────────────────────────────────────────┘

[====●====─] Step 2 of 6
```

**Interaction Flow:**
1. Default: Toggle ON, Basic Profile + Health Metrics + Activity Logs checked
2. User can toggle OFF (with warning)
3. User can uncheck individual categories
4. Hover over each category shows tooltip with examples

---

### Step 3: AI Personalization

```
┌────────────────────────────────────────────────────────┐
│                                                         │
│           AI Personalization                            │
│                                                         │
│  Help your AI companion learn and adapt to your unique │
│  health journey.                                        │
│                                                         │
│  ┌────────────────────────────────────────────────┐   │
│  │ ☑ Personalized Recommendations   [Recommended] │   │
│  │   Tailor suggestions based on your health goals,│   │
│  │   preferences, and progress                     │   │
│  └────────────────────────────────────────────────┘   │
│                                                         │
│  ┌────────────────────────────────────────────────┐   │
│  │ ☑ Predictive Health Insights      [Recommended]│   │
│  │   Identify patterns and predict potential health│   │
│  │   risks before they become serious              │   │
│  └────────────────────────────────────────────────┘   │
│                                                         │
│  ┌────────────────────────────────────────────────┐   │
│  │ ☑ Proactive Nudges                [Recommended]│   │
│  │   Receive timely reminders and encouragement    │   │
│  │   based on your routine                         │   │
│  └────────────────────────────────────────────────┘   │
│                                                         │
│  ┌────────────────────────────────────────────────┐   │
│  │ ☐ Behavioral Analysis                           │   │
│  │   Analyze habits and behaviors to improve       │   │
│  │   adherence and outcomes                        │   │
│  └────────────────────────────────────────────────┘   │
│                                                         │
│  ┌────────────────────────────────────────────────┐   │
│  │ ☐ Improve AI Models (Anonymous)                │   │
│  │   Help improve Bearable for everyone by         │   │
│  │   contributing anonymized data                  │   │
│  └────────────────────────────────────────────────┘   │
│                                                         │
│  💡 Right to Explanation: You can always ask why the   │
│     AI made a specific recommendation.                 │
│                                                         │
│              [Back]      [Continue]                     │
│                                                         │
└────────────────────────────────────────────────────────┘

[====●====●] Step 3 of 6
```

**Design Notes:**
- Each option is a card with checkbox
- "Recommended" badge on suggested options
- Clear benefit statement for each
- Educational callout at bottom
- Defaults selected based on best practices

---

### Step 4: Caregiver Sharing

```
┌────────────────────────────────────────────────────────┐
│                                                         │
│         Caregiver & Family Access                       │
│                                                         │
│  Share your health journey with loved ones and         │
│  healthcare providers.                                 │
│                                                         │
│  Enable Caregiver Sharing                              │
│  [OFF ○]                                                │
│  You can invite caregivers later                       │
│                                                         │
│  ┌────────────────────────────────────────────────┐   │
│  │ When enabled, you can invite:                   │   │
│  │                                                  │   │
│  │ 👨‍👩‍👧‍👦 Family Members                               │   │
│  │    Share progress and receive support           │   │
│  │                                                  │   │
│  │ 🩺 Healthcare Providers                          │   │
│  │    Give your doctor access to your data         │   │
│  │                                                  │   │
│  │ 💪 Coaches & Trainers                            │   │
│  │    Work together on your fitness goals          │   │
│  └────────────────────────────────────────────────┘   │
│                                                         │
│  💡 Granular Control: You can set different            │
│     permissions for each caregiver (family, friends,   │
│     healthcare providers) when you invite them.        │
│                                                         │
│              [Back]      [Continue]                     │
│                                                         │
└────────────────────────────────────────────────────────┘

[====●====●●] Step 4 of 6

───────────────────────────────────────────────────────────
When toggled ON:
───────────────────────────────────────────────────────────

┌────────────────────────────────────────────────────────┐
│                                                         │
│         Caregiver & Family Access                       │
│                                                         │
│  Enable Caregiver Sharing [ON ●]                        │
│                                                         │
│  Default sharing level:                                 │
│                                                         │
│  ┌────────────────────────────────────────────────┐   │
│  │ ☑ Activity & Progress                           │   │
│  │   Exercise, sleep, daily activities             │   │
│  └────────────────────────────────────────────────┘   │
│                                                         │
│  ┌────────────────────────────────────────────────┐   │
│  │ ☑ AI Recommendations                            │   │
│  │   Health tips and suggestions                   │   │
│  └────────────────────────────────────────────────┘   │
│                                                         │
│  ┌────────────────────────────────────────────────┐   │
│  │ ☐ Health Metrics                                │   │
│  │   Weight, vitals, measurements                  │   │
│  └────────────────────────────────────────────────┘   │
│                                                         │
│  ┌────────────────────────────────────────────────┐   │
│  │ ☐ Medications                                   │   │
│  │   Medication schedule and adherence             │   │
│  └────────────────────────────────────────────────┘   │
│                                                         │
│  ┌────────────────────────────────────────────────┐   │
│  │ ☐ Medical History                               │   │
│  │   Conditions and diagnoses                      │   │
│  └────────────────────────────────────────────────┘   │
│                                                         │
│              [Back]      [Continue]                     │
│                                                         │
└────────────────────────────────────────────────────────┘
```

**Interaction:**
- Toggle OFF by default (optional feature)
- When toggled ON, show default sharing categories
- Can skip this step and add caregivers later

---

### Step 5: Third-Party Integrations

```
┌────────────────────────────────────────────────────────┐
│                                                         │
│         Third-Party Integrations                        │
│                                                         │
│  Connect wearables and health apps to enrich your      │
│  health data.                                          │
│                                                         │
│  Enable Integrations [OFF ○]                            │
│  You can connect apps and devices later                │
│                                                         │
│  ┌────────────────────────────────────────────────┐   │
│  │ Available Integrations:                         │   │
│  │                                                  │   │
│  │ 🏃 Activity Trackers                             │   │
│  │    Apple Watch, Fitbit, Garmin, WHOOP, Oura    │   │
│  │                                                  │   │
│  │ 💊 Medication Trackers                           │   │
│  │    MedMinder, PillPack                          │   │
│  │                                                  │   │
│  │ 🏥 Health Records                                │   │
│  │    HealthBank One, Apple Health, Google Fit     │   │
│  │                                                  │   │
│  │ 🧘 Wellness Apps                                 │   │
│  │    Calm, Headspace, MyFitnessPal                │   │
│  └────────────────────────────────────────────────┘   │
│                                                         │
│  ⚠️  Privacy Note: Third-party apps have their own     │
│     privacy policies. Review them carefully before     │
│     connecting.                                        │
│                                                         │
│              [Back]      [Continue]                     │
│                                                         │
└────────────────────────────────────────────────────────┘

[====●====●●●] Step 5 of 6
```

---

### Step 6: Review & Complete

```
┌────────────────────────────────────────────────────────┐
│                                                         │
│         Review Your Choices                             │
│                                                         │
│  You can always change these settings in your Privacy  │
│  Dashboard.                                            │
│                                                         │
│  ┌────────────────────────────────────────────────┐   │
│  │ ✓ Personal AI Companion             [Enabled]  │   │
│  │   Access to: health_metrics, activity_logs      │   │
│  │                                                  │   │
│  │   AI Personalization:                           │   │
│  │   • Personalized recommendations                │   │
│  │   • Predictive health insights                  │   │
│  │   • Proactive nudges                            │   │
│  └────────────────────────────────────────────────┘   │
│                                                         │
│  ┌────────────────────────────────────────────────┐   │
│  │ Caregiver Sharing                   [Disabled] │   │
│  │   You can invite caregivers anytime from        │   │
│  │   Settings > Privacy > Caregivers               │   │
│  └────────────────────────────────────────────────┘   │
│                                                         │
│  ┌────────────────────────────────────────────────┐   │
│  │ Third-Party Integrations            [Disabled] │   │
│  │   Connect apps from Settings > Integrations     │   │
│  └────────────────────────────────────────────────┘   │
│                                                         │
│  ┌────────────────────────────────────────────────┐   │
│  │ Your Rights:                                    │   │
│  │ ✓ View all data we have about you              │   │
│  │ ✓ Export your data anytime                     │   │
│  │ ✓ Revoke any consent instantly                 │   │
│  │ ✓ Request deletion of your data                │   │
│  │ ✓ See who accessed your information            │   │
│  └────────────────────────────────────────────────┘   │
│                                                         │
│              [Back]   [Complete Setup]                  │
│                                                         │
└────────────────────────────────────────────────────────┘

[====●====●●●●] Step 6 of 6
```

**Post-Completion:**
- Redirect to main dashboard
- Show celebratory message
- Highlight Privacy Dashboard in navigation

---

## Privacy Dashboard

### Overview Tab

```
┌──────────────────────────────────────────────────────────────┐
│  Privacy Dashboard                                      [?]  │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐           │
│  │Overview │ │Consents │ │ Logs    │ │Exports  │           │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘           │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌──────────┐│
│  │    3      │  │     2     │  │    47     │  │    1     ││
│  │  Active   │  │   Data    │  │ Accesses  │  │  Alert   ││
│  │ Consents  │  │ Accessors │  │   (30d)   │  │          ││
│  └───────────┘  └───────────┘  └───────────┘  └──────────┘│
│                                                               │
│  🔔 Action Required                                          │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ Your Mayo Clinic physician requested access to your     ││
│  │ health metrics for care plan validation.                ││
│  │                                                          ││
│  │                          [Review Request]  [Deny]       ││
│  └─────────────────────────────────────────────────────────┘│
│                                                               │
│  Active Data Shares                                          │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ 🤖 Wellness Bear (Personal AI)                          ││
│  │                                                          ││
│  │ Access: health_metrics, activity_logs                   ││
│  │ Level: Detailed • Granted: Sep 28, 2025                ││
│  │                                                          ││
│  │ [Edit Permissions]                  [Revoke Access]     ││
│  └─────────────────────────────────────────────────────────┘│
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ 👤 Mom (Caregiver - Family)                             ││
│  │                                                          ││
│  │ Access: activity_logs, ai_recommendations               ││
│  │ Level: Summary • Granted: Sep 21, 2025                 ││
│  │ Last active: 2 hours ago                                ││
│  │                                                          ││
│  │ [Edit Permissions]                  [Revoke Access]     ││
│  └─────────────────────────────────────────────────────────┘│
│                                                               │
│  Quick Actions                                               │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐        │
│  │ 📥 Export    │ │ 📊 View      │ │ ⚙️ Manage    │        │
│  │    My Data   │ │    Logs      │ │   Consents   │        │
│  └──────────────┘ └──────────────┘ └──────────────┘        │
│  ┌──────────────┐                                            │
│  │ 🗑️ Delete    │                                            │
│  │    My Data   │                                            │
│  └──────────────┘                                            │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

**Interactive Elements:**
- Cards are clickable to expand details
- Hover over data categories shows tooltip
- "Last active" shows when caregiver last accessed data
- Color coding: Green (active), Yellow (expiring soon), Red (action required)

---

## Just-in-Time Consent

### Scenario: AI Wants to Access New Data Category

```
┌────────────────────────────────────────────────────────┐
│                                                         │
│           Permission Needed                             │
│                                                         │
│  🤖 Wellness Bear would like to access your             │
│     Medical History to provide more personalized       │
│     recommendations.                                    │
│                                                         │
│  Purpose: Generate comprehensive care plan based on    │
│           your health conditions                       │
│                                                         │
│  ┌────────────────────────────────────────────────┐   │
│  │ What we'll access:                              │   │
│  │ • Past diagnoses and conditions                 │   │
│  │ • Treatment history                             │   │
│  │ • Test results                                  │   │
│  └────────────────────────────────────────────────┘   │
│                                                         │
│  Access Level:                                          │
│  ○ Summary (conditions only)                            │
│  ● Detailed (includes dates and specifics)              │
│  ○ Full (complete medical records)                      │
│                                                         │
│  Grant access for:                                      │
│  ○ Just this time                                       │
│  ● Until I revoke     [Recommended]                     │
│  ○ 30 days                                              │
│                                                         │
│  ☑ Remember my choice and don't ask again               │
│                                                         │
│  💡 You can change or revoke this permission anytime   │
│     in Privacy Dashboard > Consents                    │
│                                                         │
│              [Deny]         [Allow]                     │
│                                                         │
└────────────────────────────────────────────────────────┘
```

**Behavior:**
- Blocks the AI operation until user responds
- Shows clear purpose
- Defaults to recommended settings
- Option to make it permanent
- Can deny without penalty

---

## Caregiver Management

### Invite Caregiver Flow

```
Step 1: Choose Tier
┌────────────────────────────────────────────────────────┐
│                                                         │
│           Invite Caregiver                              │
│                                                         │
│  Name:  [_________________]                             │
│  Email: [_________________]                             │
│                                                         │
│  Relationship:                                          │
│  [Family ▼]                                             │
│    • Family                                             │
│    • Friend                                             │
│    • Healthcare Provider                                │
│    • Coach/Trainer                                      │
│    • Other                                              │
│                                                         │
│  Access Tier:                                           │
│                                                         │
│  ○ View-Only                                            │
│    See progress summaries and milestones               │
│                                                         │
│  ● Interactive [Recommended for Family]                 │
│    Send messages, receive updates, view progress       │
│                                                         │
│  ○ Collaborative                                        │
│    Help manage goals, set reminders, modify plans      │
│                                                         │
│  ○ Emergency Full                                       │
│    Complete access during medical emergencies          │
│                                                         │
│              [Back]      [Customize ➜]                  │
│                                                         │
└────────────────────────────────────────────────────────┘

Step 2: Customize Permissions
┌────────────────────────────────────────────────────────┐
│                                                         │
│           Customize Access for Mom                      │
│                                                         │
│  Tier: Interactive                                      │
│                                                         │
│  What can they see?                                     │
│  ┌────────────────────────────────────────────────┐   │
│  │ ☑ Daily activity & progress                     │   │
│  │ ☑ Health goals and milestones                   │   │
│  │ ☑ AI recommendations                            │   │
│  │ ☐ Health metrics (weight, BP, etc.)            │   │
│  │ ☐ Medications and adherence                     │   │
│  │ ☐ Conversation history with AI                  │   │
│  │ ☐ Medical history and diagnoses                 │   │
│  └────────────────────────────────────────────────┘   │
│                                                         │
│  What can they do?                                      │
│  ┌────────────────────────────────────────────────┐   │
│  │ ☑ Send encouragement messages                   │   │
│  │ ☑ Receive milestone notifications               │   │
│  │ ☐ Set reminders for me                          │   │
│  │ ☐ Modify my health goals                        │   │
│  └────────────────────────────────────────────────┘   │
│                                                         │
│  Emergency Settings                                     │
│  ┌────────────────────────────────────────────────┐   │
│  │ ☑ Make emergency contact                        │   │
│  │   Full access for [60▼] minutes during         │   │
│  │   medical emergencies                           │   │
│  └────────────────────────────────────────────────┘   │
│                                                         │
│  Notifications                                          │
│  ┌────────────────────────────────────────────────┐   │
│  │ Send to Mom:                                    │   │
│  │ ☑ Milestones achieved                           │   │
│  │ ☐ Daily summary                                 │   │
│  │ ☑ Weekly summary                                │   │
│  │ ☑ Concerning trends                             │   │
│  └────────────────────────────────────────────────┘   │
│                                                         │
│  Access expires: [Never ▼]                              │
│                                                         │
│              [Back]   [Send Invitation]                 │
│                                                         │
└────────────────────────────────────────────────────────┘

Step 3: Invitation Sent
┌────────────────────────────────────────────────────────┐
│                                                         │
│           ✓ Invitation Sent                             │
│                                                         │
│  We've sent an invitation to mom@family.com            │
│                                                         │
│  They'll need to:                                       │
│  1. Create a Bearable account (or sign in)             │
│  2. Review and accept the permissions                  │
│  3. Start receiving updates                            │
│                                                         │
│  You'll be notified when they accept.                  │
│                                                         │
│  ┌────────────────────────────────────────────────┐   │
│  │ Pending: Mom (mom@family.com)                   │   │
│  │ Invited: Oct 5, 2025                            │   │
│  │                                                  │   │
│  │ [Resend Invitation]    [Cancel Invitation]      │   │
│  └────────────────────────────────────────────────┘   │
│                                                         │
│              [Invite Another]    [Done]                 │
│                                                         │
└────────────────────────────────────────────────────────┘
```

**Caregiver's View (After Accepting):**

```
┌────────────────────────────────────────────────────────┐
│                                                         │
│           Jane's Health Dashboard                       │
│                                                         │
│  You're viewing Jane's health information as a          │
│  caregiver (Interactive access).                       │
│                                                         │
│  Last 7 Days Summary                                    │
│  ┌────────────────────────────────────────────────┐   │
│  │ Overall Progress:  ████████░░ 80%               │   │
│  │                                                  │   │
│  │ ✓ Exercise: On track (5/7 days)                 │   │
│  │ ✓ Sleep: Improving (avg 7.2 hrs)                │   │
│  │ ⚠ Nutrition: Needs attention                    │   │
│  └────────────────────────────────────────────────┘   │
│                                                         │
│  Recent Milestones                                      │
│  ┌────────────────────────────────────────────────┐   │
│  │ 🏆 7-day walking streak!                        │   │
│  │    Oct 3, 2025                                  │   │
│  │    [Send Encouragement]                         │   │
│  └────────────────────────────────────────────────┘   │
│                                                         │
│  AI Recommendations                                     │
│  ┌────────────────────────────────────────────────┐   │
│  │ 💡 "Try adding 10 minutes of stretching to     │   │
│  │     your morning routine"                       │   │
│  │    - Wellness Bear, Oct 5                       │   │
│  └────────────────────────────────────────────────┘   │
│                                                         │
│  Send Message to Jane                                   │
│  ┌────────────────────────────────────────────────┐   │
│  │ [____________________________________]          │   │
│  │                              [Send]             │   │
│  └────────────────────────────────────────────────┘   │
│                                                         │
│  🔒 Your access is limited to the permissions Jane     │
│     granted. Full details in [Privacy Settings]        │
│                                                         │
└────────────────────────────────────────────────────────┘
```

---

## Access Log Viewer

```
┌──────────────────────────────────────────────────────────────┐
│  Privacy Dashboard > Access Logs                             │
├──────────────────────────────────────────────────────────────┤
│  HIPAA-compliant audit trail of all data access              │
│                                                               │
│  Filters:                                                     │
│  Time: [Last 7 days ▼]  Category: [All ▼]  Status: [All ▼]  │
│                                                  [Download CSV]│
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ Time               Accessor        Category      Status  ││
│  ├─────────────────────────────────────────────────────────┤│
│  │ Oct 5, 2:30 PM     Wellness Bear   Health        ✓      ││
│  │ AI Agent           health_metrics   Metrics              ││
│  │ Purpose: Generate daily health summary                  ││
│  │ Access Level: Detailed • 2.1 KB accessed                ││
│  │                                          [View Details]  ││
│  ├─────────────────────────────────────────────────────────┤│
│  │ Oct 5, 11:15 AM    Mom              Activity     ✓      ││
│  │ Caregiver          activity_logs    Logs                ││
│  │ Purpose: View daily progress                            ││
│  │ Access Level: Summary • 1.4 KB accessed                 ││
│  │                                          [View Details]  ││
│  ├─────────────────────────────────────────────────────────┤│
│  │ Oct 5, 9:45 AM     Unknown          Medical      ✗      ││
│  │ System             medical_history  History             ││
│  │ Denied: No active consent                               ││
│  │ Attempted IP: 192.168.1.1                               ││
│  │                                          [View Details]  ││
│  ├─────────────────────────────────────────────────────────┤│
│  │ Oct 4, 6:00 PM     Dr. Johnson      Health       ✓      ││
│  │ Clinician          health_metrics   Metrics             ││
│  │ Purpose: Care plan review                               ││
│  │ Access Level: Full • 15.2 KB accessed                   ││
│  │                                          [View Details]  ││
│  └─────────────────────────────────────────────────────────┘│
│                                                               │
│  [« Prev]  Page 1 of 3  [Next »]                             │
│                                                               │
│  💡 Your access logs are retained for 6 years as required   │
│     by HIPAA. You can request a full audit report anytime.  │
│                                                               │
└──────────────────────────────────────────────────────────────┘

───────────────────────────────────────────────────────────────
Expanded Detail View:
───────────────────────────────────────────────────────────────

┌────────────────────────────────────────────────────────┐
│  Access Log Detail                                      │
├────────────────────────────────────────────────────────┤
│                                                         │
│  Timestamp: October 5, 2025 at 2:30:15 PM EDT          │
│                                                         │
│  Accessor Information                                   │
│  Name: Wellness Bear (Personal AI)                     │
│  ID: ai-wellness-bear-001                              │
│  Type: AI Agent                                        │
│                                                         │
│  Access Details                                         │
│  Category: Health Metrics                              │
│  Access Level: Detailed                                │
│  Operation: Read                                       │
│  Method: API                                           │
│  Status: ✓ Success                                     │
│                                                         │
│  Data Accessed                                          │
│  • Weight measurements (last 7 days)                   │
│  • Blood pressure readings (last 7 days)               │
│  • Heart rate data (last 7 days)                       │
│  Total data volume: 2.1 KB                             │
│                                                         │
│  Purpose                                                │
│  Generate daily health summary and identify trends     │
│  for personalized recommendations                      │
│                                                         │
│  Authorization                                          │
│  Consent ID: consent_1728123456_abc123                 │
│  Granted: September 28, 2025                           │
│  Expires: Never (until revoked)                        │
│                                                         │
│  Technical Details                                      │
│  Session ID: session_xyz789                            │
│  Request ID: req_abc123                                │
│  IP Address: 10.0.1.45 (Internal API)                  │
│  Duration: 145ms                                       │
│                                                         │
│              [Flag as Suspicious]    [Close]            │
│                                                         │
└────────────────────────────────────────────────────────┘
```

---

## Data Export Flow

```
Step 1: Request Export
┌────────────────────────────────────────────────────────┐
│                                                         │
│           Export Your Data                              │
│                                                         │
│  Download a copy of all your health data.              │
│                                                         │
│  Export Format:                                         │
│  ● JSON (machine-readable)                              │
│  ○ CSV (spreadsheet)                                    │
│  ○ PDF (human-readable report)                          │
│  ○ FHIR (medical standard)                              │
│                                                         │
│  What to include:                                       │
│  ☑ Personal information                                 │
│  ☑ Health metrics and vitals                            │
│  ☑ Activity logs                                        │
│  ☑ Conversation history with AI                         │
│  ☑ AI recommendations                                   │
│  ☑ Medical history                                      │
│  ☑ Medications                                          │
│  ☐ Access logs (HIPAA audit trail)                     │
│                                                         │
│  Date Range:                                            │
│  [All time ▼]                                           │
│    • Last 30 days                                       │
│    • Last 90 days                                       │
│    • Last year                                          │
│    • All time                                           │
│    • Custom range                                       │
│                                                         │
│  Delivery:                                              │
│  ● Email download link to jane@example.com              │
│  ○ Download now (if ready instantly)                    │
│                                                         │
│  📊 Estimated file size: ~15 MB                         │
│  ⏱ Estimated time: Ready within 24 hours               │
│                                                         │
│              [Cancel]    [Request Export]               │
│                                                         │
└────────────────────────────────────────────────────────┘

Step 2: Export Requested
┌────────────────────────────────────────────────────────┐
│                                                         │
│           ✓ Export Requested                            │
│                                                         │
│  Your data export is being prepared.                   │
│                                                         │
│  ┌────────────────────────────────────────────────┐   │
│  │ Export Request #12345                           │   │
│  │ Requested: Oct 5, 2025 at 3:00 PM              │   │
│  │ Status: In Progress                             │   │
│  │                                                  │   │
│  │ [████████░░░░░░] 60%                            │   │
│  │                                                  │   │
│  │ Estimated completion: Oct 6, 2025 at 10:00 AM  │   │
│  └────────────────────────────────────────────────┘   │
│                                                         │
│  We'll email you when your export is ready.            │
│  You can also check back here anytime.                 │
│                                                         │
│  💡 Your export will be available for 7 days after     │
│     completion.                                        │
│                                                         │
│              [View Previous Exports]    [Done]          │
│                                                         │
└────────────────────────────────────────────────────────┘

Step 3: Export Ready
┌────────────────────────────────────────────────────────┐
│                                                         │
│           Your Data Export is Ready                     │
│                                                         │
│  ┌────────────────────────────────────────────────┐   │
│  │ Export Request #12345                           │   │
│  │ Completed: Oct 6, 2025 at 9:23 AM              │   │
│  │ Status: ✓ Ready                                 │   │
│  │                                                  │   │
│  │ File: bearable_data_export_20251006.json       │   │
│  │ Size: 14.2 MB                                   │   │
│  │ Expires: Oct 13, 2025                           │   │
│  │                                                  │   │
│  │          [Download] [Email Link]                │   │
│  └────────────────────────────────────────────────┘   │
│                                                         │
│  What's included:                                       │
│  ✓ 1,247 health metric records                         │
│  ✓ 892 activity log entries                            │
│  ✓ 56 AI conversation transcripts                      │
│  ✓ 134 AI recommendations                              │
│  ✓ Complete medical history                            │
│  ✓ Medication records                                  │
│                                                         │
│  🔒 This download link is secure and encrypted.        │
│                                                         │
│              [Request Another Export]    [Done]         │
│                                                         │
└────────────────────────────────────────────────────────┘
```

---

## Consent Revocation

```
Step 1: Confirm Revocation
┌────────────────────────────────────────────────────────┐
│                                                         │
│           Revoke Access?                                │
│                                                         │
│  Are you sure you want to revoke access for:           │
│                                                         │
│  👤 Mom (Caregiver - Family)                            │
│                                                         │
│  ┌────────────────────────────────────────────────┐   │
│  │ Current Access:                                 │   │
│  │ • Activity logs (summary level)                 │   │
│  │ • AI recommendations                            │   │
│  │ • Progress updates                              │   │
│  │                                                  │   │
│  │ Last accessed: 2 hours ago                      │   │
│  │ Access granted: Sep 21, 2025                    │   │
│  └────────────────────────────────────────────────┘   │
│                                                         │
│  If you revoke access:                                  │
│  ✓ Mom will immediately lose access to your data       │
│  ✓ She will be notified of the revocation             │
│  ✓ You can re-invite her anytime                      │
│                                                         │
│  ☐ Also delete data previously shared with Mom          │
│    (where technically possible)                        │
│                                                         │
│  Reason (optional):                                     │
│  [_____________________________________________]        │
│                                                         │
│              [Cancel]    [Revoke Access]                │
│                                                         │
└────────────────────────────────────────────────────────┘

Step 2: Access Revoked
┌────────────────────────────────────────────────────────┐
│                                                         │
│           ✓ Access Revoked                              │
│                                                         │
│  Mom's access has been revoked.                        │
│                                                         │
│  ┌────────────────────────────────────────────────┐   │
│  │ • Access immediately terminated                 │   │
│  │ • Mom has been notified via email               │   │
│  │ • This action has been logged in your audit     │   │
│  │   trail for compliance                          │   │
│  └────────────────────────────────────────────────┘   │
│                                                         │
│  You can re-invite Mom anytime from:                   │
│  Settings > Privacy > Caregivers > Invite              │
│                                                         │
│              [View Privacy Dashboard]    [Done]         │
│                                                         │
└────────────────────────────────────────────────────────┘
```

---

## Mobile Experience

### Privacy Dashboard (Mobile)

```
┌──────────────────────┐
│ Privacy       ☰  [?] │
├──────────────────────┤
│                      │
│ ┌──────────────────┐│
│ │   3              ││
│ │ Active Consents  ││
│ └──────────────────┘│
│                      │
│ ┌──────────────────┐│
│ │   47             ││
│ │ Data Accesses    ││
│ │ (Last 30 days)   ││
│ └──────────────────┘│
│                      │
│ ┌──────────────────┐│
│ │ 🔔 1 Alert       ││
│ │                  ││
│ │ Dr. Johnson      ││
│ │ requested access ││
│ │                  ││
│ │ [Review]  [Deny] ││
│ └──────────────────┘│
│                      │
│ Active Shares        │
│                      │
│ ┌──────────────────┐│
│ │ 🤖 Wellness Bear ││
│ │ Personal AI      ││
│ │                  ││
│ │ Detailed access  ││
│ │ health_metrics,  ││
│ │ activity_logs    ││
│ │                  ││
│ │ [▼]              ││
│ └──────────────────┘│
│                      │
│ ┌──────────────────┐│
│ │ 👤 Mom           ││
│ │ Caregiver        ││
│ │                  ││
│ │ Summary access   ││
│ │ 2 hours ago      ││
│ │                  ││
│ │ [▼]              ││
│ └──────────────────┘│
│                      │
│ ┌──────────────────┐│
│ │ Export Data      ││
│ └──────────────────┘│
│ ┌──────────────────┐│
│ │ View Logs        ││
│ └──────────────────┘│
│ ┌──────────────────┐│
│ │ Delete Data      ││
│ └──────────────────┘│
│                      │
└──────────────────────┘
```

### Mobile Notifications

```
┌──────────────────────────────────┐
│ Notification                      │
├──────────────────────────────────┤
│ 🔔 Privacy Alert                 │
│                                   │
│ Dr. Johnson (Mayo Clinic)        │
│ requested access to your health  │
│ metrics for care plan validation.│
│                                   │
│ [Review Request]  [Deny]         │
│                                   │
└──────────────────────────────────┘

┌──────────────────────────────────┐
│ Notification                      │
├──────────────────────────────────┤
│ ⚠️ Access Denied                 │
│                                   │
│ An unknown system tried to access│
│ your medical history but was     │
│ blocked due to no active consent.│
│                                   │
│ Attempted at: 9:45 AM today      │
│                                   │
│ [View Details]  [Dismiss]        │
│                                   │
└──────────────────────────────────┘

┌──────────────────────────────────┐
│ Notification                      │
├──────────────────────────────────┤
│ 📥 Data Export Ready             │
│                                   │
│ Your data export is ready for    │
│ download.                        │
│                                   │
│ File: bearable_data_...json      │
│ Size: 14.2 MB                    │
│ Expires in: 7 days               │
│                                   │
│ [Download]  [Email Link]         │
│                                   │
└──────────────────────────────────┘
```

---

## User Journey Examples

### Journey 1: New User Onboarding

```
User signs up
    │
    ▼
Complete profile
    │
    ▼
Privacy onboarding wizard (6 steps)
    │
    ├─► Welcome & education
    ├─► Essential AI consent (default: ON)
    ├─► AI personalization (defaults recommended)
    ├─► Caregiver sharing (default: OFF, optional)
    ├─► Third-party integrations (default: OFF, optional)
    └─► Review & complete
    │
    ▼
Dashboard with highlighted Privacy Dashboard
    │
    ▼
Begin using app
```

**Time to Complete:** 3-5 minutes
**Drop-off Prevention:**
- Can skip and complete later
- Progress saved at each step
- Clear benefit statements

---

### Journey 2: Adding a Caregiver

```
User navigates to Caregivers section
    │
    ▼
Click "Invite Caregiver"
    │
    ▼
Enter name, email, relationship
    │
    ▼
Choose access tier (View-Only, Interactive, etc.)
    │
    ▼
Customize permissions (optional)
    │
    ▼
Configure notifications
    │
    ▼
Set emergency contact options
    │
    ▼
Review and send invitation
    │
    ├─► Caregiver receives email
    │   │
    │   ▼
    │   Caregiver signs up/signs in
    │   │
    │   ▼
    │   Caregiver reviews permissions
    │   │
    │   ▼
    │   Caregiver accepts
    │   │
    │   ▼
    │   User notified of acceptance
    │
    ▼
Caregiver now has access per permissions
```

**Time to Complete:** 2-3 minutes
**Notifications:**
- User: "Invitation sent"
- Caregiver: "You've been invited"
- User: "Caregiver accepted"
- Both: "Access is now active"

---

### Journey 3: Responding to AI Data Request

```
User interacting with AI
    │
    ▼
AI needs new data category
    │
    ▼
Just-in-time consent modal appears
    │
    ├─► User reads purpose
    ├─► User reviews what will be accessed
    ├─► User chooses access level
    └─► User chooses duration
    │
    ├─► User clicks "Allow"
    │   │
    │   ▼
    │   Consent granted
    │   │
    │   ▼
    │   AI proceeds with request
    │   │
    │   ▼
    │   User sees AI response
    │
    └─► User clicks "Deny"
        │
        ▼
        Consent denied
        │
        ▼
        AI explains it can't proceed
        │
        ▼
        User can continue with limited functionality
```

**Time to Complete:** 30 seconds
**Non-Intrusive:** Only shown when necessary

---

### Journey 4: Viewing Access Logs

```
User concerned about data access
    │
    ▼
Navigate to Privacy Dashboard
    │
    ▼
Click "Access Logs" tab
    │
    ▼
See list of all access attempts
    │
    ├─► Filter by date/accessor/category
    ├─► See success/denial status
    └─► Click entry for details
        │
        ▼
        See full access log detail
        │
        ├─► What was accessed
        ├─► Why (purpose)
        ├─► When (timestamp)
        ├─► Who (accessor info)
        └─► Authorization (consent used)
        │
        ▼
        Option to flag as suspicious
        │
        ▼
        Download CSV for records
```

**Transparency:** Every access is visible
**Compliance:** HIPAA audit trail

---

### Journey 5: Emergency Override

```
Medical emergency occurs
    │
    ▼
Clinician requests emergency access
    │
    ▼
System shows emergency override modal
    │
    ├─► Clinician describes emergency
    ├─► Severity level selected
    ├─► Duration set (default: 60 min)
    └─► Witness(es) added (if available)
    │
    ▼
Emergency override granted
    │
    ├─► Clinician gets temporary full access
    ├─► Compliance team alerted immediately
    ├─► All access logged in detail
    └─► User will be notified when able
    │
    ▼
Emergency resolved
    │
    ▼
Clinician marks override as resolved
    │
    ├─► Documents emergency
    ├─► Uploads incident report
    └─► Override expires
    │
    ▼
User receives notification of what happened
    │
    ├─► Reviews access logs
    ├─► See exactly what was accessed
    └─► Can approve or raise concern
    │
    ▼
Compliance team reviews within 72 hours
    │
    ▼
Documentation complete
```

**Safeguards:**
- Time-limited access
- Immediate compliance notification
- Full audit trail
- Post-event user notification
- Required documentation

---

## Design System

### Color Palette

**Status Colors:**
- Active/Success: `#10B981` (Green)
- Warning/Expiring: `#F59E0B` (Amber)
- Denied/Error: `#EF4444` (Red)
- Info: `#3B82F6` (Blue)

**Accessor Type Colors:**
- AI Agents: `#6366F1` (Indigo)
- Caregivers: `#8B5CF6` (Purple)
- Clinicians: `#06B6D4` (Cyan)
- Third-Party: `#64748B` (Gray)

**Access Level Colors:**
- None: `#E5E7EB` (Gray 200)
- Summary: `#BFDBFE` (Blue 200)
- Detailed: `#93C5FD` (Blue 300)
- Full: `#3B82F6` (Blue 500)

### Typography

- **Headings:** Inter, Bold
- **Body:** Inter, Regular
- **Monospace (IDs, logs):** JetBrains Mono

### Icons

- Lock: 🔒 (Privacy, Security)
- Alert: 🔔 (Notifications)
- Check: ✓ (Success, Active)
- Warning: ⚠️ (Attention needed)
- Cross: ✗ (Denied, Error)
- AI: 🤖 (AI Agents)
- Person: 👤 (Caregivers, Users)
- Medical: 🏥 (Clinicians, Health)
- Export: 📥 (Data download)
- Delete: 🗑️ (Data deletion)

### Spacing

- Tight: 4px
- Normal: 8px
- Relaxed: 16px
- Loose: 24px

---

## Accessibility

### WCAG 2.1 AA Compliance

**Color Contrast:**
- Text: Minimum 4.5:1 ratio
- Large text: Minimum 3:1 ratio
- Interactive elements: Minimum 3:1 ratio

**Keyboard Navigation:**
- All interactive elements tabbable
- Clear focus indicators
- Logical tab order
- Escape key closes modals

**Screen Reader Support:**
- Semantic HTML
- ARIA labels where needed
- Alt text for icons
- Status announcements

**Example:**
```html
<button
  aria-label="Revoke access for Mom"
  aria-describedby="revoke-warning"
>
  Revoke Access
</button>
<div id="revoke-warning" role="alert">
  This will immediately remove Mom's access to your data
</div>
```

---

## Conclusion

These wireframes and user journeys provide a comprehensive blueprint for implementing a user-friendly, HIPAA-compliant consent management system. The design prioritizes:

✅ **Clarity:** Clear language, visual hierarchy
✅ **Control:** Granular permissions, easy revocation
✅ **Transparency:** Full audit trails, access logs
✅ **Compliance:** HIPAA/GDPR/CCPA requirements met
✅ **Accessibility:** WCAG 2.1 AA standards
✅ **Mobile-First:** Responsive design, touch-friendly

Next steps: Convert wireframes to high-fidelity mockups and begin development implementation.
