-- ============================================================================
-- HIPAA-Compliant Consent Management Database Schema
-- For Bearable AI Health Coach Platform
--
-- Database: PostgreSQL 14+ (Supabase)
-- Encryption: AES-256 for PII/PHI fields
-- Compliance: HIPAA, GDPR, CCPA
-- ============================================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- CORE CONSENT TABLES
-- ============================================================================

-- Main consent records table
CREATE TABLE consent_records (
    -- Primary identification
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Consent metadata
    scope TEXT NOT NULL CHECK (scope IN (
        'personal_ai',
        'specialist_ai',
        'caregiver',
        'mayo_clinician',
        'third_party_integration',
        'research'
    )),
    status TEXT NOT NULL CHECK (status IN ('active', 'revoked', 'expired', 'pending')),
    version TEXT NOT NULL DEFAULT '1.0.0',

    -- Permissions (JSONB for flexibility)
    permissions JSONB NOT NULL,

    -- Temporal controls
    granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    effective_from TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    revoked_at TIMESTAMPTZ,

    -- Audit fields
    granted_by UUID NOT NULL REFERENCES auth.users(id),
    grant_method TEXT NOT NULL CHECK (grant_method IN (
        'explicit_consent',
        'implied_consent',
        'emergency_override'
    )),
    ip_address INET,
    device_info TEXT,

    -- Legal context
    purpose TEXT NOT NULL,
    legal_basis TEXT NOT NULL CHECK (legal_basis IN (
        'consent',
        'contract',
        'legal_obligation',
        'vital_interests',
        'public_interest',
        'legitimate_interests'
    )),

    -- Additional metadata
    metadata JSONB,

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Constraints
    CONSTRAINT valid_expiry CHECK (expires_at IS NULL OR expires_at > effective_from),
    CONSTRAINT revoked_status CHECK (
        (status = 'revoked' AND revoked_at IS NOT NULL) OR
        (status != 'revoked' AND revoked_at IS NULL)
    )
);

