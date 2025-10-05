# Consent Management API Specification

## Overview

HIPAA-compliant REST API for consent and privacy management in the Bearable AI Health Coach platform.

**Base URL:** `/api/v1/consent`

**Authentication:** All endpoints require JWT authentication with user context.

**Audit Logging:** All operations are automatically logged for HIPAA compliance.

---

## Endpoints

### 1. Consent Management

#### Grant Consent

```http
POST /api/v1/consent/grant
```

**Description:** Grant new consent for data access.

**Request Body:**
```json
{
  "scope": "personal_ai" | "specialist_ai" | "caregiver" | "mayo_clinician" | "third_party_integration",
  "permissions": {
    "dataAccess": {
      "demographics": "none" | "summary" | "aggregated" | "detailed" | "full",
      "health_metrics": "detailed",
      "activity_logs": "full"
    },
    "canView": true,
    "canModify": false,
    "canDelete": false,
    "canExport": true,
    "canShare": false,
    "aiPermissions": {
      "allowModelTraining": false,
      "allowPersonalization": true,
      "allowInsightGeneration": true,
      "allowPredictiveAnalytics": true,
      "allowBehavioralAnalysis": false,
      "allowRiskAssessment": true,
      "allowProactiveOutreach": true,
      "allowEmergencyOverride": true,
      "requireExplanations": true,
      "explanationDetail": "moderate"
    },
    "accessSchedule": {
      "timezone": "America/New_York",
      "allowedDays": ["monday", "tuesday", "wednesday", "thursday", "friday"],
      "allowedHours": {
        "start": "08:00",
        "end": "18:00"
      }
    },
    "rateLimit": {
      "maxRequestsPerHour": 100,
      "maxRequestsPerDay": 1000
    }
  },
  "purpose": "Provide personalized health coaching and recommendations",
  "legalBasis": "consent",
  "expiresAt": "2025-10-05T00:00:00Z",
  "metadata": {
    "source": "onboarding",
    "userAgent": "Mozilla/5.0..."
  }
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "consent": {
    "id": "consent_1728123456_abc123",
    "userId": "user_123",
    "scope": "personal_ai",
    "status": "active",
    "version": "1.0.0",
    "permissions": { /* ... */ },
    "grantedAt": "2025-10-05T10:30:00Z",
    "effectiveFrom": "2025-10-05T10:30:00Z",
    "expiresAt": "2025-10-05T00:00:00Z",
    "grantedBy": "user_123",
    "grantMethod": "explicit_consent",
    "purpose": "Provide personalized health coaching and recommendations",
    "legalBasis": "consent"
  }
}
```

**Error Responses:**
- `400 Bad Request`: Invalid consent configuration
- `409 Conflict`: Consent already exists for this scope
- `429 Too Many Requests`: Rate limit exceeded

---

#### Revoke Consent

```http
DELETE /api/v1/consent/{consentId}
```

**Description:** Revoke an existing consent. Data access is immediately terminated.

**Request Body:**
```json
{
  "reason": "User requested revocation",
  "requestDataDeletion": false
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Consent revoked successfully",
  "revokedAt": "2025-10-05T14:30:00Z",
  "affectedAccessors": ["ai-wellness-bear", "caregiver-mom"]
}
```

---

#### Update Consent

```http
PATCH /api/v1/consent/{consentId}
```

**Description:** Modify existing consent permissions.

**Request Body:**
```json
{
  "permissions": {
    "dataAccess": {
      "medical_history": "summary"
    }
  },
  "expiresAt": "2026-01-01T00:00:00Z"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "consent": { /* updated consent object */ },
  "changesSummary": {
    "modified": ["dataAccess.medical_history", "expiresAt"],
    "modifiedAt": "2025-10-05T15:00:00Z"
  }
}
```

---

#### Get User Consents

```http
GET /api/v1/consent?scope={scope}&status={status}
```

**Query Parameters:**
- `scope` (optional): Filter by consent scope
- `status` (optional): Filter by status (active, revoked, expired)
- `includeExpired` (optional): Include expired consents (default: false)

**Response (200 OK):**
```json
{
  "success": true,
  "consents": [
    { /* consent object */ }
  ],
  "total": 3,
  "active": 2,
  "expired": 1
}
```

---

### 2. Data Access Control

#### Check Data Access

```http
POST /api/v1/consent/check-access
```

**Description:** Check if a data access request is permitted. Called before every data operation.

**Request Body:**
```json
{
  "accessorId": "ai-wellness-bear",
  "accessorType": "ai_agent",
  "dataCategory": "health_metrics",
  "operation": "read",
  "purpose": "Generate daily health summary",
  "sessionId": "session_abc123"
}
```

