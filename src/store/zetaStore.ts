import { create } from 'zustand';
import type {
  Lead,
  Contact,
  WarehouseAsset,
  Invoice,
  AgentLog,
  LeadAuditLog,
  PipelineStage,
  TenantCompany,
  InvoiceLineItem,
  ThoughtLedgerEntry,
  UserSession,
  Ambassador,
  InvoiceStatus,
  SecureMessage,
  UserRole
} from '../types/zeta';
import {
  loadDossiers,
  createInternDossier,
  appendWorkLog,
  updateStipendOrPayout,
} from '../db/dbManager';
import type { InternDossier, Task, InitialProfile } from '../types/database';

type MutationListener = (
  collection: string,
  action: string,
  delta: Record<string, unknown>
) => void;
let mutationListeners: MutationListener[] = [];

export const subscribeToMutations = (listener: MutationListener): (() => void) => {
  mutationListeners.push(listener);
  return () => {
    mutationListeners = mutationListeners.filter((l) => l !== listener);
  };
};

const notifyMutation = (
  collection: string,
  action: string,
  delta: Record<string, unknown>
): void => {
  // Use setTimeout to defer execution to avoid state mutation locks
  setTimeout(() => {
    mutationListeners.forEach((listener) => {
      try {
        listener(collection, action, delta);
      } catch (e) {
        console.error(e);
      }
    });
  }, 0);
};

// Helper to generate unique IDs
const generateId = (prefix: string): string => {
  return `${prefix}_${Math.random().toString(36).substring(2, 11)}`;
};

export interface ZetaState {
  currentUser: UserSession | null;
  activeSession: UserSession | null;
  rawLeads: Lead[];
  rawContacts: Contact[];
  rawAuditLogs: LeadAuditLog[];
  rawInvoices: Invoice[];
  leads: Lead[];
  contacts: Contact[];
  warehouseAssets: WarehouseAsset[];
  invoices: Invoice[];
  agentLogs: AgentLog[];
  auditLogs: LeadAuditLog[];
  agentThoughtLedger: ThoughtLedgerEntry[]; // Thought ledger state
  ambassadors: Ambassador[];
  secureMailboxQueue: SecureMessage[]; // Zero-trust secure communication queue
  internDossiers: InternDossier[];