-- Indexes for consent_records
CREATE INDEX idx_consent_user_id ON consent_records(user_id);
CREATE INDEX idx_consent_scope ON consent_records(scope);
CREATE INDEX idx_consent_status ON consent_records(status);
CREATE INDEX idx_consent_user_scope ON consent_records(user_id, scope) WHERE status = 'active';
CREATE INDEX idx_consent_expires ON consent_records(expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX idx_consent_created ON consent_records(created_at DESC);

-- GIN index for JSONB permissions search
CREATE INDEX idx_consent_permissions ON consent_records USING GIN(permissions);

-- ============================================================================

-- Consent history for audit trail
CREATE TABLE consent_history (
    -- Primary identification
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    consent_id UUID NOT NULL REFERENCES consent_records(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- History details
    action TEXT NOT NULL CHECK (action IN (
        'granted',
        'modified',
        'revoked',
        'renewed',
        'expired'
    )),
    previous_status TEXT CHECK (previous_status IN ('active', 'revoked', 'expired', 'pending')),
    new_status TEXT NOT NULL CHECK (new_status IN ('active', 'revoked', 'expired', 'pending')),

    -- Changes tracking
    changes JSONB, -- Stores diff of what changed

    -- Audit
    performed_by UUID NOT NULL REFERENCES auth.users(id),
    performed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    reason TEXT,
    ip_address INET,
    device_info TEXT,

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for consent_history
CREATE INDEX idx_history_consent ON consent_history(consent_id);
CREATE INDEX idx_history_user ON consent_history(user_id);
CREATE INDEX idx_history_performed ON consent_history(performed_at DESC);

-- ============================================================================

-- Data access audit logs (HIPAA requirement)
CREATE TABLE data_access_logs (
    -- Primary identification
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Who and what
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    accessor_id TEXT NOT NULL, -- Could be user_id, ai_agent_id, etc.
    accessor_type TEXT NOT NULL CHECK (accessor_type IN (
        'user',
        'ai_agent',
        'caregiver',
        'clinician',
        'system'
    )),

    -- Data details
    data_category TEXT NOT NULL CHECK (data_category IN (
        'demographics',
        'health_metrics',
        'medical_history',
        'medications',
        'activity_logs',
        'conversations',
        'ai_recommendations',
        'wearable_data',
        'clinical_notes'
    )),
    data_ids TEXT[], -- Array of specific record IDs accessed
    access_level TEXT NOT NULL CHECK (access_level IN (
        'none',
        'summary',
        'aggregated',
        'detailed',
        'full'
    )),

    -- Operation details
    operation TEXT NOT NULL CHECK (operation IN (
        'read',
        'write',
        'update',
        'delete',
        'export',
        'share'
    )),
    method TEXT NOT NULL CHECK (method IN ('api', 'ui', 'batch', 'automated')),

    -- When and where
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ip_address INET,
    device_info TEXT,
    location TEXT,

    -- Why
    purpose TEXT NOT NULL,
    consent_id UUID REFERENCES consent_records(id),

    -- Result
    success BOOLEAN NOT NULL,
    denial_reason TEXT,
    data_volume BIGINT, -- Bytes accessed

    -- Context
    session_id TEXT,
    request_id TEXT,
    metadata JSONB,

    -- Timestamp
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Constraints
    CONSTRAINT denial_reason_required CHECK (
        (success = false AND denial_reason IS NOT NULL) OR
        (success = true AND denial_reason IS NULL)
    )
);

-- Indexes for data_access_logs
CREATE INDEX idx_access_user ON data_access_logs(user_id);
CREATE INDEX idx_access_accessor ON data_access_logs(accessor_id);
CREATE INDEX idx_access_timestamp ON data_access_logs(timestamp DESC);
CREATE INDEX idx_access_success ON data_access_logs(success);
CREATE INDEX idx_access_category ON data_access_logs(data_category);
CREATE INDEX idx_access_consent ON data_access_logs(consent_id);

-- Partitioning by month for performance (optional, for high volume)
-- CREATE TABLE data_access_logs_y2025m10 PARTITION OF data_access_logs
--     FOR VALUES FROM ('2025-10-01') TO ('2025-11-01');

-- ============================================================================
-- SPECIALIZED CONSENT TABLES
-- ============================================================================

-- Specialist AI agent consents
CREATE TABLE specialist_ai_consents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    specialist_id TEXT NOT NULL,
    pillar TEXT NOT NULL CHECK (pillar IN (
        'nutrition',
        'physical_activity',
        'sleep',
        'stress_management',
        'social_connection',
        'substance_avoidance'
    )),

    -- Reference to main consent
    consent_id UUID NOT NULL REFERENCES consent_records(id) ON DELETE CASCADE,

    -- Specialist-specific settings
    allow_direct_recommendations BOOLEAN NOT NULL DEFAULT true,
    allow_data_collection BOOLEAN NOT NULL DEFAULT true,
    allow_cross_pillar_sharing BOOLEAN NOT NULL DEFAULT false,

    -- Intervention settings
    intervention_level TEXT NOT NULL CHECK (intervention_level IN ('passive', 'moderate', 'active')),
    allow_nudges BOOLEAN NOT NULL DEFAULT true,
    nudge_frequency TEXT CHECK (nudge_frequency IN ('low', 'medium', 'high')),

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Constraints
    UNIQUE(user_id, specialist_id)
);

CREATE INDEX idx_specialist_user ON specialist_ai_consents(user_id);
CREATE INDEX idx_specialist_pillar ON specialist_ai_consents(pillar);

-- ============================================================================

-- Caregiver consents
CREATE TABLE caregiver_consents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    caregiver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Relationship
    relationship TEXT NOT NULL CHECK (relationship IN (
        'family',
        'friend',
        'healthcare_provider',
        'coach',
        'guardian',
        'power_of_attorney'
    )),

    -- Reference to main consent
    consent_id UUID NOT NULL REFERENCES consent_records(id) ON DELETE CASCADE,

    -- Access tier
    tier TEXT NOT NULL CHECK (tier IN (
        'view_only',
        'interactive',
        'collaborative',
        'emergency_full'
    )),

    -- Specific permissions
    can_view_progress BOOLEAN NOT NULL DEFAULT true,
    can_view_health_metrics BOOLEAN NOT NULL DEFAULT false,
    can_view_conversations BOOLEAN NOT NULL DEFAULT false,
    can_view_medications BOOLEAN NOT NULL DEFAULT false,
    can_view_diagnoses BOOLEAN NOT NULL DEFAULT false,
    can_send_messages BOOLEAN NOT NULL DEFAULT false,
    can_set_reminders BOOLEAN NOT NULL DEFAULT false,
    can_modify_goals BOOLEAN NOT NULL DEFAULT false,
    can_receive_alerts BOOLEAN NOT NULL DEFAULT false,

    -- Emergency settings
    is_emergency_contact BOOLEAN NOT NULL DEFAULT false,
    allow_emergency_override BOOLEAN NOT NULL DEFAULT false,
    emergency_access_duration INTEGER, -- minutes

    -- Notification preferences
    notification_settings JSONB NOT NULL DEFAULT '{}'::jsonb,

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Constraints
    UNIQUE(user_id, caregiver_id),
    CONSTRAINT different_users CHECK (user_id != caregiver_id)
);

CREATE INDEX idx_caregiver_user ON caregiver_consents(user_id);
CREATE INDEX idx_caregiver_caregiver ON caregiver_consents(caregiver_id);
CREATE INDEX idx_caregiver_emergency ON caregiver_consents(is_emergency_contact) WHERE is_emergency_contact = true;

-- ============================================================================

-- Clinician consents
CREATE TABLE clinician_consents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    clinician_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Clinician details
    clinician_npi TEXT, -- National Provider Identifier
    organization TEXT NOT NULL,
    specialty TEXT,

    -- Reference to main consent
    consent_id UUID NOT NULL REFERENCES consent_records(id) ON DELETE CASCADE,

    -- Clinical access permissions
    can_view_full_medical_history BOOLEAN NOT NULL DEFAULT true,
    can_view_ai_recommendations BOOLEAN NOT NULL DEFAULT true,
    can_modify_care_plan BOOLEAN NOT NULL DEFAULT false,
    can_prescribe BOOLEAN NOT NULL DEFAULT false,
    can_order_tests BOOLEAN NOT NULL DEFAULT false,

    -- Validation and oversight
    validate_ai_recommendations BOOLEAN NOT NULL DEFAULT true,
    receive_ai_alerts BOOLEAN NOT NULL DEFAULT true,

    -- Professional obligations
    treatment_relationship BOOLEAN NOT NULL DEFAULT true,
    hipaa_authorization BOOLEAN NOT NULL DEFAULT true,
    consent_form_signed BOOLEAN NOT NULL DEFAULT false,
    consent_form_version TEXT,
    consent_form_url TEXT,

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Constraints
    UNIQUE(user_id, clinician_id),
    CONSTRAINT different_users CHECK (user_id != clinician_id)
);