**Response (200 OK - Allowed):**
```json
{
  "allowed": true,
  "accessLevel": "detailed",
  "consentId": "consent_1728123456_abc123",
  "restrictions": {
    "maxRecords": 100,
    "fieldsAllowed": ["weight", "blood_pressure", "heart_rate"],
    "fieldsRestricted": ["ssn", "insurance_id"]
  }
}
```

**Response (200 OK - Denied):**
```json
{
  "allowed": false,
  "reason": "No active consent found",
  "suggestedAction": "Request user consent for health_metrics access",
  "consentRequestUrl": "/consent/request?scope=personal_ai&category=health_metrics"
}
```

---

#### Log Data Access

```http
POST /api/v1/consent/log-access
```

**Description:** Log a data access event (automatically called by data access layer).

**Request Body:**
```json
{
  "accessorId": "ai-wellness-bear",
  "accessorType": "ai_agent",
  "dataCategory": "health_metrics",
  "operation": "read",
  "success": true,
  "dataVolume": 2048,
  "purpose": "Generate daily health summary",
  "consentId": "consent_1728123456_abc123",
  "sessionId": "session_abc123",
  "metadata": {
    "recordIds": ["rec_1", "rec_2"],
    "queryDuration": 145
  }
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "logId": "log_1728123789_xyz789"
}
```

---

### 3. Specialized Consent Types

#### Grant Caregiver Consent

```http
POST /api/v1/consent/caregiver
```

**Request Body:**
```json
{
  "caregiverId": "caregiver_123",
  "relationship": "family",
  "tier": "interactive",
  "permissions": {
    "canViewProgress": true,
    "canViewHealthMetrics": true,
    "canViewConversations": false,
    "canViewMedications": true,
    "canSendMessages": true,
    "canSetReminders": true,
    "canModifyGoals": false,
    "canReceiveAlerts": true
  },
  "isEmergencyContact": true,
  "allowEmergencyOverride": true,
  "emergencyAccessDuration": 60,
  "notificationSettings": {
    "milestones": true,
    "concerns": true,
    "dailySummary": false,
    "weeklySummary": true,
    "criticalAlerts": true
  },
  "expiresAt": "2026-10-05T00:00:00Z"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "caregiverConsent": { /* full caregiver consent object */ },
  "invitationSent": true
}
```

---

#### Grant Clinician Consent

```http
POST /api/v1/consent/clinician
```

**Request Body:**
```json
{
  "clinicianId": "clinician_456",
  "clinicianNPI": "1234567890",
  "organization": "Mayo Clinic",
  "specialty": "Internal Medicine",
  "permissions": {
    "canViewFullMedicalHistory": true,
    "canViewAIRecommendations": true,
    "canModifyCarePlan": true,
    "canPrescribe": false,
    "canOrderTests": false,
    "validateAIRecommendations": true,
    "receiveAIAlerts": true
  },
  "treatmentRelationship": true,
  "hipaaAuthorizationSigned": true,
  "consentFormVersion": "2024.1",
  "expiresAt": "2026-10-05T00:00:00Z"
}
```

---

#### Grant Third-Party Integration Consent

```http
POST /api/v1/consent/integration
```

**Request Body:**
```json
{
  "integrationId": "integration_789",
  "integrationName": "Apple Health",
  "integrationType": "wearable",
  "allowDataImport": true,
  "allowDataExport": true,
  "sharedDataCategories": ["activity_logs", "health_metrics"],
  "syncFrequency": "realtime",
  "autoSync": true,
  "encryptionRequired": true,
  "anonymizeData": false,
  "thirdPartyTermsUrl": "https://apple.com/health/terms",
  "acceptedTermsVersion": "2024.2"
}
```

---

### 4. Emergency Override

#### Create Emergency Override

```http
POST /api/v1/consent/emergency-override
```

**Description:** Bypass normal consent for medical emergencies.

**Request Body:**
```json
{
  "emergencyType": "medical",
  "severity": "critical",
  "description": "Patient unconscious, suspected heart attack",
  "overrideScopes": ["personal_ai", "mayo_clinician"],
  "dataCategories": ["medical_history", "medications", "health_metrics"],
  "accessGrantedTo": ["clinician_456", "ems_789"],
  "durationMinutes": 60,
  "witnessedBy": ["caregiver_mom", "nurse_123"]
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "override": {
    "id": "override_emergency_123",
    "userId": "user_123",
    "triggeredBy": "clinician_456",
    "triggeredAt": "2025-10-05T16:45:00Z",
    "emergencyType": "medical",
    "severity": "critical",
    "overrideScope": ["personal_ai", "mayo_clinician"],
    "dataAccessed": ["medical_history", "medications", "health_metrics"],
    "accessGrantedTo": ["clinician_456", "ems_789"],
    "startTime": "2025-10-05T16:45:00Z",
    "endTime": "2025-10-05T17:45:00Z",
    "autoExpireAfterMinutes": 60,
    "resolved": false
  },
  "complianceAlert": "Compliance team has been notified"
}
```

