# Consent Management System - Implementation Guide

## Executive Summary

This document provides detailed implementation recommendations for a HIPAA-compliant, user-centric consent management and data privacy system for the Bearable AI Health Coach platform.

**Key Compliance Standards:**
- HIPAA (Health Insurance Portability and Accountability Act)
- GDPR (General Data Protection Regulation)
- CCPA (California Consumer Privacy Act)
- 21st Century Cures Act (Information Blocking)

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Regulatory Compliance Requirements](#regulatory-compliance-requirements)
3. [Consent Granularity Levels](#consent-granularity-levels)
4. [Technical Implementation](#technical-implementation)
5. [UX/UI Implementation](#uxui-implementation)
6. [Data Sharing Layers](#data-sharing-layers)
7. [Security & Encryption](#security--encryption)
8. [Testing & Validation](#testing--validation)
9. [Deployment Checklist](#deployment-checklist)
10. [Ongoing Compliance](#ongoing-compliance)

---

## Architecture Overview

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                      User Interface Layer                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Onboarding  │  │   Privacy    │  │  Just-in-    │      │
│  │     Flow     │  │  Dashboard   │  │  Time Consent│      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    API Gateway Layer                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Consent    │  │ Data Access  │  │   Privacy    │      │
│  │     API      │  │  Validation  │  │  Rights API  │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   Business Logic Layer                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Consent    │  │   Access     │  │   Audit      │      │
│  │   Service    │  │   Control    │  │   Logger     │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      Data Layer (Supabase)                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Consent    │  │  Access      │  │   History    │      │
│  │   Records    │  │   Logs       │  │   Archive    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow for Access Request

```
User requests data
       │
       ▼
Check active consent ──► No consent? ──► Deny + Request consent
       │
       ▼ Has consent
Check temporal restrictions ──► Outside hours? ──► Deny
       │
       ▼ Within allowed time
Check rate limits ──► Exceeded? ──► Deny
       │
       ▼ Within limits
Check data category permission ──► Not permitted? ──► Deny
       │
       ▼ Permitted
Grant access at appropriate level
       │
       ▼
Log access attempt (HIPAA requirement)
       │
       ▼
Return filtered data
```

---

## Regulatory Compliance Requirements

### HIPAA Compliance

#### Minimum Necessary Standard
**Requirement:** Only the minimum necessary PHI should be accessed.

**Implementation:**
- Access level controls: `none`, `summary`, `aggregated`, `detailed`, `full`
- Automatic data filtering based on access level
- Purpose-specific data access (not blanket permissions)

```typescript
// Example: Filter data based on access level
function filterHealthData(data: HealthRecord, accessLevel: AccessLevel) {
  switch(accessLevel) {
    case 'summary':
      return {
        date: data.date,
        overallScore: data.overallScore,
        // Exclude detailed measurements
      };
    case 'detailed':
      return {
        ...data,
        // Exclude PII identifiers
      };
    case 'full':
      return data;
    default:
      throw new Error('No access permitted');
  }
}
```

#### Right of Access
**Requirement:** Patients must be able to access their PHI within 30 days.

**Implementation:**
- Data export API with multiple formats (JSON, CSV, PDF, FHIR)
- Automated export generation pipeline
- Email notification when export is ready

#### Right to Amend
**Requirement:** Patients can request corrections to their PHI.

**Implementation:**
- Amendment request workflow
- Audit trail of all amendments
- Notification to parties who received the data

#### Audit Controls
**Requirement:** Record and examine activity in systems containing PHI.

**Implementation:**
- Comprehensive `data_access_logs` table
- 6-year retention period
- Immutable audit logs (append-only)
- Regular audit log reviews

```sql
-- Audit log retention enforcement
CREATE POLICY "Audit logs are append-only"
    ON data_access_logs
    FOR DELETE
    USING (false); -- Prevent deletion
```

---

### GDPR Compliance

#### Lawful Basis for Processing
**Requirement:** Must have a lawful basis for processing personal data.

**Implementation:**
- Track `legal_basis` field in consent records
- Options: consent, contract, legal obligation, vital interests, etc.
- Clear documentation of basis for each processing activity

#### Right to Erasure ("Right to be Forgotten")
**Requirement:** Users can request deletion of their data.

**Implementation:**
- `consent_withdrawal_requests` table
- 30-day processing deadline
- Automated deletion workflow
- Documentation of retained data (legal obligations)

```typescript
// Data deletion workflow
async function processDataDeletion(requestId: string) {
  const request = await getWithdrawalRequest(requestId);

  // 1. Revoke all consents
  await revokeAllConsents(request.userId);

  // 2. Delete user data (except legally required)
  const retainedData = await deleteUserData(
    request.userId,
    request.deleteCategories,
    { retainForLegal: request.retainForLegalReasons }
  );

  // 3. Update request status
  await updateWithdrawalRequest(requestId, {
    status: 'completed',
    dataRetained: retainedData.description
  });

  // 4. Send confirmation
  await sendDeletionConfirmation(request.userId);
}
```

#### Data Portability
**Requirement:** Users can obtain and reuse their data.

**Implementation:**
- Export in machine-readable format (JSON, FHIR)
- Include all user-provided and derived data
- API for automated data transfer

#### Consent Validity
**Requirement:** Consent must be freely given, specific, informed, and unambiguous.

**Implementation:**
- Unbundled consent (separate for each purpose)
- Clear, plain language explanations
- Affirmative action required (no pre-checked boxes)
- Easy withdrawal mechanism

---

### CCPA Compliance

#### Right to Know
**Implementation:** Data sharing summary dashboard

#### Right to Delete
**Implementation:** Same workflow as GDPR Right to Erasure

#### Right to Opt-Out of Sale
**Implementation:**
- No sale of personal information
- Third-party consent explicitly tracks data sharing
- "Do Not Sell My Personal Information" option in settings

---

## Consent Granularity Levels

### Level 1: Personal Bearable AI
**Purpose:** Core AI companion functionality

**Default Permissions:**
```json
{
  "dataAccess": {
    "demographics": "summary",
    "health_metrics": "detailed",
    "activity_logs": "detailed",
    "ai_recommendations": "full"
  },
  "aiPermissions": {
    "allowPersonalization": true,
    "allowInsightGeneration": true,
    "allowProactiveOutreach": true,
    "requireExplanations": true,
    "explanationDetail": "moderate"
  }
}
```

**Recommended Onboarding:**
- Present as "Essential" tier
- Highlight that this enables core functionality
- Allow granular opt-out of specific categories

---

### Level 2: Specialist AI Agents (Per Pillar)
**Purpose:** Six pillars of lifestyle medicine

**Pillars:**
1. Nutrition AI
2. Physical Activity AI
3. Sleep AI
4. Stress Management AI
5. Social Connection AI
6. Substance Avoidance AI

**Per-Pillar Consent:**
```typescript
interface SpecialistConsent {
  pillar: 'nutrition' | 'physical_activity' | /* ... */;
  dataAccess: {
    // Pillar-specific data
  };
  allowDirectRecommendations: boolean;
  allowCrossPillarSharing: boolean; // Share insights with other AIs
  interventionLevel: 'passive' | 'moderate' | 'active';
}
```

**Recommended Onboarding:**
- Present during goal-setting
- "To help with your nutrition goals, would you like a dedicated Nutrition AI?"
- Show which data the specialist needs

---

### Level 3: Caregiver Access
**Purpose:** Family, friends, coaches

**Tiers:**
1. **View-Only:** See progress summaries
2. **Interactive:** Send messages, receive updates
3. **Collaborative:** Set reminders, modify goals
4. **Emergency Full:** Complete access during emergencies

**Per-Caregiver Consent:**
```typescript
interface CaregiverConsent {
  tier: 'view_only' | 'interactive' | 'collaborative' | 'emergency_full';
  relationship: 'family' | 'friend' | 'healthcare_provider' | 'coach';

  // Granular permissions
  canViewProgress: boolean;
  canViewHealthMetrics: boolean;
  canViewConversations: boolean;
  canViewMedications: boolean;

  // Emergency
  isEmergencyContact: boolean;
  emergencyAccessDuration: number; // minutes
}
```

**Recommended Onboarding:**
- Separate step: "Would you like to invite caregivers?"
- Present pre-configured tiers
- Allow customization of each tier
- Emphasize ability to change anytime

**UI Wireframe (Text Description):**
```
┌─────────────────────────────────────────┐
│ Invite Caregiver                         │
├─────────────────────────────────────────┤
│ Name: [________________]                 │
│ Email: [_______________]                 │
│ Relationship: [Family ▼]                 │
│                                          │
│ Access Level:                            │
│ ○ View-Only (Progress summaries)         │
│ ● Interactive (Messages + Updates)       │
│ ○ Collaborative (Can help manage)        │
│                                          │
│ What can they see?                       │
│ ☑ Daily activity & progress              │
│ ☑ Health goals                           │
│ ☑ AI recommendations                     │
│ ☐ Health metrics (weight, BP, etc.)     │
│ ☐ Medications                            │
│ ☐ Conversation history                   │
│                                          │
│ ☑ Make emergency contact                 │
│   (Full access for 60 minutes)           │
│                                          │
│ [Cancel]  [Send Invitation]              │
└─────────────────────────────────────────┘
```

---

### Level 4: Mayo Clinician Access
**Purpose:** Healthcare provider oversight and care plan validation

**Permissions:**
```typescript
interface ClinicianConsent {
  clinicianNPI: string; // National Provider Identifier
  organization: string;
  specialty: string;

  canViewFullMedicalHistory: boolean;
  canViewAIRecommendations: boolean;
  canModifyCarePlan: boolean;
  validateAIRecommendations: boolean;
  receiveAIAlerts: boolean; // For concerning patterns

  treatmentRelationship: boolean;
  hipaaAuthorizationSigned: boolean;
}
```

**Recommended Onboarding:**
- Initiated by clinician or user
- Requires HIPAA authorization form
- Explicit consent for AI recommendation sharing
- Option for AI to alert clinician about concerns

**HIPAA Authorization Form Elements:**
- Specific description of information to be disclosed
- Name of person/entity authorized to make disclosure
- Name of person/entity receiving information
- Purpose of disclosure
- Expiration date or event
- Right to revoke authorization
- Signature and date

---

### Level 5: Third-Party Integrations
**Purpose:** HealthBank One, wearables, EHR systems

**Per-Integration Consent:**
```typescript
interface ThirdPartyConsent {
  integrationName: string;
  integrationType: 'wearable' | 'ehr' | 'phr' | 'health_app';

  allowDataImport: boolean; // Import from third-party
  allowDataExport: boolean; // Export to third-party

  sharedDataCategories: DataCategory[];
  syncFrequency: 'realtime' | 'hourly' | 'daily' | 'manual';

  encryptionRequired: boolean;
  anonymizeData: boolean;

  // Third-party terms
  thirdPartyTermsUrl: string;
  acceptedTermsVersion: string;
}
```

**Recommended Onboarding:**
- Just-in-time: When user initiates integration
- Show third-party privacy policy
- Explicit opt-in for bidirectional sync
- Highlight data that will be shared

**UI Wireframe (Text Description):**
```
┌─────────────────────────────────────────┐
│ Connect Apple Health                     │
├─────────────────────────────────────────┤
│ [Apple Health Logo]                      │
│                                          │
│ This integration will:                   │
│ • Import your steps, heart rate, sleep   │
│ • Sync data every hour automatically     │
│ • Share your activity logs with Apple    │
│                                          │
│ ⚠️  Apple Health has its own privacy     │
│    policy. Review it here: [View]        │
│                                          │
│ Data Sharing:                            │
│ Direction: ● Import & Export             │
│            ○ Import Only                 │
│            ○ Export Only                 │
│                                          │
│ Categories:                              │
│ ☑ Activity logs (steps, workouts)        │
│ ☑ Sleep data                             │
│ ☑ Heart rate                             │
│ ☐ Weight & body measurements            │
│                                          │
│ ☐ Anonymize my data before sharing      │
│                                          │
│ [Cancel]  [Authorize Connection]         │
└─────────────────────────────────────────┘
```

---

## Technical Implementation

### Phase 1: Database Setup (Week 1-2)

**Tasks:**
1. Deploy Supabase schema (`consent-database-schema.sql`)
2. Configure row-level security (RLS) policies
3. Set up encryption for PHI fields
4. Create database backups and disaster recovery plan

**Supabase Configuration:**
```bash
# Deploy schema
psql $DATABASE_URL -f docs/consent-database-schema.sql

# Enable real-time for consent changes
supabase realtime enable consent_records
supabase realtime enable consent_notifications

# Configure backups
supabase backups create --project-ref $PROJECT_REF
```

**Encryption Setup:**
```sql
-- Encrypt sensitive fields using pgcrypto
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Example: Encrypt medical history
ALTER TABLE health_records
ADD COLUMN encrypted_notes BYTEA;

-- Function to encrypt
CREATE FUNCTION encrypt_notes(text) RETURNS bytea AS $$
  SELECT pgp_sym_encrypt($1, current_setting('app.encryption_key'))
$$ LANGUAGE SQL;

-- Function to decrypt
CREATE FUNCTION decrypt_notes(bytea) RETURNS text AS $$
  SELECT pgp_sym_decrypt($1, current_setting('app.encryption_key'))
$$ LANGUAGE SQL;
```

---

### Phase 2: Backend API (Week 3-5)

**Tasks:**
1. Implement `ConsentService` class
2. Create REST API endpoints
3. Add middleware for consent checking
4. Implement audit logging

**Middleware for Automatic Consent Checking:**
```typescript
// middleware/consentCheck.ts
export async function requireConsent(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const userId = req.user.id;
  const dataCategory = req.route.meta.dataCategory;
  const operation = req.method === 'GET' ? 'read' : 'write';

  const accessCheck = await consentService.checkDataAccess(
    userId,
    req.user.id, // accessor is the user themselves
    'user',
    dataCategory,
    operation,
    {
      purpose: req.route.meta.purpose,
      sessionId: req.session.id,
      requestId: req.id
    }
  );

  if (!accessCheck.allowed) {
    return res.status(403).json({
      error: 'Access denied',
      reason: accessCheck.reason,
      requestConsentUrl: `/consent/request?category=${dataCategory}`
    });
  }

  // Attach access level to request for data filtering
  req.accessLevel = accessCheck.accessLevel;
  next();
}

// Usage on routes
router.get('/api/health-metrics',
  authenticate,
  requireConsent,
  async (req, res) => {
    const data = await getHealthMetrics(req.user.id);
    // Filter based on req.accessLevel
    const filtered = filterData(data, req.accessLevel);
    res.json(filtered);
  }
);
```

**Automatic Audit Logging:**
```typescript
// middleware/auditLog.ts
export async function auditDataAccess(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const startTime = Date.now();

  // Capture response
  const originalSend = res.send;
  res.send = function(data) {
    const duration = Date.now() - startTime;

    // Log access attempt
    consentService.logAccessAttempt(
      req.user.id,
      req.user.id,
      'user',
      req.route.meta.dataCategory,
      req.method === 'GET' ? 'read' : 'write',
      res.statusCode < 400, // success
      res.statusCode >= 400 ? data.error : undefined,
      {
        consentId: req.consentId,
        purpose: req.route.meta.purpose,
        sessionId: req.session.id,
        requestId: req.id,
        duration
      }
    );

    return originalSend.call(this, data);
  };

  next();
}
```

---

### Phase 3: Frontend Components (Week 6-8)

**Component Architecture:**
```
src/components/ConsentManagement/
├── ConsentOnboarding.tsx         (Multi-step onboarding flow)
├── PrivacyDashboard.tsx          (Main privacy control center)
├── ConsentCard.tsx               (Individual consent display)
├── JustInTimeConsent.tsx         (Modal for runtime consent requests)
├── AccessLogViewer.tsx           (HIPAA audit log display)
├── DataExportModal.tsx           (GDPR data export)
└── ConsentRevocationFlow.tsx     (Withdrawal/deletion)
```

**Just-in-Time Consent Component:**
```typescript
// JustInTimeConsent.tsx
interface JustInTimeConsentProps {
  dataCategory: DataCategory;
  purpose: string;
  requestedBy: string;
  onGrant: (consent: ConsentRecord) => void;
  onDeny: () => void;
}

export const JustInTimeConsent: React.FC<JustInTimeConsentProps> = ({
  dataCategory,
  purpose,
  requestedBy,
  onGrant,
  onDeny
}) => {
  return (
    <Modal>
      <div className="consent-request">
        <h2>Permission Needed</h2>
        <p>
          <strong>{requestedBy}</strong> would like to access your{' '}
          <strong>{formatCategory(dataCategory)}</strong>.
        </p>
        <p>Purpose: {purpose}</p>

        <div className="access-level-selector">
          <label>
            <input type="radio" value="summary" />
            Summary only (aggregate data)
          </label>
          <label>
            <input type="radio" value="detailed" />
            Detailed (specific records)
          </label>
          <label>
            <input type="radio" value="full" />
            Full access (all information)
          </label>
        </div>

        <div className="expiry-selector">
          <label>Grant access for:</label>
          <select>
            <option value="once">Just this time</option>
            <option value="24h">24 hours</option>
            <option value="7d">7 days</option>
            <option value="30d">30 days</option>
            <option value="forever">Until I revoke</option>
          </select>
        </div>

        <div className="actions">
          <button onClick={onDeny}>Deny</button>
          <button onClick={() => grantConsent()}>Allow</button>
        </div>
      </div>
    </Modal>
  );
};
```

---

### Phase 4: Integration Points (Week 9-10)

**AI Agent Integration:**
```typescript
// Before AI generates recommendation
async function generateRecommendation(userId: string, pillar: string) {
  // 1. Check consent
  const hasConsent = await consentService.checkDataAccess(
    userId,
    `ai-${pillar}`,
    'ai_agent',
    'health_metrics',
    'read'
  );

  if (!hasConsent.allowed) {
    throw new Error('User has not consented to AI analysis');
  }

  // 2. Fetch data at appropriate access level
  const data = await fetchHealthData(userId, hasConsent.accessLevel);

  // 3. Generate recommendation
  const recommendation = await aiService.analyze(data);

  // 4. Check if user wants explanations
  const preferences = await getConsentPreferences(userId);
  if (preferences.alwaysExplainAIDecisions) {
    recommendation.explanation = await aiService.explain(recommendation);
  }

  return recommendation;
}
```

**Caregiver Dashboard Integration:**
```typescript
// Caregiver viewing patient data
async function getCaregiverView(caregiverId: string, patientId: string) {
  // 1. Get caregiver consent
  const consent = await getCaregiverConsent(patientId, caregiverId);

  if (!consent || consent.status !== 'active') {
    throw new Error('No active consent');
  }

  // 2. Build view based on permissions
  const view: CaregiverView = {};

  if (consent.canViewProgress) {
    view.progress = await getProgressSummary(patientId);
  }

  if (consent.canViewHealthMetrics) {
    view.healthMetrics = await getHealthMetrics(
      patientId,
      'summary' // Caregivers typically get summary level
    );
  }

  if (consent.canViewConversations) {
    view.conversations = await getConversationSummaries(patientId);
  }

  // 3. Log access
  await logCaregiverAccess(caregiverId, patientId, Object.keys(view));

  return view;
}
```

---

## UX/UI Implementation

### Onboarding Flow

**Step 1: Welcome & Education**
- Explain importance of privacy
- Highlight HIPAA protection
- Set expectations (can change anytime)

**Step 2: Essential AI**
- Frame as "required for core functionality"
- Show specific data needs
- Allow granular opt-out

**Step 3: AI Personalization**
- Optional enhancements
- Clear benefit statements
- Separate toggle for each feature

**Step 4: Caregiver Setup**
- Optional
- Explain different tiers
- Can skip and add later

**Step 5: Third-Party**
- Show available integrations
- Can skip and add later

**Step 6: Review**
- Summary of all choices
- Easy to go back and change
- Emphasize rights (access, export, delete)

**Progress Indicator:**
```
[====●====    ] Step 2 of 6: Essential AI
```

**Design Principles:**
1. **Progressive Disclosure:** Don't overwhelm with all options at once
2. **Plain Language:** No legal jargon
3. **Visual Clarity:** Use icons, color coding
4. **Recommendations:** Mark suggested options
5. **Education:** Tooltips, help text
6. **Reversibility:** Emphasize ability to change

---

### Privacy Dashboard

**Main Dashboard Sections:**

```
┌─────────────────────────────────────────────────────────┐
│  Privacy Dashboard                                      │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐│
│  │   3      │  │    2     │  │   47     │  │    1    ││
│  │ Active   │  │  Data    │  │ Accesses │  │  Alert  ││
│  │ Consents │  │ Accessors│  │  (30d)   │  │         ││
│  └──────────┘  └──────────┘  └──────────┘  └─────────┘│
│                                                          │
│  🔔 Action Required:                                    │
│  Your Mayo Clinic physician requested access to your    │
│  health metrics. [Review Request]                       │
│                                                          │
├─────────────────────────────────────────────────────────┤
│  Active Data Shares                                     │
│  ┌────────────────────────────────────────────────────┐│
│  │ 🤖 Wellness Bear (Personal AI)                     ││
│  │ Access: health_metrics, activity_logs              ││
│  │ Level: Detailed • Granted: Sep 28, 2025           ││
│  │                                    [Revoke Access] ││
│  └────────────────────────────────────────────────────┘│
│  ┌────────────────────────────────────────────────────┐│
│  │ 👤 Mom (Caregiver)                                 ││
│  │ Access: activity_logs, ai_recommendations          ││
│  │ Level: Summary • Granted: Sep 21, 2025            ││
│  │                                    [Revoke Access] ││
│  └────────────────────────────────────────────────────┘│
│                                                          │
├─────────────────────────────────────────────────────────┤
│  Quick Actions                                          │
│  [📥 Export My Data]  [📊 View Access Logs]            │
│  [⚙️ Manage Consents] [🗑️ Delete My Data]             │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

**Tabs:**
- **Overview:** Summary and alerts
- **Consents:** Manage all active consents
- **Access Logs:** HIPAA audit trail
- **Data Exports:** Request and download exports
- **Notifications:** Privacy-related alerts

---

### Mobile Considerations

**Push Notifications:**
- Consent expiring soon
- New data access request
- Unusual access pattern detected
- Privacy policy update

**Quick Actions Widget:**
```
┌──────────────────────┐
│ Privacy Status       │
│ ✓ All systems secure │
│                      │
│ Active Shares: 3     │
│ [View Details]       │
└──────────────────────┘
```

---

## Data Sharing Layers

### Layer 1: Raw Data
**Access Level:** `full`

**Who Gets It:**
- User themselves
- Emergency override situations
- Legal/court order (with documentation)

**Example:**
```json
{
  "weight": 175.3,
  "blood_pressure": {
    "systolic": 128,
    "diastolic": 82
  },
  "timestamp": "2025-10-05T08:30:00Z",
  "location": "home",
  "notes": "Feeling good today"
}
```

---

### Layer 2: Detailed Data
**Access Level:** `detailed`

**Who Gets It:**
- Personal AI companion
- Mayo clinicians (with consent)
- Specialist AI agents

**Filtering:**
- Remove PII identifiers
- Keep specific measurements
- Include temporal data

**Example:**
```json
{
  "weight": 175,
  "blood_pressure": "normal",
  "timestamp": "2025-10-05T08:30:00Z",
  "trend": "stable"
}
```

---

### Layer 3: Aggregated Data
**Access Level:** `aggregated`

**Who Gets It:**
- Third-party analytics (with consent)
- Research studies (anonymized)

**Filtering:**
- Statistical aggregations
- No individual data points
- Time-binned (weekly/monthly)

**Example:**
```json
{
  "period": "2025-10-01 to 2025-10-07",
  "avg_weight": 175,
  "blood_pressure": "within_normal_range",
  "data_points": 7
}
```

---

### Layer 4: Summary Data
**Access Level:** `summary`

**Who Gets It:**
- Caregivers (default level)
- Coaches
- Family members

**Filtering:**
- High-level status only
- No specific measurements
- Trend indicators

**Example:**
```json
{
  "period": "Last 7 days",
  "overall_health": "good",
  "progress": {
    "exercise": "on_track",
    "nutrition": "improving",
    "sleep": "needs_attention"
  }
}
```

---

### Temporal Access Controls

**Use Cases:**

1. **Work Hours Only:**
   - Healthcare provider access during clinic hours
   - Prevents late-night access

```json
{
  "accessSchedule": {
    "timezone": "America/Chicago",
    "allowedDays": ["monday", "tuesday", "wednesday", "thursday", "friday"],
    "allowedHours": {
      "start": "08:00",
      "end": "17:00"
    }
  }
}
```

2. **Vacation Blackout:**
   - User on vacation, doesn't want nudges

```json
{
  "accessSchedule": {
    "blackoutPeriods": [{
      "start": "2025-12-20T00:00:00Z",
      "end": "2025-12-27T23:59:59Z",
      "reason": "Holiday vacation - no AI notifications"
    }]
  }
}
```

3. **Time-Limited Sharing:**
   - Temporary access for a visiting specialist

```json
{
  "expiresAt": "2025-10-15T00:00:00Z"
}
```

---

### Emergency Override Mechanism

**Trigger Conditions:**
1. User unconscious/incapacitated
2. Medical emergency
3. Safety concern

**Process:**
```
Emergency detected
       │
       ▼
Authorized person requests override
       │
       ▼
System logs override request
       │
       ▼
Grant temporary full access (default: 60 minutes)
       │
       ▼
Notify compliance team immediately
       │
       ▼
Alert user when they regain access
       │
       ▼
Require documentation within 24 hours
       │
       ▼
Compliance review within 72 hours
```

**Implementation:**
```typescript
async function triggerEmergencyOverride(
  userId: string,
  triggeredBy: string,
  emergency: {
    type: 'medical' | 'safety';
    severity: 'high' | 'critical';
    description: string;
  }
) {
  // 1. Create override record
  const override = await consentService.createEmergencyOverride(
    userId,
    triggeredBy,
    emergency.type,
    emergency.severity,
    emergency.description,
    {
      scopes: ['personal_ai', 'mayo_clinician'],
      dataCategories: ['medical_history', 'medications', 'health_metrics'],
      accessGrantedTo: [triggeredBy],
      durationMinutes: 60,
      witnessedBy: [] // To be filled if available
    }
  );

  // 2. Alert compliance team
  await notifyCompliance({
    type: 'emergency_override',
    override,
    urgency: emergency.severity
  });

  // 3. Grant temporary access
  await grantTemporaryFullAccess(userId, triggeredBy, 60);

  // 4. Schedule user notification
  scheduleNotification(userId, {
    type: 'emergency_override_occurred',
    message: `Emergency access was granted to ${triggeredBy} on ${new Date()}`,
    actionRequired: true,
    actionDeadline: addDays(new Date(), 1)
  });

  return override;
}
```

---

## Security & Encryption

### Data at Rest

**Encryption Strategy:**
- AES-256 encryption for all PHI
- Separate encryption keys per data category
- Key rotation every 90 days

**Supabase Implementation:**
```sql
-- Use pgcrypto for field-level encryption
CREATE EXTENSION pgcrypto;

-- Store encrypted data
INSERT INTO health_records (user_id, encrypted_data)
VALUES (
  'user_123',
  pgp_sym_encrypt(
    '{"weight": 175, "bp": "128/82"}',
    current_setting('app.encryption_key')
  )
);

-- Retrieve and decrypt
SELECT
  pgp_sym_decrypt(encrypted_data, current_setting('app.encryption_key'))
FROM health_records
WHERE user_id = 'user_123';
```

---

### Data in Transit

**Requirements:**
- TLS 1.3 for all API traffic
- Certificate pinning for mobile apps
- End-to-end encryption for sensitive operations

**API Configuration:**
```typescript
// server.ts
const httpsOptions = {
  cert: fs.readFileSync('/path/to/cert.pem'),
  key: fs.readFileSync('/path/to/key.pem'),
  minVersion: 'TLSv1.3'
};

const server = https.createServer(httpsOptions, app);
```

---

### Authentication & Authorization

**JWT Token Structure:**
```json
{
  "sub": "user_123",
  "role": "authenticated",
  "email": "user@example.com",
  "app_metadata": {
    "provider": "email"
  },
  "user_metadata": {
    "consent_version": "1.0.0"
  }
}
```

**Role-Based Access Control:**
- `authenticated`: Regular users
- `caregiver`: Users with caregiver consent
- `clinician`: Healthcare providers
- `admin`: System administrators
- `service_role`: Backend services

---

## Testing & Validation

### Unit Tests

```typescript
// consentService.test.ts
describe('ConsentService', () => {
  describe('checkDataAccess', () => {
    it('should allow access with valid consent', async () => {
      const result = await consentService.checkDataAccess(
        'user_123',
        'ai_agent_1',
        'ai_agent',
        'health_metrics',
        'read'
      );

      expect(result.allowed).toBe(true);
      expect(result.accessLevel).toBe('detailed');
    });

    it('should deny access without consent', async () => {
      const result = await consentService.checkDataAccess(
        'user_123',
        'unauthorized_agent',
        'ai_agent',
        'medical_history',
        'read'
      );

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('No active consent');
    });

    it('should respect temporal restrictions', async () => {
      // Mock time to be outside allowed hours
      jest.useFakeTimers().setSystemTime(new Date('2025-10-05T22:00:00Z'));

      const result = await consentService.checkDataAccess(
        'user_123',
        'clinician_1',
        'clinician',
        'health_metrics',
        'read'
      );

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('Access only allowed between');
    });

    it('should enforce rate limits', async () => {
      // Make 100 requests (at limit)
      for (let i = 0; i < 100; i++) {
        await consentService.checkDataAccess(/* ... */);
      }

      // 101st request should be denied
      const result = await consentService.checkDataAccess(/* ... */);
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('rate limit');
    });
  });
});
```

---

### Integration Tests

```typescript
// api.test.ts
describe('Consent API', () => {
  it('should enforce consent before data access', async () => {
    const response = await request(app)
      .get('/api/health-metrics')
      .set('Authorization', `Bearer ${userToken}`);

    // User hasn't granted consent yet
    expect(response.status).toBe(403);
    expect(response.body.error).toContain('Access denied');
  });

  it('should allow access after granting consent', async () => {
    // Grant consent
    await request(app)
      .post('/api/consent/grant')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        scope: 'personal_ai',
        permissions: { /* ... */ }
      });

    // Now access should work
    const response = await request(app)
      .get('/api/health-metrics')
      .set('Authorization', `Bearer ${userToken}`);

    expect(response.status).toBe(200);
    expect(response.body.data).toBeDefined();
  });
});
```

---

### Compliance Testing

**HIPAA Audit Log Test:**
```typescript
it('should log all data access attempts', async () => {
  const accessCount = await getAccessLogCount('user_123');

  // Make a data request
  await request(app).get('/api/health-metrics');

  const newAccessCount = await getAccessLogCount('user_123');
  expect(newAccessCount).toBe(accessCount + 1);

  // Verify log contents
  const latestLog = await getLatestAccessLog('user_123');
  expect(latestLog).toMatchObject({
    userId: 'user_123',
    dataCategory: 'health_metrics',
    operation: 'read',
    success: true
  });
});
```

**GDPR Compliance Test:**
```typescript
it('should process data deletion within 30 days', async () => {
  // Request deletion
  const request = await createWithdrawalRequest('user_123', {
    withdrawalScope: 'complete_account',
    requestDataDeletion: true
  });

  expect(request.complianceDeadline).toBeLessThanOrEqual(
    addDays(new Date(), 30)
  );

  // Process deletion
  await processDataDeletion(request.id);

  // Verify data is deleted
  const userData = await getUserData('user_123');
  expect(userData).toBeNull();
});
```

---

## Deployment Checklist

### Pre-Launch

- [ ] Database schema deployed to production
- [ ] Encryption keys generated and stored securely (AWS KMS, Vault)
- [ ] RLS policies tested and enabled
- [ ] API endpoints deployed and tested
- [ ] Frontend components deployed
- [ ] SSL/TLS certificates installed
- [ ] Backup and disaster recovery tested
- [ ] Monitoring and alerting configured
- [ ] Privacy policy and terms of service updated
- [ ] HIPAA Business Associate Agreements signed
- [ ] Compliance team trained on emergency override process
- [ ] User documentation and help center updated

### Security Verification

- [ ] Penetration testing completed
- [ ] HIPAA Security Rule assessment
- [ ] GDPR compliance review
- [ ] Data flow mapping documented
- [ ] Incident response plan in place

### User Communication

- [ ] Email to existing users about new privacy controls
- [ ] In-app tutorial for privacy dashboard
- [ ] Blog post about commitment to privacy
- [ ] FAQ page updated

---

## Ongoing Compliance

### Daily Tasks (Automated)
- Expire old consents
- Process consent withdrawal requests
- Generate access log reports
- Check for unusual access patterns

### Weekly Tasks
- Review consent withdrawal requests
- Audit emergency overrides
- Review compliance notifications
- Update consent templates if needed

### Monthly Tasks
- Generate compliance reports
- Review and archive old audit logs
- Test disaster recovery procedures
- Update data retention policies

### Quarterly Tasks
- Rotate encryption keys
- HIPAA compliance audit
- Privacy policy review
- User consent re-confirmation (for expiring consents)

### Annual Tasks
- Full HIPAA Security Risk Assessment
- GDPR compliance certification
- Third-party security audit
- Update consent version (if needed)

---

## Support & Troubleshooting

### Common Issues

**Issue:** User can't access their data
**Solution:** Check if consent has expired, verify RLS policies

**Issue:** Caregiver not receiving updates
**Solution:** Verify notification settings in consent preferences

**Issue:** Emergency override not working
**Solution:** Check if user is designated emergency contact, verify override hasn't expired

**Issue:** Data export taking too long
**Solution:** Check if large dataset, provide estimated completion time

---

## Conclusion

This consent management system provides:

✅ **HIPAA Compliance:** Comprehensive audit logging, access controls, patient rights
✅ **GDPR Compliance:** Lawful basis, right to erasure, data portability
✅ **CCPA Compliance:** Right to know, right to delete, opt-out mechanisms
✅ **User-Centric:** Granular controls, clear explanations, easy management
✅ **Secure:** Encryption at rest and in transit, role-based access
✅ **Scalable:** Designed for growth, efficient database structure
✅ **Maintainable:** Well-documented, tested, monitored

**Next Steps:**
1. Review this document with legal and compliance teams
2. Prioritize features for MVP vs. future releases
3. Begin Phase 1 implementation (database setup)
4. Schedule regular compliance reviews
5. Gather user feedback and iterate

For questions or concerns, contact:
- **Technical:** engineering@bearable.com
- **Legal/Compliance:** compliance@bearable.com
- **Product:** product@bearable.com