  // CRM Actions
  addLead: (leadData: Omit<Lead, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateLeadStage: (id: string, stage: PipelineStage) => void;
  logLeadActivity: (id: string, activity: string) => void;

  // ERP & Finance Actions
  issueInvoice: (
    leadId: string,
    lineItemsData: Omit<InvoiceLineItem, 'id' | 'totalPrice'>[],
    ambassadorCode?: string
  ) => Invoice;
  restockAsset: (skuCode: string, quantity: number) => void; // OpsAgent stock mutation action
  restockSKU: (skuCode: string) => void;
  updateInvoiceStatus: (id: string, status: InvoiceStatus) => void;

  // Ambassador Actions
  addAmbassador: (name: string, code: string, tenant_company?: TenantCompany) => void;

  // Agent Logging
  addAgentLog: (logData: Omit<AgentLog, 'id' | 'timestamp'>) => void;
  addThoughtLedgerEntry: (entryData: Omit<ThoughtLedgerEntry, 'id' | 'timestamp'> & { id?: string | number }) => void; // Stream thought logs

  // Secure Mailbox Actions
  dispatchSecureMessage: (msg: Omit<SecureMessage, 'message_id' | 'timestamp_iso'>) => void;
  dismissSecureMessage: (message_id: string) => void;

  // Dossier Database Actions
  createInternDossierAction: (tenant: TenantCompany, profile: InitialProfile) => void;
  appendInternWorkLogAction: (internId: string, task: Omit<Task, 'task_id' | 'timestamp_iso'>) => void;
  updateInternFinancialsAction: (internId: string, field: 'base_stipend' | 'pending_payout', amount: number) => void;

  // Theme & Session Lock
  themeProfile: 'ONYX' | 'ALABASTER';
  sessionLocked: boolean;
  toggleTheme: () => void;
  lockSession: () => void;
  unlockSession: (password: string) => Promise<boolean>;

  // Auth Actions
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;

  // Getters / Selectors
  getLowStockAssets: () => WarehouseAsset[];
  getLeadsByTenant: (tenant: TenantCompany) => Lead[];
}


// ==========================================
// Rich Seed Data Initializers
// ==========================================

const seedLeads: Lead[] = [
  {
    id: 'lead_1',
    tenant_company: 'skill_tank',
    name: 'Aria Vance',
    email: 'aria.vance@skilltank.com',
    phone: '+1-555-0192',
    companyName: 'SkillTank Systems',
    pipelineStage: 'PROSPECT',
    dealVelocity: 2,
    potentialValue: 1200,
    createdAt: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
    activityLogs: ['Email sent: Introduction to CRM capabilities', 'Inbound contact request logged']
  },
  {
    id: 'lead_2',
    tenant_company: 'skill_tank',
    name: 'Beckett Thorne',
    email: 'b.thorne@cyberia.io',
    phone: '+1-555-0144',
    companyName: 'Cyberia Solutions',
    pipelineStage: 'QUALIFICATION',
    dealVelocity: 5,
    potentialValue: 4500,
    createdAt: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString(),
    activityLogs: ['Scoping call completed', 'Budget verified: $5k capacity']
  },
  {
    id: 'lead_3',
    tenant_company: 'skill_tank',
    name: 'Clara Sterling',
    email: 'clara@sterlingops.net',
    phone: '+1-555-0155',
    companyName: 'Sterling Operations',
    pipelineStage: 'CLOSED_WON',
    dealVelocity: 14,
    potentialValue: 15000,
    createdAt: new Date(Date.now() - 14 * 24 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
    activityLogs: ['Contract signed', 'Payment Terms agreed: Net 30']
  },
  {
    id: 'lead_4',
    tenant_company: 'vriddhi',
    name: 'Devon Brooks',
    email: 'dbrooks@vriddhi.org',
    phone: '+91-98765-43210',
    companyName: 'Vriddhi Logistics',
    pipelineStage: 'PROPOSAL',
    dealVelocity: 8,
    potentialValue: 8500,
    createdAt: new Date(Date.now() - 8 * 24 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 4 * 24 * 3600 * 1000).toISOString(),
    activityLogs: ['RFP document analyzed', 'Proposal v1 delivered to core team']
  },
  {
    id: 'lead_5',
    tenant_company: 'vriddhi',
    name: 'Elena Rostova',
    email: 'erostova@redstar.ru',
    phone: '+7-495-123-4567',
    companyName: 'Red Star Holdings',
    pipelineStage: 'NEGOTIATION',
    dealVelocity: 19,
    potentialValue: 12000,
    createdAt: new Date(Date.now() - 19 * 24 * 3600 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
    activityLogs: ['Legal review complete', 'Contract terms under discussion']
  },
  {
    id: 'lead_6',
    tenant_company: 'vriddhi',
    name: 'Fiona Gallagher',
    email: 'fiona@southside.com',
    phone: '+1-555-0177',
    companyName: 'Southside Bakery',
    pipelineStage: 'PROSPECT',
    dealVelocity: 1,
    potentialValue: 3200,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    activityLogs: ['Cold outreach: Client expressed logistics scaling issues']
  },
  {
    id: 'lead_7',
    tenant_company: 'tobofu',
    name: 'Gideon Vance',
    email: 'gvance@tobofufoods.com',
    phone: '+81-3-1234-5678',
    companyName: 'Tobofu Agri Group',
    pipelineStage: 'QUALIFICATION',
    dealVelocity: 3,
    potentialValue: 6000,
    createdAt: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
    activityLogs: ['Met at Agritech Tokyo 2026', 'Follow-up email sent']
  },
  {
    id: 'lead_8',
    tenant_company: 'tobofu',
    name: 'Harper Lee',
    email: 'harper.lee@tobofustores.com',
    phone: '+1-555-0188',
    companyName: 'Tobofu Distribution',
    pipelineStage: 'CLOSED_WON',
    dealVelocity: 25,
    potentialValue: 9500,
    createdAt: new Date(Date.now() - 25 * 24 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString(),
    activityLogs: ['Final sign-off complete', 'Awaiting initial warehouse sync']
  },
  {
    id: 'lead_9',
    tenant_company: 'tobofu',
    name: 'Ian Malcolm',
    email: 'imalcolm@jurassiclabs.io',
    phone: '+1-555-0100',
    companyName: 'Chaos Theory Labs',
    pipelineStage: 'PROSPECT',
    dealVelocity: 6,
    potentialValue: 1800,
    createdAt: new Date(Date.now() - 6 * 24 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 6 * 24 * 3600 * 1000).toISOString(),
    activityLogs: ['Introduction request received via partner portal']
  },
  {
    id: 'lead_10',
    tenant_company: 'promtal',
    name: 'Julia Roberts',
    email: 'j.roberts@promtalmedia.co',
    phone: '+44-20-7946-0192',
    companyName: 'Promtal Media',
    pipelineStage: 'PROPOSAL',
    dealVelocity: 11,
    potentialValue: 7200,
    createdAt: new Date(Date.now() - 11 * 24 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(),
    activityLogs: ['Detailed wireframes sent', 'Pricing grid updated']
  },
  {
    id: 'lead_11',
    tenant_company: 'promtal',
    name: 'Kai Chen',
    email: 'kai.chen@promtaltech.cn',
    phone: '+86-10-8765-4321',
    companyName: 'Promtal Tech Ltd',
    pipelineStage: 'NEGOTIATION',
    dealVelocity: 22,
    potentialValue: 11000,
    createdAt: new Date(Date.now() - 22 * 24 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
    activityLogs: ['Executive review of service agreement completed']
  },
  {
    id: 'lead_12',
    tenant_company: 'promtal',
    name: 'Luna Lovegood',
    email: 'luna@quibbler.net',
    phone: '+44-20-7946-0188',
    companyName: 'The Quibbler Publishing',
    pipelineStage: 'CLOSED_LOST',
    dealVelocity: 9,
    potentialValue: 5000,
    createdAt: new Date(Date.now() - 9 * 24 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString(),
    activityLogs: ['Lost to domestic service provider', 'Will follow up in 6 months']
  },
  {
    id: 'lead_13',
    tenant_company: 'maceco',
    name: 'Marcus Aurelius',
    email: 'maurelius@maceco.com',
    phone: '+39-06-123456',
    companyName: 'Maceco Roman Steel',
    pipelineStage: 'PROSPECT',
    dealVelocity: 4,
    potentialValue: 2500,
    createdAt: new Date(Date.now() - 4 * 24 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 4 * 24 * 3600 * 1000).toISOString(),
    activityLogs: ['Outreach message accepted', 'Initial company overview shared']
  },
  {
    id: 'lead_14',
    tenant_company: 'maceco',
    name: 'Nova Stark',
    email: 'nova.stark@starkindustries.com',
    phone: '+1-555-0900',
    companyName: 'Maceco Heavy Industries',
    pipelineStage: 'CLOSED_WON',
    dealVelocity: 30,
    potentialValue: 14000,
    createdAt: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
    activityLogs: ['Final PO received', 'Billing details updated']
  },
  {
    id: 'lead_15',
    tenant_company: 'maceco',
    name: 'Orion Pax',
    email: 'orion.pax@cybertron.com',
    phone: '+1-555-0199',
    companyName: 'Pax Logistics',
    pipelineStage: 'QUALIFICATION',
    dealVelocity: 7,
    potentialValue: 9800,
    createdAt: new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
    activityLogs: ['Demo call completed', 'Integration dependencies documented']
  }
];

const seedContacts: Contact[] = [
  {
    id: 'contact_1',
    tenant_company: 'skill_tank',
    firstName: 'Aria',
    lastName: 'Vance',
    email: 'aria.vance@skilltank.com',
    phone: '+1-555-0192',
    companyName: 'SkillTank Systems',
    role: 'Lead Project Architect',
    associatedLeadIds: ['lead_1'],
    createdAt: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString()
  },
  {
    id: 'contact_2',
    tenant_company: 'vriddhi',
    firstName: 'Devon',
    lastName: 'Brooks',
    email: 'dbrooks@vriddhi.org',
    phone: '+91-98765-43210',
    companyName: 'Vriddhi Logistics',
    role: 'Chief Logistics Coordinator',
    associatedLeadIds: ['lead_4'],
    createdAt: new Date(Date.now() - 8 * 24 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 4 * 24 * 3600 * 1000).toISOString()
  },
  {
    id: 'contact_3',
    tenant_company: 'tobofu',
    firstName: 'Harper',
    lastName: 'Lee',
    email: 'harper.lee@tobofustores.com',
    phone: '+1-555-0188',
    companyName: 'Tobofu Distribution',
    role: 'Director of Procurement',
    associatedLeadIds: ['lead_8'],
    createdAt: new Date(Date.now() - 25 * 24 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString()
  },
  {
    id: 'contact_4',
    tenant_company: 'promtal',
    firstName: 'Kai',
    lastName: 'Chen',
    email: 'kai.chen@promtaltech.cn',
    phone: '+86-10-8765-4321',
    companyName: 'Promtal Tech Ltd',
    role: 'Procurement Officer',
    associatedLeadIds: ['lead_11'],
    createdAt: new Date(Date.now() - 22 * 24 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString()
  },
  {
    id: 'contact_5',
    tenant_company: 'maceco',
    firstName: 'Nova',
    lastName: 'Stark',
    email: 'nova.stark@starkindustries.com',
    phone: '+1-555-0900',
    companyName: 'Maceco Heavy Industries',
    role: 'VP Operations',
    associatedLeadIds: ['lead_14'],
    createdAt: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString()
  }
];

const seedWarehouseAssets: WarehouseAsset[] = [
  {
    id: 'asset_1',
    skuCode: 'SKU-MON-27',
    name: 'UltraWide 27" Monitor',
    description: 'IPS QHD Resolution Office Monitor',
    quantity: 4, // Below Threshold (Alert state)
    restockThreshold: 5,
    isBelowThreshold: true,
    unitPrice: 299.99,
    warehouseLocation: 'A-Row-2-Shelf-4',
    updatedAt: new Date().toISOString()
  },
  {
    id: 'asset_2',
    skuCode: 'SKU-KEY-MX',
    name: 'Mechanical Keyboard MX',
    description: 'Hot-swappable tactile mechanical switches',
    quantity: 25,
    restockThreshold: 10,
    isBelowThreshold: false,
    unitPrice: 89.99,
    warehouseLocation: 'B-Row-1-Shelf-2',
    updatedAt: new Date().toISOString()
  },
  {
    id: 'asset_3',
    skuCode: 'SKU-LAP-Z1',
    name: 'Zeta Pro Laptop Z1',
    description: 'Core Ultra 7, 32GB RAM, 1TB SSD',
    quantity: 12,
    restockThreshold: 3,
    isBelowThreshold: false,
    unitPrice: 1499.00,
    warehouseLocation: 'Secured-Cage-1',
    updatedAt: new Date().toISOString()
  },
  {
    id: 'asset_4',
    skuCode: 'SKU-MOU-MS',
    name: 'Ergonomic Wireless Mouse',
    description: 'Precision ergonomic multi-device mouse',
    quantity: 40,
    restockThreshold: 15,
    isBelowThreshold: false,
    unitPrice: 59.99,
    warehouseLocation: 'B-Row-1-Shelf-5',
    updatedAt: new Date().toISOString()
  },
  {
    id: 'asset_5',
    skuCode: 'SKU-DES-ST',
    name: 'Electric Smart Standing Desk',
    description: 'Dual-motor dual-column standing desk frame',
    quantity: 8,
    restockThreshold: 2,
    isBelowThreshold: false,
    unitPrice: 450.00,
    warehouseLocation: 'C-Row-3-Pallet-1',
    updatedAt: new Date().toISOString()
  }
];

const seedAmbassadors: Ambassador[] = [
  { id: 'amb_1', code: 'SKILLTANK5', name: 'Skill Tank Partner', tenant_company: 'skill_tank', createdAt: new Date().toISOString() },
  { id: 'amb_2', code: 'VRIDDHI5', name: 'Vriddhi Logistics Partner', tenant_company: 'vriddhi', createdAt: new Date().toISOString() },
  { id: 'amb_3', code: 'TOBOFU5', name: 'Tobofu Agri Partner', tenant_company: 'tobofu', createdAt: new Date().toISOString() },
  { id: 'amb_4', code: 'PROMTAL5', name: 'Promtal Media Partner', tenant_company: 'promtal', createdAt: new Date().toISOString() },
  { id: 'amb_5', code: 'MACECO5', name: 'Maceco Roman Partner', tenant_company: 'maceco', createdAt: new Date().toISOString() },
];

// Helper to filter state based on active user role/tenant
const filterState = (
  currentUser: UserSession | null,
  rawLeads: Lead[],
  rawContacts: Contact[],
  rawInvoices: Invoice[],
  rawAuditLogs: LeadAuditLog[]
) => {
  if (!currentUser || currentUser.role === 'global_admin') {
    return {
      leads: rawLeads,
      contacts: rawContacts,
      invoices: rawInvoices,
      auditLogs: rawAuditLogs,
    };
  }

  const tenant = currentUser.tenantLock;
  if (!tenant) {
    return {
      leads: rawLeads,
      contacts: rawContacts,
      invoices: rawInvoices,
      auditLogs: rawAuditLogs,
    };
  }

  const filteredLeads = rawLeads.filter((l) => l.tenant_company === tenant);
  const filteredContacts = rawContacts.filter((c) => c.tenant_company === tenant);
  const filteredInvoices = rawInvoices.filter((i) => {
    const lead = rawLeads.find((l) => l.id === i.customerId);
    return lead ? lead.tenant_company === tenant : false;
  });
  const filteredAuditLogs = rawAuditLogs.filter((a) => a.tenant_company === tenant);

  return {
    leads: filteredLeads,
    contacts: filteredContacts,
    invoices: filteredInvoices,
    auditLogs: filteredAuditLogs,
  };
};

const getLocalStorageItem = <T>(key: string, defaultValue: T): T => {
  if (typeof window === 'undefined') return defaultValue;
  const val = localStorage.getItem(key);
  if (!val) return defaultValue;
  try {
    return JSON.parse(val);
  } catch {
    return defaultValue;
  }
};

const setLocalStorageItem = <T>(key: string, value: T): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(key, JSON.stringify(value));
};

// Central Zustand Store Creation
// ==========================================

export const useZetaStore = create<ZetaState>((set, get) => ({
  currentUser: null,
  activeSession: null,
  themeProfile: getLocalStorageItem('zeta_theme', 'ONYX'),
  sessionLocked: false,
  rawLeads: getLocalStorageItem('zeta_leads', seedLeads),
  rawContacts: getLocalStorageItem('zeta_contacts', seedContacts),
  rawAuditLogs: getLocalStorageItem('zeta_audit_logs', []),
  rawInvoices: getLocalStorageItem('zeta_invoices', []),
  leads: getLocalStorageItem('zeta_leads', seedLeads),
  contacts: getLocalStorageItem('zeta_contacts', seedContacts),
  warehouseAssets: getLocalStorageItem('zeta_warehouse_assets', seedWarehouseAssets),
  invoices: getLocalStorageItem('zeta_invoices', []),
  agentLogs: [],
  auditLogs: getLocalStorageItem('zeta_audit_logs', []),
  agentThoughtLedger: getLocalStorageItem('zeta_agent_thought_ledger', []),
  ambassadors: getLocalStorageItem('zeta_ambassadors', seedAmbassadors),
  secureMailboxQueue: getLocalStorageItem('zeta_secure_mailbox_queue', [
    {
      message_id: 'msg_seed_1',
      recipient_intern_id: 'ST-204',
      sender_role: 'HR',
      subject_category: 'PAYROLL',
      body_content_encrypted_string: 'Stipend adjustment calculated for standard 18% net payout details context.',
      is_ephemeral: false,
      timestamp_iso: new Date(Date.now() - 10 * 60000).toISOString()
    },
    {
      message_id: 'msg_seed_2',
      recipient_intern_id: 'ST-204',
      sender_role: 'Admin',
      subject_category: 'PERFORMANCE',
      body_content_encrypted_string: 'Outstanding design scoping deliverables noted. Performance index set to 9.2.',
      is_ephemeral: true,
      timestamp_iso: new Date(Date.now() - 5 * 60000).toISOString()
    }
  ]),
  internDossiers: loadDossiers(), // Sync: returns in-memory tables snapshot (may be empty on first boot before async init)


  // ----------------------------------------
  // CRM Actions
  // ----------------------------------------

  addLead: (leadData) => {
    const newLead: Lead = {
      ...leadData,
      id: generateId('lead'),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      activityLogs: leadData.activityLogs || []
    };
    set((state) => {
      const updatedRawLeads = [newLead, ...state.rawLeads];
      const filtered = filterState(state.currentUser, updatedRawLeads, state.rawContacts, state.rawInvoices, state.rawAuditLogs);
      setLocalStorageItem('zeta_leads', updatedRawLeads);
      return {
        rawLeads: updatedRawLeads,
        ...filtered
      };
    });
    notifyMutation('leads', 'merge_duplicates', { lead: newLead });
  },

  updateLeadStage: (id, stage) => {
    let leadToNotify: Lead | null = null;
    let prevStageToNotify: PipelineStage | null = null;
    set((state) => {
      const leadIndex = state.rawLeads.findIndex((l) => l.id === id);
      if (leadIndex === -1) return {};

      const currentRawLeads = [...state.rawLeads];
      const lead = currentRawLeads[leadIndex];
      const previousStage = lead.pipelineStage;

      // Only perform update if the stage is actually changing
      if (previousStage === stage) return {};

      leadToNotify = lead;
      prevStageToNotify = previousStage;

      const updatedLead: Lead = {
        ...lead,
        pipelineStage: stage,
        updatedAt: new Date().toISOString()
      };

      currentRawLeads[leadIndex] = updatedLead;

      // Create new LeadAuditLog entry
      const auditLogEntry: LeadAuditLog = {
        id: generateId('audit'),
        leadId: id,
        leadName: lead.name,
        tenant_company: lead.tenant_company,
        previousStage,
        newStage: stage,
        timestamp: new Date().toISOString()
      };

      const updatedRawAuditLogs = [auditLogEntry, ...state.rawAuditLogs];
      const filtered = filterState(state.currentUser, currentRawLeads, state.rawContacts, state.rawInvoices, updatedRawAuditLogs);

      setLocalStorageItem('zeta_leads', currentRawLeads);
      setLocalStorageItem('zeta_audit_logs', updatedRawAuditLogs);

      return {
        rawLeads: currentRawLeads,
        rawAuditLogs: updatedRawAuditLogs,
        ...filtered
      };
    });
    if (leadToNotify && prevStageToNotify) {
      notifyMutation('leads', 'update_stage', { leadId: id, previousStage: prevStageToNotify, newStage: stage, lead: leadToNotify });
    }
  },

  logLeadActivity: (id, activity) => {
    set((state) => {
      const leadIndex = state.rawLeads.findIndex((l) => l.id === id);
      if (leadIndex === -1) return {};

      const currentRawLeads = [...state.rawLeads];
      const lead = currentRawLeads[leadIndex];

      const currentLogs = lead.activityLogs || [];
      const updatedLead: Lead = {
        ...lead,
        activityLogs: [...currentLogs, activity],
        lastContactedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      currentRawLeads[leadIndex] = updatedLead;
      const filtered = filterState(state.currentUser, currentRawLeads, state.rawContacts, state.rawInvoices, state.rawAuditLogs);

      setLocalStorageItem('zeta_leads', currentRawLeads);

      return {
        rawLeads: currentRawLeads,
        ...filtered
      };
    });
  },

  // ----------------------------------------
  // ERP & Finance Actions
  // ----------------------------------------

  issueInvoice: (leadId, lineItemsData, ambassadorCode) => {
    const state = get();
    const lead = state.rawLeads.find((l) => l.id === leadId);

    if (!lead) {
      throw new Error(`Lead validation failure: Lead with ID "${leadId}" was not found.`);
    }

    if (lead.pipelineStage !== 'CLOSED_WON') {
      throw new Error(`Pipeline stage warning: Invoices can only be issued against 'CLOSED_WON' opportunities. Current stage is '${lead.pipelineStage}'.`);
    }

    // Map raw input details to fully computed InvoiceLineItems
    const computedLineItems: InvoiceLineItem[] = lineItemsData.map((item) => {
      const itemSubtotal = item.quantity * item.unitPrice;
      return {
        ...item,
        id: generateId('line_item'),
        totalPrice: Number(itemSubtotal.toFixed(2))
      };
    });

    // Subtotal mathematics
    const rawSubtotal = computedLineItems.reduce((acc, item) => acc + item.totalPrice, 0);
    const subtotal = Number(rawSubtotal.toFixed(2));

    // Discount calculations: 5% if ambassador code is validly provided and registered
    const cleanCode = (ambassadorCode || '').toUpperCase().trim();
    const isCodeActive = cleanCode ? state.ambassadors.some(
      (a) => a.code.toUpperCase().trim() === cleanCode
    ) : false;
    const rawDiscount = isCodeActive ? subtotal * 0.05 : 0;
    const discount = Number(rawDiscount.toFixed(2));

    // Tax calculation: 18% standard GST applied on net taxable amount
    const taxableAmount = subtotal - discount;
    const rawTaxAmount = taxableAmount * 0.18;
    const taxAmount = Number(rawTaxAmount.toFixed(2));

    // Absolute net totals
    const rawTotal = taxableAmount + taxAmount;
    const total = Number(rawTotal.toFixed(2));

    const newInvoice: Invoice = {
      id: generateId('inv'),
      invoiceNumber: `INV-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`,
      customerId: leadId,
      customerName: lead.name,
      issueDate: new Date().toISOString(),
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // Net 14 days standard terms
      lineItems: computedLineItems,
      subtotal,
      taxRate: 0.18,
      taxAmount,
      discount,
      total,
      status: 'SENT',
      ambassadorCode: isCodeActive ? cleanCode : undefined,
      createdAt: new Date().toISOString()
    };

    // Append to invoices array in state
    set((state) => {
      const updatedRawInvoices = [newInvoice, ...state.rawInvoices];
      const filtered = filterState(state.currentUser, state.rawLeads, state.rawContacts, updatedRawInvoices, state.rawAuditLogs);
      setLocalStorageItem('zeta_invoices', updatedRawInvoices);
      return {
        rawInvoices: updatedRawInvoices,
        ...filtered
      };
    });
    notifyMutation('invoices', 'approve_commission', { invoice: newInvoice });

    return newInvoice;
  },

  // ----------------------------------------
  // Multi-Agent Logger Actions
  // ----------------------------------------

  addAgentLog: (logData) => {
    const newLog: AgentLog = {
      ...logData,
      id: generateId('agent_log'),
      timestamp: new Date().toISOString()
    };
    set((state) => ({
      agentLogs: [newLog, ...state.agentLogs]
    }));
  },

  addThoughtLedgerEntry: (entryData) => {
    set((state) => {
      const entryId = entryData.id !== undefined ? entryData.id : (
        state.agentThoughtLedger.length > 0
          ? Math.max(...state.agentThoughtLedger.map((t) => typeof t.id === 'number' ? t.id : 0)) + 1
          : 1
      );
      const newEntry: ThoughtLedgerEntry = {
        ...entryData,
        id: entryId,
        timestamp: new Date().toISOString()
      } as ThoughtLedgerEntry;

      const updated = [newEntry, ...state.agentThoughtLedger];
      setLocalStorageItem('zeta_agent_thought_ledger', updated);

      return {
        agentThoughtLedger: updated
      };
    });
  },

  restockAsset: (skuCode, quantity) => {
    set((state) => {
      const assetIndex = state.warehouseAssets.findIndex((a) => a.skuCode === skuCode);
      if (assetIndex === -1) return {};

      const currentAssets = [...state.warehouseAssets];
      const asset = currentAssets[assetIndex];

      currentAssets[assetIndex] = {
        ...asset,
        quantity,
        isBelowThreshold: quantity <= asset.restockThreshold,
        updatedAt: new Date().toISOString()
      };

      setLocalStorageItem('zeta_warehouse_assets', currentAssets);

      return {
        warehouseAssets: currentAssets
      };
    });
    notifyMutation('inventory', 'trigger_restock', { skuCode, quantity });
  },

  restockSKU: (skuCode) => {
    let safetyCapacity = 0;
    set((state) => {
      const assetIndex = state.warehouseAssets.findIndex((a) => a.skuCode === skuCode);
      if (assetIndex === -1) return {};

      const currentAssets = [...state.warehouseAssets];
      const asset = currentAssets[assetIndex];
      safetyCapacity = asset.restockThreshold + 20;

      currentAssets[assetIndex] = {
        ...asset,
        quantity: safetyCapacity,
        isBelowThreshold: false,
        updatedAt: new Date().toISOString()
      };

      setLocalStorageItem('zeta_warehouse_assets', currentAssets);

      return {
        warehouseAssets: currentAssets
      };
    });
    if (safetyCapacity > 0) {
      notifyMutation('inventory', 'trigger_restock', { skuCode, quantity: safetyCapacity });
    }
  },

  // Secure Mailbox Actions
  dispatchSecureMessage: (msg) => {
    const newMsg: SecureMessage = {
      ...msg,
      message_id: 'msg_' + Math.random().toString(36).substring(2, 11),
      timestamp_iso: new Date().toISOString()
    };
    set((state) => {
      const updated = [...state.secureMailboxQueue, newMsg];
      setLocalStorageItem('zeta_secure_mailbox_queue', updated);
      return { secureMailboxQueue: updated };
    });
  },

  dismissSecureMessage: (message_id) => {
    set((state) => {
      const updated = state.secureMailboxQueue.filter((m) => m.message_id !== message_id);
      setLocalStorageItem('zeta_secure_mailbox_queue', updated);
      return { secureMailboxQueue: updated };
    });
  },

  toggleTheme: () => {
    set((state) => {
      const nextTheme = state.themeProfile === 'ONYX' ? 'ALABASTER' : 'ONYX';
      setLocalStorageItem('zeta_theme', nextTheme);
      
      // Update DOM class immediately
      if (typeof document !== 'undefined') {
        const root = document.documentElement;
        const body = document.body;
        if (nextTheme === 'ALABASTER') {
          root.classList.add('theme-alabaster');
          root.classList.remove('theme-onyx');
          body.classList.add('theme-alabaster');
          body.classList.remove('theme-onyx');
        } else {
          root.classList.add('theme-onyx');
          root.classList.remove('theme-alabaster');
          body.classList.add('theme-onyx');
          body.classList.remove('theme-alabaster');
        }
      }
      
      return { themeProfile: nextTheme };
    });
  },

  lockSession: () => {
    set({ sessionLocked: true });
  },

  unlockSession: async (password: string) => {
    const creds: Record<string, string> = {
      'admin@centle.com': 'Zeta_Admin_2026!',
      'rep@skilltank.com': 'SkillTank_Zeta_2026',
      'rep@vriddhi.com': 'Vriddhi_Zeta_2026',
      'rep@tobofu.com': 'Tobofu_Zeta_2026',
      'rep@promtal.com': 'Promtal_Zeta_2026',
      'rep@maceco.com': 'Maceco_Zeta_2026',
      'intern204@skilltank.com': 'SkillTank_Intern_2026',
      'intern305@maceco.com': 'Maceco_Intern_2026'
    };

    const email = get().currentUser?.email;
    if (!email) return false;
    const matchPassword = creds[email.toLowerCase().trim()];
    if (matchPassword && matchPassword === password) {
      set({ sessionLocked: false });
      return true;
    }
    return false;
  },

  // ----------------------------------------
  // Auth Actions
  // ----------------------------------------

  login: async (email, password) => {
    const creds: Record<string, { pass: string; name: string; tenant?: TenantCompany; role?: UserRole; internId?: string }> = {
      'admin@centle.com': { pass: 'Zeta_Admin_2026!', name: 'Global Admin' },
      'rep@skilltank.com': { pass: 'SkillTank_Zeta_2026', name: 'Skill Tank Systems', tenant: 'skill_tank' },
      'rep@vriddhi.com': { pass: 'Vriddhi_Zeta_2026', name: 'Vriddhi Logistics', tenant: 'vriddhi' },
      'rep@tobofu.com': { pass: 'Tobofu_Zeta_2026', name: 'Tobofu Agri Group', tenant: 'tobofu' },
      'rep@promtal.com': { pass: 'Promtal_Zeta_2026', name: 'Promtal Media', tenant: 'promtal' },
      'rep@maceco.com': { pass: 'Maceco_Zeta_2026', name: 'Maceco Heavy Ind.', tenant: 'maceco' },
      'intern204@skilltank.com': { pass: 'SkillTank_Intern_2026', name: 'Alex Intern', role: 'intern', internId: 'ST-204', tenant: 'skill_tank' },
      'intern305@maceco.com': { pass: 'Maceco_Intern_2026', name: 'Jordan Intern', role: 'intern', internId: 'ST-305', tenant: 'maceco' }
    };

    const userMatch = creds[email.toLowerCase().trim()];
    if (userMatch && userMatch.pass === password) {
      const role: UserRole = userMatch.role || (email.toLowerCase().trim() === 'admin@centle.com' ? 'global_admin' : 'tenant_rep');
      const session: UserSession = {
        email: email.toLowerCase().trim(),
        role,
        tenantLock: userMatch.tenant,
        displayName: userMatch.name,
        internId: userMatch.internId
      };

      set((state) => {
        const filtered = filterState(session, state.rawLeads, state.rawContacts, state.rawInvoices, state.rawAuditLogs);
        return {
          currentUser: session,
          activeSession: session,
          ...filtered
        };
      });
      return true;
    }

    // Append failed login context directly to agentThoughtLedger with [SECURITY_ALERT] tag
    set((state) => {
      const nextId = state.agentThoughtLedger.length > 0
        ? Math.max(...state.agentThoughtLedger.map((t) => typeof t.id === 'number' ? t.id : 0)) + 1
        : 1;
      const alertEntry: ThoughtLedgerEntry = {
        id: nextId,
        agentName: 'SecurityAlert',
        status: 'action_executed',
        timestamp: new Date().toISOString(),
        thoughtProcess: `[SECURITY_ALERT] Authentication failure vector identified. Unauthorized access attempt for user context: ${email}.`
      };
      return {
        agentThoughtLedger: [alertEntry, ...state.agentThoughtLedger]
      };
    });
    return false;
  },

  logout: () => {
    set((state) => {
      const filtered = filterState(null, state.rawLeads, state.rawContacts, state.rawInvoices, state.rawAuditLogs);
      return {
        currentUser: null,
        activeSession: null,
        ...filtered
      };
    });
  },

  addAmbassador: (name, code, tenant_company) => {
    const newAmbassador: Ambassador = {
      id: generateId('amb'),
      code: code.toUpperCase().trim(),
      name: name.trim(),
      tenant_company,
      createdAt: new Date().toISOString()
    };
    set((state) => {
      const updated = [...state.ambassadors, newAmbassador];
      setLocalStorageItem('zeta_ambassadors', updated);
      return { ambassadors: updated };
    });
    notifyMutation('payouts', 'approve_commission', { ambassador: newAmbassador });
  },

  updateInvoiceStatus: (id, status) => {
    set((state) => {
      const updatedRawInvoices = state.rawInvoices.map((inv) =>
        inv.id === id ? { ...inv, status } : inv
      );
      const filtered = filterState(state.currentUser, state.rawLeads, state.rawContacts, updatedRawInvoices, state.rawAuditLogs);
      setLocalStorageItem('zeta_invoices', updatedRawInvoices);
      return {
        rawInvoices: updatedRawInvoices,
        ...filtered
      };
    });
    notifyMutation('invoices', 'approve_commission', { invoiceId: id, status });
  },

  createInternDossierAction: (tenant: TenantCompany, profile: InitialProfile) => {
    createInternDossier(tenant, profile);
    const updatedDossiers = loadDossiers();
    set((state) => ({ ...state, internDossiers: updatedDossiers }));
    notifyMutation('dossiers', 'database_write_success', {
      internId: updatedDossiers[updatedDossiers.length - 1]?.intern_id ?? 'unknown',
      description: `Created new intern dossier folder for ${profile.full_name}`,
    } as Record<string, unknown>);
  },

  appendInternWorkLogAction: (internId: string, task: Omit<Task, 'task_id' | 'timestamp_iso'>) => {
    appendWorkLog(internId, task);
    const updatedDossiers = loadDossiers();
    set((state) => ({ ...state, internDossiers: updatedDossiers }));
    notifyMutation('dossiers', 'database_write_success', {
      internId,
      description: `Appended 1 task to work_history_stream`,
    } as Record<string, unknown>);
  },

  updateInternFinancialsAction: (internId: string, field: 'base_stipend' | 'pending_payout', amount: number) => {
    updateStipendOrPayout(internId, field, amount);
    const updatedDossiers = loadDossiers();
    set((state) => ({ ...state, internDossiers: updatedDossiers }));
    notifyMutation('dossiers', 'database_write_success', {
      internId,
      description: `Updated financial_ledger field ${field} to absolute value $${(amount / 100).toFixed(2)}`,
    } as Record<string, unknown>);
  },

  // ----------------------------------------
  // Getters / Selectors
  // ----------------------------------------

  getLowStockAssets: () => {
    return get().warehouseAssets.filter((asset) => asset.quantity < asset.restockThreshold);
  },

  getLeadsByTenant: (tenant) => {
    return get().leads.filter((lead) => lead.tenant_company === tenant);
  }
}));

if (typeof window !== 'undefined') {
  window.addEventListener('zeta-db-update', () => {
    const updatedDossiers = loadDossiers();
    useZetaStore.setState({ internDossiers: updatedDossiers });
  });
}


