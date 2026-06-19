/**
 * Project Zeta — Relational-Document Database Type Engine
 *
 * Three-table schema with cryptographic integrity boundaries.
 * Zero implicit 'any'. All fields strictly typed.
 */

import type { TenantCompany } from './zeta';

// ─── TABLE 1: intern_dossiers ──────────────────────────────────────────────

/** Profile metadata block nested inside intern_dossiers */
export interface ProfileMetadata {
  full_name: string;
  corporate_email: string;
  joining_date: string; // ISO 8601
  onboarding_status: 'Active' | 'On Leave' | 'Terminated';
  department_role: string;
}

/** Financial ledger block — all monetary values stored as integers in cents */
export interface FinancialLedger {
  base_stipend: number;        // cents
  paid_to_date_total: number;  // cents
  pending_payout: number;      // cents
  bank_payout_status: 'Cleared' | 'Pending' | 'Hold';
}

/** CRM contribution metrics embedded inside dossier record */
export interface CrmContributionMetrics {
  associated_lead_ids: string[];
  total_contracts_value: number;    // USD integer
  ambassador_referrals_count: number;
}

/**
 * TABLE: intern_dossiers
 * Primary key: intern_id
 * One record per intern. Does NOT contain work logs (those live in work_history_logs table).
 */
export interface DossierRecord {
  intern_id: string;                       // PK — UUID-style ST-XXX
  tenant_company: TenantCompany;           // Tenant lock — immutable post-creation
  profile_metadata: ProfileMetadata;
  financial_ledger: FinancialLedger;
  crm_contribution_metrics: CrmContributionMetrics;
  created_at: string;                      // ISO 8601
  updated_at: string;                      // ISO 8601
}

// ─── TABLE 2: work_history_logs ────────────────────────────────────────────

/**
 * TABLE: work_history_logs
 * Primary key: task_id
 * Foreign key: intern_id → intern_dossiers.intern_id
 * One record per task/operation logged against an intern.
 */
export interface WorkLogRecord {
  task_id: string;          // PK
  intern_id: string;        // FK → intern_dossiers.intern_id
  timestamp_iso: string;    // ISO 8601
  project_title: string;
  description: string;
  efficiency_score: number; // 1-100 integer
  reviewer_notes?: string;
}

// ─── TABLE 3: secure_mailbox_queue ─────────────────────────────────────────

/**
 * TABLE: secure_mailbox_queue
 * Primary key: message_id
 * Foreign key: recipient_intern_id → intern_dossiers.intern_id
 */
export interface SecureMailRecord {
  message_id: string;                      // PK
  recipient_intern_id: string;             // FK → intern_dossiers.intern_id
  sender_role: 'HR' | 'Admin';
  subject_category: 'PAYROLL' | 'COMPLAINT' | 'PERFORMANCE';
  body_content_encrypted_string: string;   // AES-GCM ciphertext
  is_ephemeral: boolean;
  timestamp_iso: string;                   // ISO 8601
}

// ─── WAL SIMULATOR ─────────────────────────────────────────────────────────

/** Valid DB table names */
export type DbTableName = 'intern_dossiers' | 'work_history_logs' | 'secure_mailbox_queue';

/** Valid WAL operation codes */
export type WalOperation = 'INSERT' | 'UPDATE' | 'DELETE' | 'SEED';

/**
 * Write-Ahead Log entry — appended before every persistent commit.
 * Guarantees atomic integrity simulation.
 */
export interface WalEntry {
  wal_seq: number;          // Monotonically incrementing sequence number
  table_name: DbTableName;
  intern_id: string;        // Affected intern (or 'SYSTEM' for bulk ops)
  operation: WalOperation;
  timestamp_iso: string;
  tx_hash: string;          // 64-char hex signature
}

// ─── AGGREGATE OUTPUT ──────────────────────────────────────────────────────

/**
 * Output of getAggregatedDossier() — INNER JOIN result.
 * Merges intern_dossiers + work_history_logs + crm_contribution_metrics.
 * All instances are deep-frozen before being returned.
 */
export interface CompleteInternDossier {
  readonly intern_id: string;
  readonly tenant_company: TenantCompany;
  readonly profile_metadata: Readonly<ProfileMetadata>;
  readonly financial_ledger: Readonly<FinancialLedger>;
  readonly crm_contribution_metrics: Readonly<CrmContributionMetrics>;
  readonly work_history_logs: ReadonlyArray<Readonly<WorkLogRecord>>;
  readonly created_at: string;
  readonly updated_at: string;
  readonly average_efficiency_score: number; // Computed on-the-fly
}

// ─── LEGACY COMPAT ALIASES ────────────────────────────────────────────────
// Preserved for backward compatibility with store actions and UI components.

/** @deprecated Use WorkLogRecord. Alias kept for store/UI compat. */
export interface Task {
  task_id: string;
  timestamp_iso: string;
  project_title: string;
  description: string;
  efficiency_score: number;
  reviewer_notes?: string;
}

/** @deprecated Use DossierRecord. Alias kept for store/UI compat. */
export interface InternDossier {
  intern_id: string;
  tenant_company: TenantCompany;
  profile_metadata: ProfileMetadata;
  financial_ledger: FinancialLedger;
  work_history_stream: Task[];
  crm_contribution_metrics: CrmContributionMetrics;
}

/** Input schema for creating a new intern dossier */
export interface InitialProfile {
  full_name: string;
  corporate_email: string;
  department_role: string;
  base_stipend: number; // cents
}

// ─── DB EVENT BUS PAYLOAD ──────────────────────────────────────────────────

/** Payload dispatched on every successful DB commit */
export interface DbCommitEvent {
  wal_seq: number;
  table_name: DbTableName;
  intern_id: string;
  operation: WalOperation;
  tx_hash: string;
}