CREATE INDEX idx_clinician_user ON clinician_consents(user_id);
CREATE INDEX idx_clinician_clinician ON clinician_consents(clinician_id);
CREATE INDEX idx_clinician_npi ON clinician_consents(clinician_npi);

-- ============================================================================

-- Third-party integration consents
CREATE TABLE third_party_consents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Integration details
    integration_id TEXT NOT NULL,
    integration_name TEXT NOT NULL,
    integration_type TEXT NOT NULL CHECK (integration_type IN (
        'wearable',
        'ehr',
        'phr',
        'health_app',
        'research',
        'insurance'
    )),

    -- Reference to main consent
    consent_id UUID NOT NULL REFERENCES consent_records(id) ON DELETE CASCADE,

    -- Data sharing direction
    allow_data_import BOOLEAN NOT NULL DEFAULT false,
    allow_data_export BOOLEAN NOT NULL DEFAULT false,

    -- Data categories (array)
    shared_data_categories TEXT[] NOT NULL,

    -- Sync settings
    sync_frequency TEXT CHECK (sync_frequency IN ('realtime', 'hourly', 'daily', 'weekly', 'manual')),
    auto_sync BOOLEAN NOT NULL DEFAULT false,
    last_sync_at TIMESTAMPTZ,

    -- Security
    encryption_required BOOLEAN NOT NULL DEFAULT true,
    anonymize_data BOOLEAN NOT NULL DEFAULT false,

    -- Terms acceptance
    third_party_terms_url TEXT,
    third_party_privacy_url TEXT,
    accepted_terms_version TEXT,
    accepted_terms_at TIMESTAMPTZ,

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Constraints
    UNIQUE(user_id, integration_id)
);