---

#### Resolve Emergency Override

```http
POST /api/v1/consent/emergency-override/{overrideId}/resolve
```

**Request Body:**
```json
{
  "resolution": "Patient stabilized, emergency resolved",
  "documentationUrl": "https://ehr.mayo.clinic/incident/123"
}
```

---

### 5. Data Privacy Rights

#### Request Data Export

```http
POST /api/v1/consent/data-export
```

**Description:** GDPR/CCPA data portability right.

**Request Body:**
```json
{
  "format": "json" | "csv" | "pdf" | "fhir",
  "categories": ["all"] | ["health_metrics", "activity_logs"],
  "includeAIInsights": true,
  "includeAccessLogs": true,
  "deliveryMethod": "email" | "download_link"
}
```

**Response (202 Accepted):**
```json
{
  "success": true,
  "exportRequestId": "export_123",
  "estimatedCompletionTime": "2025-10-06T10:00:00Z",
  "message": "Your data export will be ready within 24 hours"
}
```

---

#### Request Data Deletion

```http
POST /api/v1/consent/data-deletion
```

**Description:** GDPR Right to Erasure / CCPA Right to Delete.

**Request Body:**
```json
{
  "withdrawalScope": "complete_account",
  "deleteCategories": ["all"],
  "confirmDeletion": true,
  "reason": "No longer using service"
}
```

**Response (202 Accepted):**
```json
{
  "success": true,
  "deletionRequestId": "deletion_456",
  "complianceDeadline": "2025-11-04T00:00:00Z",
  "message": "Your data deletion request will be processed within 30 days as required by GDPR",
  "retainedData": {
    "categories": ["audit_logs", "financial_records"],
    "reason": "Legal retention requirements",
    "retentionPeriod": "7 years"
  }
}
```

---

#### Get Data Sharing Summary

```http
GET /api/v1/consent/data-sharing-summary
```

**Description:** User-friendly overview of all data sharing.

**Response (200 OK):**
```json
{
  "success": true,
  "summary": {
    "userId": "user_123",
    "generatedAt": "2025-10-05T17:00:00Z",
    "activeShares": [
      {
        "scope": "personal_ai",
        "recipientId": "ai-wellness-bear",
        "recipientName": "Wellness Bear",
        "recipientType": "ai",
        "dataCategories": ["demographics", "health_metrics", "activity_logs"],
        "accessLevel": "detailed",
        "grantedAt": "2025-09-28T10:30:00Z",
        "expiresAt": null
      }
    ],
    "totalActiveConsents": 3,
    "totalDataAccessors": 2,
    "dataAccessLastMonth": 47,
    "expiringConsents": [],
    "unusedConsents": [],
    "suspiciousActivity": null
  }
}
```

---

### 6. Audit and Compliance

#### Get Access Logs

```http
GET /api/v1/consent/access-logs?from={timestamp}&to={timestamp}&accessor={id}
```

**Query Parameters:**
- `from` (required): Start timestamp (ISO 8601)
- `to` (required): End timestamp (ISO 8601)
- `accessor` (optional): Filter by accessor ID
- `category` (optional): Filter by data category
- `operation` (optional): Filter by operation type
- `success` (optional): Filter by success status

**Response (200 OK):**
```json
{
  "success": true,
  "logs": [
    {
      "id": "log_123",
      "userId": "user_123",
      "accessorId": "ai-wellness-bear",
      "accessorType": "ai_agent",
      "dataCategory": "health_metrics",
      "accessLevel": "detailed",
      "operation": "read",
      "method": "api",
      "timestamp": "2025-10-05T14:30:00Z",
      "success": true,
      "purpose": "Generate daily health summary",
      "consentId": "consent_abc123",
      "dataVolume": 2048,
      "ipAddress": "192.168.1.1",
      "sessionId": "session_xyz"
    }
  ],
  "total": 1,
  "page": 1,
  "pageSize": 50
}
```

---

#### Get Consent History

```http
GET /api/v1/consent/{consentId}/history
```

**Response (200 OK):**
```json
{
  "success": true,
  "history": [
    {
      "id": "history_1",
      "consentId": "consent_abc123",
      "userId": "user_123",
      "action": "granted",
      "newStatus": "active",
      "performedBy": "user_123",
      "performedAt": "2025-09-28T10:30:00Z",
      "ipAddress": "192.168.1.1"
    },
    {
      "id": "history_2",
      "consentId": "consent_abc123",
      "userId": "user_123",
      "action": "modified",
      "previousStatus": "active",
      "newStatus": "active",
      "changes": {
        "permissions.dataAccess.medical_history": {
          "from": "none",
          "to": "summary"
        }
      },
      "performedBy": "user_123",
      "performedAt": "2025-10-01T15:00:00Z",
      "reason": "User enabled medical history sharing"
    }
  ]
}
```

