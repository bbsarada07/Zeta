/**
 * Project Zeta — Agent Privacy Router & DB Telemetry Hub
 *
 * Responsibilities:
 * 1. Generate 256-bit transaction signatures for tamper-proof audit trails
 * 2. Encrypt / decrypt secure mailbox messages
 * 3. Redact confidential financial data from public thought ledger streams
 * 4. Route signed thought ledger entries through role-based privacy filters
 * 5. Subscribe to the DB event bus and broadcast WAL telemetry via OpsAgent
 */

import type { ThoughtLedgerEntry, AgentNameBadge } from '../types/zeta';
import { subscribeToDbCommits } from '../db/dbManager';
import type { DbCommitEvent } from '../types/database';

// ─── CRYPTO UTILITIES ──────────────────────────────────────────────────────

/**
 * Generate a mock 256-bit transaction signature to verify tamper-proof audit trails.
 */
export const generateTxHash = (): string => {
  const chars = '0123456789abcdef';
  let hash = '0x';
  for (let i = 0; i < 64; i++) {
    hash += chars[Math.floor(Math.random() * chars.length)];
  }
  return hash;
};

/**
 * Encrypt a plain text string into a mock encrypted format.
 * Used for securing secure mailbox message bodies before dispatch.
 */
export const mockEncryptString = (plainText: string): string => {
  return btoa(unescape(encodeURIComponent(plainText)))
    .split('')
    .reverse()
    .join('');
};

/**
 * Decrypt a mock encrypted string back to plain text.
 * Used for kinetic decryption animation in SecureMailbox.
 */
export const mockDecryptString = (cipherText: string): string => {
  try {
    const reversed = cipherText.split('').reverse().join('');
    return decodeURIComponent(escape(atob(reversed)));
  } catch {
    return 'Decryption Error: Invalid ciphertext token payload.';
  }
};

// ─── REDACTION ENGINE ──────────────────────────────────────────────────────

/**
 * Strips numeric stipend, payout, financial amounts, and ratings from log strings.
 * Enforces precise standard payroll event formatting for public agent logs.
 */
export const redactConfidentialData = (text: string): string => {
  if (!text) return text;

  // Enforce precise standard payroll event formatting:
  // "[OpsAgent] Compiled payroll processing event for Tenant: [SKILL_TANK] -> Intern ID: [ST-204]. [CONFIDENTIAL FINANCIAL DATA REDACTED]."
  if (text.includes('payroll processing event')) {
    const match = text.match(
      /\[OpsAgent\]\s*Compiled\s*payroll\s*processing\s*event\s*for\s*Tenant:\s*\[([^\]]+)\]\s*->\s*Intern\s*ID:\s*\[([^\]]+)\]/i
    );
    if (match) {
      return (
        `[OpsAgent] Compiled payroll processing event for Tenant: [${match[1].toUpperCase()}]` +
        ` -> Intern ID: [${match[2]}]. [CONFIDENTIAL FINANCIAL DATA REDACTED].`
      );
    }
  }

  let redacted = text;

  // Replace stipend / value keyword + adjacent numeric literals
  redacted = redacted.replace(
    /\b(stipend|salary|payout|payroll|rating|rate|potentialValue|value)\b.*?\b\d+(\.\d+)?\b/gi,
    (m) => m.replace(/\d+(\.\d+)?/g, '[CONFIDENTIAL FINANCIAL DATA REDACTED]')
  );

  // Redact any currency symbol followed by numbers
  redacted = redacted.replace(
    /\$\s*\d+(,\d{3})*(\.\d{2})?/g,
    '[CONFIDENTIAL FINANCIAL DATA REDACTED]'
  );

  return redacted;
};

// ─── PRIVACY ROUTER ────────────────────────────────────────────────────────

/**
 * Routes and signs thought ledger entries, applying redactions for non-admins.
 */
export const routePrivacyTelemetry = (
  entry: ThoughtLedgerEntry,
  role: string
): ThoughtLedgerEntry => {
  const signedEntry = {
    ...entry,
    tx_hash: entry.tx_hash ?? generateTxHash(),
  };

  if (role !== 'global_admin') {
    if (signedEntry.thoughtProcess) {
      signedEntry.thoughtProcess = redactConfidentialData(signedEntry.thoughtProcess);
    }
    if (signedEntry.message) {
      signedEntry.message = redactConfidentialData(signedEntry.message);
    }
  }

  return signedEntry;
};

// ─── LEGACY DOSSIER MUTATION HANDLER ──────────────────────────────────────

/**
 * Intercepts database dossier mutations and appends OpsAgent thought entries.
 * Called by zetaOrchestrator when a 'dossiers' collection mutation is detected.
 */
export const handleDatabaseMutation = (
  internId: string,
  description: string,
  addThoughtLedgerEntry: (entry: Omit<ThoughtLedgerEntry, 'id' | 'timestamp'> & { id?: string | number }) => void
): void => {
  const txHash = generateTxHash();
  const logMsg = `[OpsAgent] Synced dossier database mutation for Intern ${internId}. ${description}. Database write status: SUCCESS`;
  addThoughtLedgerEntry({
    agentName: 'OpsAgent' as AgentNameBadge,
    status: 'action_executed',
    thoughtProcess: logMsg,
    message: logMsg,
    modelUsed: 'gemini-2.5-flash',
    activeTenantTrack: 'global_admin',
    currentTask: 'Auditing database writes',
    tx_hash: txHash,
  });
};

// ─── DB EVENT BUS — OpsAgent WAL TELEMETRY ────────────────────────────────

type ThoughtLedgerAdder = (
  entry: Omit<ThoughtLedgerEntry, 'id' | 'timestamp'> & { id?: string | number }
) => void;

let _dbUnsubscribe: (() => void) | null = null;

/**
 * Subscribe the OpsAgent to the DB event bus.
 * Every cryptographically sealed WAL commit fires a telemetry entry:
 *
 * "[OpsAgent] Secure Transaction Committed. WAL Sequence #[ID].
 *  Table: [Table_Name] cryptographically sealed for Intern ID: [ID]. Status: 200 OK."
 *
 * Must be called once on orchestrator init, after the store is ready.
 */
export const subscribeToDbEvents = (addThoughtLedgerEntry: ThoughtLedgerAdder): void => {
  // Prevent duplicate subscriptions
  if (_dbUnsubscribe) return;

  _dbUnsubscribe = subscribeToDbCommits((event: DbCommitEvent) => {
    const msg =
      `[OpsAgent] Secure Transaction Committed. ` +
      `WAL Sequence #${event.wal_seq}. ` +
      `Table: [${event.table_name.toUpperCase()}] cryptographically sealed ` +
      `for Intern ID: [${event.intern_id}]. ` +
      `Status: 200 OK. tx_hash: ${event.tx_hash}`;

    addThoughtLedgerEntry({
      agentName: 'OpsAgent' as AgentNameBadge,
      status: 'action_executed',
      thoughtProcess: msg,
      message: msg,
      modelUsed: 'gemini-2.5-flash',
      activeTenantTrack: 'global_admin',
      currentTask: `WAL Commit — ${event.table_name} [${event.operation}]`,
      tx_hash: event.tx_hash,
    });
  });
};

/**
 * Unsubscribe the OpsAgent from the DB event bus (used on orchestrator teardown).
 */
export const unsubscribeFromDbEvents = (): void => {
  if (_dbUnsubscribe) {
    _dbUnsubscribe();
    _dbUnsubscribe = null;
  }
};