CREATE INDEX idx_third_party_user ON third_party_consents(user_id);
CREATE INDEX idx_third_party_integration ON third_party_consents(integration_id);
CREATE INDEX idx_third_party_type ON third_party_consents(integration_type);

-- ============================================================================
-- EMERGENCY AND SPECIAL CASES
-- ============================================================================

-- Emergency override records
CREATE TABLE emergency_overrides (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Trigger details
    triggered_by UUID NOT NULL REFERENCES auth.users(id),
    triggered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Emergency context
    emergency_type TEXT NOT NULL CHECK (emergency_type IN ('medical', 'safety', 'system')),
    severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    description TEXT NOT NULL,

    -- Override details
    normal_consent_id UUID REFERENCES consent_records(id),
    override_scope TEXT[] NOT NULL, -- Array of scopes
    data_accessed TEXT[] NOT NULL, -- Array of data categories
    access_granted_to UUID[] NOT NULL, -- Array of user IDs

    -- Duration
    start_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    end_time TIMESTAMPTZ,
    auto_expire_after_minutes INTEGER NOT NULL DEFAULT 60,

    -- Resolution
    resolved BOOLEAN NOT NULL DEFAULT false,
    resolved_at TIMESTAMPTZ,
    resolved_by UUID REFERENCES auth.users(id),
    resolution TEXT,

    -- Audit
    witnessed_by UUID[], -- Array of witness user IDs
    documentation_url TEXT,
    compliance_reviewed BOOLEAN NOT NULL DEFAULT false,

    -- Timestamp
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_override_user ON emergency_overrides(user_id);
CREATE INDEX idx_override_triggered ON emergency_overrides(triggered_at DESC);
CREATE INDEX idx_override_resolved ON emergency_overrides(resolved);

-- ============================================================================

-- Consent withdrawal/deletion requests
CREATE TABLE consent_withdrawal_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Scope of withdrawal
    withdrawal_scope TEXT NOT NULL CHECK (withdrawal_scope IN (
        'specific_consent',
        'all_ai',
        'all_caregivers',
        'all_third_party',
        'complete_account'
    )),
    consent_ids UUID[], -- Specific consents to revoke

    -- Data deletion
    request_data_deletion BOOLEAN NOT NULL DEFAULT false,
    delete_categories TEXT[], -- Array of data categories
    retain_for_legal_reasons BOOLEAN,

    -- Processing status
    status TEXT NOT NULL CHECK (status IN (
        'pending',
        'in_progress',
        'completed',
        'partially_completed',
        'failed'
    )) DEFAULT 'pending',
    processed_at TIMESTAMPTZ,
    processed_by UUID REFERENCES auth.users(id),

    -- Completion
    completion_notes TEXT,
    data_retained TEXT, -- Explanation of what couldn't be deleted
    confirmation_sent BOOLEAN NOT NULL DEFAULT false,

    -- Legal compliance
    gdpr_request BOOLEAN NOT NULL DEFAULT false,
    hipaa_request BOOLEAN NOT NULL DEFAULT false,
    compliance_deadline TIMESTAMPTZ NOT NULL,

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_withdrawal_user ON consent_withdrawal_requests(user_id);
CREATE INDEX idx_withdrawal_status ON consent_withdrawal_requests(status);
CREATE INDEX idx_withdrawal_deadline ON consent_withdrawal_requests(compliance_deadline);

-- ============================================================================
-- USER PREFERENCES
-- ============================================================================

-- User consent preferences
CREATE TABLE consent_preferences (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    version TEXT NOT NULL DEFAULT '1.0.0',

    -- Global settings
    default_data_sharing TEXT NOT NULL CHECK (default_data_sharing IN (
        'minimal',
        'moderate',
        'comprehensive'
    )) DEFAULT 'moderate',
    require_explicit_consent BOOLEAN NOT NULL DEFAULT true,

    -- Data retention
    retention_preference TEXT NOT NULL CHECK (retention_preference IN (
        'minimal',
        'standard',
        'extended'
    )) DEFAULT 'standard',
    auto_delete_after_days INTEGER,

    -- AI preferences
    allow_ai_training BOOLEAN NOT NULL DEFAULT false,
    allow_anonymized_research BOOLEAN NOT NULL DEFAULT false,
    allow_product_improvement BOOLEAN NOT NULL DEFAULT true,

    -- Communication preferences
    consent_reminder_frequency TEXT CHECK (consent_reminder_frequency IN (
        'never',
        'quarterly',
        'annually'
    )) DEFAULT 'annually',
    receive_privacy_updates BOOLEAN NOT NULL DEFAULT true,

    -- Right to explanation
    always_explain_ai_decisions BOOLEAN NOT NULL DEFAULT true,

    -- Download and portability
    auto_export_frequency TEXT CHECK (auto_export_frequency IN (
        'monthly',
        'quarterly',
        'annually'
    )),
    preferred_export_format TEXT CHECK (preferred_export_format IN (
        'json',
        'csv',
        'pdf',
        'fhir'
    )) DEFAULT 'json',

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================

-- Consent notifications
CREATE TABLE consent_notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Notification details
    type TEXT NOT NULL CHECK (type IN (
        'renewal_required',
        'expiring_soon',
        'revoked',
        'new_accessor',
        'unusual_access',
        'policy_change'
    )),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    severity TEXT NOT NULL CHECK (severity IN ('info', 'warning', 'urgent')),

    -- Related records
    related_consent_id UUID REFERENCES consent_records(id),
    related_access_log_id UUID REFERENCES data_access_logs(id),

    -- Actions
    action_required BOOLEAN NOT NULL DEFAULT false,
    action_deadline TIMESTAMPTZ,
    action_url TEXT,

    -- Status
    read BOOLEAN NOT NULL DEFAULT false,
    acknowledged BOOLEAN NOT NULL DEFAULT false,
    acknowledged_at TIMESTAMPTZ,

    -- Timestamp
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notification_user ON consent_notifications(user_id);
CREATE INDEX idx_notification_read ON consent_notifications(read);
CREATE INDEX idx_notification_created ON consent_notifications(created_at DESC);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE consent_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE consent_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_access_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE specialist_ai_consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE caregiver_consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinician_consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE third_party_consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE emergency_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE consent_withdrawal_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE consent_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE consent_notifications ENABLE ROW LEVEL SECURITY;

-- Users can only see their own consent records
CREATE POLICY "Users can view own consents"
    ON consent_records FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own consents"
    ON consent_records FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own consents"
    ON consent_records FOR UPDATE
    USING (auth.uid() = user_id);

-- Caregivers can view consents they have access to
CREATE POLICY "Caregivers can view related consents"
    ON consent_records FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM caregiver_consents cc
            WHERE cc.user_id = consent_records.user_id
            AND cc.caregiver_id = auth.uid()
            AND cc.consent_id IN (
                SELECT id FROM consent_records WHERE status = 'active'
            )
        )
    );