---

## Rate Limiting

All API endpoints are rate-limited:

- **Standard Users:** 1000 requests/hour
- **Emergency Override:** No rate limit
- **Audit Log Access:** 100 requests/hour

Rate limit headers:
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 847
X-RateLimit-Reset: 1728126000
```

---

## Error Responses

Standard error format:
```json
{
  "success": false,
  "error": {
    "code": "CONSENT_NOT_FOUND",
    "message": "The specified consent does not exist",
    "details": {
      "consentId": "consent_invalid"
    },
    "timestamp": "2025-10-05T17:30:00Z",
    "requestId": "req_xyz789"
  }
}
```

### Error Codes

- `CONSENT_NOT_FOUND`: Consent ID does not exist
- `CONSENT_ALREADY_EXISTS`: Duplicate consent for scope
- `CONSENT_EXPIRED`: Consent has expired
- `CONSENT_REVOKED`: Consent was revoked
- `ACCESS_DENIED`: Data access not permitted
- `INVALID_PERMISSIONS`: Invalid permission configuration
- `RATE_LIMIT_EXCEEDED`: Too many requests
- `TEMPORAL_RESTRICTION`: Access outside allowed time window
- `EMERGENCY_OVERRIDE_REQUIRED`: Normal consent insufficient, emergency override needed

---

## Webhooks

Register webhook endpoints to receive real-time notifications:

### Consent Events

- `consent.granted`: New consent granted
- `consent.revoked`: Consent revoked
- `consent.expired`: Consent expired
- `consent.modified`: Consent permissions updated
- `consent.expiring_soon`: Consent expiring within 7 days

### Access Events

- `access.denied`: Data access denied
- `access.suspicious`: Suspicious access pattern detected
- `access.rate_limit`: Rate limit exceeded

### Privacy Events

- `privacy.data_export_ready`: Data export ready for download
- `privacy.data_deleted`: Data deletion completed
- `privacy.emergency_override`: Emergency override activated

**Webhook Payload Example:**
```json
{
  "event": "consent.revoked",
  "timestamp": "2025-10-05T18:00:00Z",
  "userId": "user_123",
  "data": {
    "consentId": "consent_abc123",
    "scope": "caregiver",
    "revokedBy": "user_123",
    "affectedAccessors": ["caregiver_mom"]
  }
}
```

---

## Security

- **Authentication:** JWT tokens with user context
- **Authorization:** Role-based access control (RBAC)
- **Encryption:** TLS 1.3 for all API traffic
- **Data at Rest:** AES-256 encryption
- **Audit Logging:** All operations logged to immutable store
- **HIPAA Compliance:** BAA required for all integrations
- **GDPR Compliance:** Data processing agreements in place

---

## SDK Examples

### JavaScript/TypeScript

```typescript
import { ConsentAPI } from '@bearable/consent-sdk';

const client = new ConsentAPI({
  apiKey: process.env.BEARABLE_API_KEY,
  userId: 'user_123'
});

// Grant consent
const consent = await client.grantConsent({
  scope: 'personal_ai',
  permissions: {
    dataAccess: {
      health_metrics: 'detailed',
      activity_logs: 'full'
    },
    canView: true,
    canExport: true
  },
  purpose: 'Personalized health coaching'
});

// Check access before data operation
const accessCheck = await client.checkAccess({
  accessorId: 'ai-wellness-bear',
  accessorType: 'ai_agent',
  dataCategory: 'health_metrics',
  operation: 'read'
});

if (accessCheck.allowed) {
  // Proceed with data access
  const data = await fetchHealthMetrics();
}
```

---

## Compliance Notes

### HIPAA Requirements Met

✅ **Access Controls:** Granular permission system
✅ **Audit Logging:** Comprehensive audit trail (6-year retention)
✅ **Data Minimization:** Access level controls (summary, detailed, full)
✅ **Patient Rights:** Access, export, deletion, restriction
✅ **Emergency Access:** Override mechanism with compliance review
✅ **Business Associate Agreements:** Required for third-party integrations

### GDPR Requirements Met

✅ **Lawful Basis:** Explicit consent with purpose limitation
✅ **Right to Access:** Data sharing summary endpoint
✅ **Right to Portability:** Data export in standard formats
✅ **Right to Erasure:** Data deletion workflow (30-day deadline)
✅ **Right to Restrict:** Granular consent controls
✅ **Consent Withdrawal:** Instant revocation
✅ **Data Processing Records:** Audit logs and consent history

### CCPA Requirements Met

✅ **Right to Know:** Data sharing summary
✅ **Right to Delete:** Data deletion endpoint
✅ **Right to Opt-Out:** Consent revocation
✅ **Do Not Sell:** Third-party consent controls
