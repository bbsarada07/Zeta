/**
 * Project Zeta: Master Typing Engine
 * Core TypeScript definitions for the Unified CRM + ERP system.
 * Enforces zero implicit 'any'.
 */

/**
 * Tenant companies for multi-tenant isolation.
 */
export type TenantCompany = 'skill_tank' | 'vriddhi' | 'tobofu' | 'promtal' | 'maceco';

/**
 * Pipeline stages for lead conversion velocity.
 */
export type PipelineStage = 
  | 'PROSPECT'
  | 'QUALIFICATION'
  | 'PROPOSAL'
  | 'NEGOTIATION'
  | 'CLOSED_WON'
  | 'CLOSED_LOST';

/**
 * Audit log entry for tracking lead pipeline stage transitions.
 */
export interface LeadAuditLog {
  id: string;
  leadId: string;
  leadName: string;
  tenant_company: TenantCompany;
  previousStage: PipelineStage;
  newStage: PipelineStage;
  timestamp: string;
}

/**
 * Lead representation in the CRM system.
 * Tracks deal progression, velocity, and potential values.
 */
export interface Lead {
  id: string;
  tenant_company: TenantCompany; // Multi-tenant separation property
  name: string;
  email: string;
  phone?: string;
  companyName: string;
  pipelineStage: PipelineStage;
  dealVelocity: number; // Duration (e.g. days) active in current pipeline stage or velocity index score
  potentialValue: number; // Financial opportunity value in USD
  assignedAgentId?: string; // Orchestrator agent assigned to route/nurture this lead
  createdAt: string;
  updatedAt: string;
  lastContactedAt?: string;
  activityLogs?: string[]; // Call/email mock activity log history
}

/**
 * Contact representation associated with companies and leads.
 */
export interface Contact {
  id: string;
  tenant_company: TenantCompany; // Multi-tenant separation property
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  companyName: string;
  role?: string;
  associatedLeadIds: string[]; // List of related Lead IDs
  createdAt: string;
  updatedAt: string;
}

/**
 * Warehouse Asset item tracked by the ERP system.
 * Monitors quantity levels and triggers restock warning flags.
 */
export interface WarehouseAsset {
  id: string;
  skuCode: string; // Stock Keeping Unit code
  name: string;
  description?: string;
  quantity: number; // Current quantity in warehouse
  restockThreshold: number; // Flag threshold limit
  isBelowThreshold: boolean; // Flag indicating if quantity <= restockThreshold
  unitPrice: number;
  warehouseLocation?: string; // Bin/Row/Shelf identifier
  updatedAt: string;
}

/**
 * Individual line item inside an Invoice.
 * Forms the base of invoice calculations.
 */
export interface InvoiceLineItem {
  id: string;
  assetId?: string; // Reference to WarehouseAsset if applicable
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number; // Calculated value: quantity * unitPrice
}

/**
 * Invoice transaction status.
 */
export type InvoiceStatus = 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE' | 'VOID';

/**
 * Invoice records representing transactions.
 * Includes calculated line-item mathematics.
 */
export interface Invoice {
  id: string;
  invoiceNumber: string;
  customerId: string; // Associated lead/contact/company ID
  customerName: string;
  issueDate: string; // Transaction stamp
  dueDate: string;
  lineItems: InvoiceLineItem[];
  subtotal: number; // Sum of line item totalPrices
  taxRate: number; // Tax percentage (e.g. 0.08 for 8%)
  taxAmount: number; // Calculated: subtotal * taxRate
  discount: number; // Fixed discount amount
  total: number; // Calculated: subtotal + taxAmount - discount
  status: InvoiceStatus;
  ambassadorCode?: string;
  createdAt: string;
}

/**
 * Log entry created by the Multi-Agent Router.
 * Tracks active agent decisions, payload, and thought processes.
 */
export interface AgentLog {
  id: string;
  agentName: string; // Name of the executing Agent (e.g., 'LeadRouter', 'InventoryMonitor')
  timestamp: string; // Transaction stamp
  action: string; // Brief description of operation executed
  payload: Record<string, unknown>; // Operation payload (objects/records, avoids 'any')
  thoughtProcess: string; // Stringified engine "thought process" log (detailed logic rationale)
  status: 'SUCCESS' | 'FAILURE' | 'RUNNING';
}

/**
 * Valid agent identification badges.
 */
export type AgentNameBadge = 
  | 'SalesAgent' 
  | 'OpsAgent' 
  | 'StrategyAgent' 
  | 'SecurityAlert'
  | 'GrowthAgent'
  | 'LogisticsAgent'
  | 'NetworkAgent'
  | 'DirectorAgent';

/**
 * State status types for active streaming reasoning.
 */
export type AgentStatusType = 'inspecting' | 'action_executed' | 'idle';

/**
 * Thought ledger entry containing active stream reasoning logs and telemetry data.
 */
export interface ThoughtLedgerEntry {
  id: string | number;
  agentName: AgentNameBadge;
  status: AgentStatusType;
  timestamp: string;
  thoughtProcess: string;
  message?: string;
  modelUsed?: string;
  activeTenantTrack?: string;
  currentTask?: string;
  executionTimeMs?: number;
  mutations?: {
    targetCollection: 'leads' | 'inventory' | 'invoices' | 'payouts' | null;
    actionType: 'update_stage' | 'trigger_restock' | 'approve_commission' | 'merge_duplicates';
    payloadDelta: any;
  } | null;
  tx_hash?: string;
}

/**
 * Session roles within Project Zeta.
 */
export type UserRole = 'global_admin' | 'tenant_rep' | 'intern';

/**
 * Active user session structure.
 */
export interface UserSession {
  email: string;
  role: UserRole;
  tenantLock?: TenantCompany;
  displayName: string;
  internId?: string;
}

export interface Ambassador {
  id: string;
  code: string;
  name: string;
  tenant_company?: TenantCompany;
  createdAt: string;
}

/**
 * Encrypted communication message schema.
 */
export interface SecureMessage {
  id: string;
  sender: string;
  recipient: string;
  subject: string;
  body: string;
  timestamp: string;
  isRead: boolean;

  message_id: string;
  recipient_intern_id: string;
  sender_role: 'HR' | 'Admin' | string;
  subject_category: 'PAYROLL' | 'COMPLAINT' | 'PERFORMANCE' | string;
  body_content_encrypted_string: string;
  is_ephemeral: boolean;
  timestamp_iso: string;
}