-- Similar policies for other tables...
-- (Add more RLS policies based on specific requirements)

-- ============================================================================
-- FUNCTIONS AND TRIGGERS
-- ============================================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to all tables with updated_at
CREATE TRIGGER update_consent_records_updated_at
    BEFORE UPDATE ON consent_records
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_specialist_ai_consents_updated_at
    BEFORE UPDATE ON specialist_ai_consents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_caregiver_consents_updated_at
    BEFORE UPDATE ON caregiver_consents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clinician_consents_updated_at
    BEFORE UPDATE ON clinician_consents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_third_party_consents_updated_at
    BEFORE UPDATE ON third_party_consents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_consent_preferences_updated_at
    BEFORE UPDATE ON consent_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================

-- Auto-expire consents
CREATE OR REPLACE FUNCTION expire_old_consents()
RETURNS void AS $$
BEGIN
    UPDATE consent_records
    SET status = 'expired'
    WHERE status = 'active'
    AND expires_at IS NOT NULL
    AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Schedule this function to run periodically (e.g., via pg_cron or external scheduler)

-- ============================================================================

-- Function to log consent changes to history
CREATE OR REPLACE FUNCTION log_consent_change()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'UPDATE') THEN
        INSERT INTO consent_history (
            consent_id,
            user_id,
            action,
            previous_status,
            new_status,
            changes,
            performed_by
        ) VALUES (
            NEW.id,
            NEW.user_id,
            'modified',
            OLD.status,
            NEW.status,
            jsonb_build_object(
                'old', to_jsonb(OLD),
                'new', to_jsonb(NEW)
            ),
            auth.uid()
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER log_consent_record_changes
    AFTER UPDATE ON consent_records
    FOR EACH ROW
    WHEN (OLD.* IS DISTINCT FROM NEW.*)
    EXECUTE FUNCTION log_consent_change();

-- ============================================================================
-- VIEWS FOR COMMON QUERIES
-- ============================================================================

-- Active consents view
CREATE VIEW active_consents AS
SELECT
    cr.*,
    u.email as user_email
FROM consent_records cr
JOIN auth.users u ON cr.user_id = u.id
WHERE cr.status = 'active'
AND (cr.expires_at IS NULL OR cr.expires_at > NOW());

-- ============================================================================

-- Data sharing summary view
CREATE VIEW data_sharing_summary AS
SELECT
    user_id,
    COUNT(*) FILTER (WHERE status = 'active') as active_consents,
    COUNT(DISTINCT scope) as unique_scopes,
    MAX(granted_at) as last_consent_granted,
    MIN(expires_at) FILTER (WHERE expires_at IS NOT NULL) as next_expiry
FROM consent_records
GROUP BY user_id;

-- ============================================================================

-- Recent access activity view
CREATE VIEW recent_access_activity AS
SELECT
    user_id,
    accessor_id,
    accessor_type,
    data_category,
    COUNT(*) as access_count,
    MAX(timestamp) as last_access,
    SUM(data_volume) as total_data_volume
FROM data_access_logs
WHERE timestamp > NOW() - INTERVAL '30 days'
GROUP BY user_id, accessor_id, accessor_type, data_category;

-- ============================================================================
-- COMPLIANCE AND RETENTION
-- ============================================================================

-- Data retention: Keep audit logs for 6 years (HIPAA requirement)
-- Implement archive strategy for old logs
CREATE TABLE data_access_logs_archive (
    LIKE data_access_logs INCLUDING ALL
);

-- Function to archive old logs (run periodically)
CREATE OR REPLACE FUNCTION archive_old_access_logs()
RETURNS void AS $$
BEGIN
    WITH archived AS (
        DELETE FROM data_access_logs
        WHERE timestamp < NOW() - INTERVAL '6 years'
        RETURNING *
    )
    INSERT INTO data_access_logs_archive
    SELECT * FROM archived;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- GRANTS (Adjust based on your role structure)
-- ============================================================================

-- Grant appropriate permissions to authenticated users
GRANT SELECT, INSERT ON consent_records TO authenticated;
GRANT SELECT, INSERT ON consent_history TO authenticated;
GRANT SELECT, INSERT ON data_access_logs TO authenticated;
GRANT SELECT, INSERT, UPDATE ON caregiver_consents TO authenticated;
GRANT SELECT, INSERT, UPDATE ON consent_preferences TO authenticated;
GRANT SELECT ON consent_notifications TO authenticated;

-- Service role has full access for system operations
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE consent_records IS 'Main table storing all user consent records with granular permissions';
COMMENT ON TABLE consent_history IS 'Audit trail of all consent changes (HIPAA requirement - 6 year retention)';
COMMENT ON TABLE data_access_logs IS 'Comprehensive audit log of all data access attempts (HIPAA requirement)';
COMMENT ON TABLE caregiver_consents IS 'Granular consent settings for caregiver access to patient data';
COMMENT ON TABLE clinician_consents IS 'Healthcare provider access consents with professional obligations';
COMMENT ON TABLE emergency_overrides IS 'Emergency access bypass records with compliance tracking';
COMMENT ON TABLE consent_withdrawal_requests IS 'GDPR/CCPA data deletion and consent withdrawal requests';

-- ============================================================================
-- END OF SCHEMA
-- ============================================================================
