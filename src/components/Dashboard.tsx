import { useEffect, useRef, useState, useMemo } from 'react';
import {
  LayoutDashboard,
  Users,
  Package,
  FileText,
  Star,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  AlertTriangle,
  DollarSign,
  BarChart3,
  Zap,
  Activity,
  RefreshCw,
  LogOut,
  Search,
  Plus,
  X,
  Check,
  Ban,
  Send,
  Phone,
  Mail,
  User,
  PlusCircle,
  FileSignature,
  Lock
} from 'lucide-react';
import { useZetaStore } from '../store/zetaStore';
import { initZetaAgents, stopZetaAgents } from '../agents/zetaOrchestrator';
import { redactConfidentialData } from '../agents/agentRouter';
import SecureMailbox, { KineticTextScrambler } from './SecureMailbox';
import AdminHRPortal from './AdminHRPortal';
import type { Lead, WarehouseAsset, ThoughtLedgerEntry, Invoice, InvoiceStatus } from '../types/zeta';
import type { TenantCompany, PipelineStage } from '../types/zeta';

// ─── Types ────────────────────────────────────────────────────────────────────

type NavView = 'dashboard' | 'crm' | 'erp' | 'invoices' | 'ambassadors' | 'mailbox' | 'hr_portal';
type TenantFilter = TenantCompany | 'global';

// ─── Constants ────────────────────────────────────────────────────────────────

const TENANT_LABELS: Record<TenantFilter, string> = {
  global: 'Global Admin',
  skill_tank: 'Skill Tank',
  vriddhi: 'Vriddhi',
  tobofu: 'Tobofu',
  promtal: 'Promtal',
  maceco: 'Maceco',
};

const PIPELINE_STAGES: PipelineStage[] = [
  'PROSPECT',
  'QUALIFICATION',
  'PROPOSAL',
  'NEGOTIATION',
  'CLOSED_WON',
  'CLOSED_LOST'
];

const STAGE_COLORS: Record<PipelineStage, string> = {
  PROSPECT: 'text-onyx-accent-cyan border-onyx-accent-cyan/30 bg-onyx-accent-cyan/5',
  QUALIFICATION: 'text-onyx-accent-purple border-onyx-accent-purple/30 bg-onyx-accent-purple/5',
  PROPOSAL: 'text-onyx-accent-amber border-onyx-accent-amber/30 bg-onyx-accent-amber/5',
  NEGOTIATION: 'text-orange-400 border-orange-400/30 bg-orange-400/5',
  CLOSED_WON: 'text-onyx-accent-green border-onyx-accent-green/30 bg-onyx-accent-green/5',
  CLOSED_LOST: 'text-onyx-accent-rose border-onyx-accent-rose/30 bg-onyx-accent-rose/5',
};

const AGENT_BADGE_STYLES: Record<string, { onyx: string; alabaster: string }> = {
  growthagent: {
    onyx: 'text-sky-400 bg-sky-500/10 border border-sky-500/30 shadow-[0_0_8px_rgba(56,189,248,0.2)] hover:bg-sky-500/20 hover:border-sky-500/50 hover:shadow-[0_0_12px_rgba(56,189,248,0.4)] transition-all duration-150 cursor-pointer',
    alabaster: 'text-blue-900 bg-blue-900/10 border border-blue-900/30 hover:bg-blue-900/20 hover:border-blue-900/50 transition-all duration-150 cursor-pointer'
  },
  logisticsagent: {
    onyx: 'text-amber-400 bg-amber-500/10 border border-amber-500/30 shadow-[0_0_8px_rgba(245,158,11,0.2)] hover:bg-amber-500/20 hover:border-amber-500/50 hover:shadow-[0_0_12px_rgba(245,158,11,0.4)] transition-all duration-150 cursor-pointer',
    alabaster: 'text-amber-900 bg-amber-900/10 border border-amber-900/30 hover:bg-amber-900/20 hover:border-amber-900/50 transition-all duration-150 cursor-pointer'
  },
  networkagent: {
    onyx: 'text-purple-400 bg-purple-500/10 border border-purple-500/30 shadow-[0_0_8px_rgba(168,85,247,0.2)] hover:bg-purple-500/20 hover:border-purple-500/50 hover:shadow-[0_0_12px_rgba(168,85,247,0.4)] transition-all duration-150 cursor-pointer',
    alabaster: 'text-purple-900 bg-purple-900/10 border border-purple-900/30 hover:bg-purple-900/20 hover:border-purple-900/50 transition-all duration-150 cursor-pointer'
  },
  directoragent: {
    onyx: 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 shadow-[0_0_8px_rgba(16,185,129,0.2)] hover:bg-emerald-500/20 hover:border-emerald-500/50 hover:shadow-[0_0_12px_rgba(16,185,129,0.4)] transition-all duration-150 cursor-pointer',
    alabaster: 'text-emerald-950 bg-emerald-950/20 border border-emerald-900/30 hover:bg-emerald-950/30 hover:border-emerald-900/50 transition-all duration-150 cursor-pointer'
  },
  securityalert: {
    onyx: 'text-red-400 bg-red-500/10 border border-red-500/30 shadow-[0_0_8px_rgba(239,68,68,0.2)] hover:bg-red-500/20 hover:border-red-500/50 hover:shadow-[0_0_12px_rgba(239,68,68,0.4)] transition-all duration-150 cursor-pointer',
    alabaster: 'text-red-900 bg-red-900/10 border border-red-900/30 hover:bg-red-900/20 hover:border-red-900/50 transition-all duration-150 cursor-pointer'
  },

  // Backwards compatibility for old agents
  salesagent: {
    onyx: 'text-sky-400 bg-sky-500/10 border border-sky-500/30 shadow-[0_0_8px_rgba(56,189,248,0.2)] hover:bg-sky-500/20 hover:border-sky-500/50 hover:shadow-[0_0_12px_rgba(56,189,248,0.4)] transition-all duration-150 cursor-pointer',
    alabaster: 'text-blue-900 bg-blue-900/10 border border-blue-900/30 hover:bg-blue-900/20 hover:border-blue-900/50 transition-all duration-150 cursor-pointer'
  },
  opsagent: {
    onyx: 'text-amber-400 bg-amber-500/10 border border-amber-500/30 shadow-[0_0_8px_rgba(245,158,11,0.2)] hover:bg-amber-500/20 hover:border-amber-500/50 hover:shadow-[0_0_12px_rgba(245,158,11,0.4)] transition-all duration-150 cursor-pointer',
    alabaster: 'text-amber-900 bg-amber-900/10 border border-amber-900/30 hover:bg-amber-900/20 hover:border-amber-900/50 transition-all duration-150 cursor-pointer'
  },
  strategyagent: {
    onyx: 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 shadow-[0_0_8px_rgba(16,185,129,0.2)] hover:bg-emerald-500/20 hover:border-emerald-500/50 hover:shadow-[0_0_12px_rgba(16,185,129,0.4)] transition-all duration-150 cursor-pointer',
    alabaster: 'text-emerald-950 bg-emerald-950/20 border border-emerald-900/30 hover:bg-emerald-950/30 hover:border-emerald-900/50 transition-all duration-150 cursor-pointer'
  }
};

const STATUS_DOT: Record<string, string> = {
  inspecting: 'bg-onyx-accent-cyan',
  action_executed: 'bg-onyx-accent-green',
  idle: 'bg-onyx-muted',
};

// ─── Sub-components ───────────────────────────────────────────────────────────

const KpiCard = ({
  label,
  value,
  icon: Icon,
  color,
  sub,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
  sub?: string;
}) => {
  const themeProfile = useZetaStore((s) => s.themeProfile);
  const isOnyx = themeProfile === 'ONYX';
  return (
    <div className={`border rounded-xl p-6 flex flex-col gap-4 shadow-2xl transition-all duration-200 ${
      isOnyx 
        ? 'bg-[#09090b] text-[#fafafa] border-[#27272a] hover:border-zinc-500 shadow-zinc-950/50' 
        : 'bg-[#f4f4f5] text-[#09090b] border-[#e4e4e7] hover:border-zinc-300 shadow-zinc-200'
    }`}>
      <div className="flex items-center justify-between">
        <span className={`text-sm font-semibold tracking-wider uppercase ${
          isOnyx ? 'text-zinc-400' : 'text-zinc-600'
        }`}>{label}</span>
        <div className={`p-2 rounded-lg ${color}`}>
          <Icon size={16} />
        </div>
      </div>
      <div className={`text-3xl font-bold tracking-tight ${
        isOnyx ? 'text-[#fafafa]' : 'text-black'
      }`}>{value}</div>
      {sub && <div className={`text-xs font-medium ${
        isOnyx ? 'text-zinc-500' : 'text-zinc-600'
      }`}>{sub}</div>}
    </div>
  );
};

const LeadCard = ({ lead, onClick }: { lead: Lead; onClick: () => void }) => {
  const themeProfile = useZetaStore((s) => s.themeProfile);
  const isOnyx = themeProfile === 'ONYX';
  return (
    <div 
      onClick={onClick}
      className={`border rounded-xl p-5 mb-3 min-h-[90px] shadow-md transition-all duration-150 group cursor-pointer ${
        isOnyx 
          ? 'bg-[#000000] border-[#27272a] hover:border-zinc-400 text-[#fafafa] hover:bg-zinc-900/10' 
          : 'bg-[#ffffff] border-[#e4e4e7] hover:border-zinc-300 text-[#09090b] hover:bg-zinc-50'
      }`}
    >
      <div className="flex items-start justify-between gap-2.5">
        <div className="min-w-0">
          <p className={`text-sm font-semibold group-hover:text-onyx-accent-green transition-colors truncate ${
            isOnyx ? 'text-[#fafafa]' : 'text-black'
          }`}>{lead.name}</p>
          <p className={`text-xs truncate mt-1 ${
            isOnyx ? 'text-zinc-400' : 'text-zinc-600'
          }`}>{lead.companyName}</p>
        </div>
        <span className={`text-sm font-bold font-mono whitespace-nowrap ${isOnyx ? 'text-onyx-accent-green' : 'text-emerald-800'}`}>
          ${lead.potentialValue.toLocaleString()}
        </span>
      </div>
      <div className="mt-3 flex items-center gap-2">
        <span className={`text-xs font-mono font-bold ${
          isOnyx ? 'text-zinc-500' : 'text-zinc-600'
        }`}>D{lead.dealVelocity}</span>
        <div className={`h-1.5 flex-1 rounded-full overflow-hidden ${isOnyx ? 'bg-[#27272a]' : 'bg-[#e4e4e7]'}`}>
          <div
            className={`h-full rounded-full transition-all ${
              isOnyx
                ? 'bg-gradient-to-r from-onyx-accent-cyan to-onyx-accent-purple opacity-90'
                : 'bg-gradient-to-r from-cyan-600 to-purple-600 opacity-100'
            }`}
            style={{ width: `${Math.min((lead.dealVelocity / 30) * 100, 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
};

const ThoughtEntry = ({ entry, currentUser }: { entry: ThoughtLedgerEntry; currentUser: import('../types/zeta').UserSession | null }) => {
  const isGlobalAdmin = currentUser?.role === 'global_admin';
  const redactedText = redactConfidentialData(entry.thoughtProcess || '');
  const hasRedactedData = redactedText !== entry.thoughtProcess;
  const isWalCommit = entry.currentTask?.toLowerCase().includes('wal') || entry.thoughtProcess?.includes('WAL Sequence');
  const themeProfile = useZetaStore((s) => s.themeProfile);
  const isOnyx = themeProfile === 'ONYX';

  const [shouldScramble, setShouldScramble] = useState(isGlobalAdmin && hasRedactedData);
  const [scrambleTrigger, setScrambleTrigger] = useState(0);

  useEffect(() => {
    if (isGlobalAdmin && hasRedactedData) {
      setShouldScramble(true);
      const timer = setTimeout(() => {
        setShouldScramble(false);
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [entry.id, isGlobalAdmin, hasRedactedData, scrambleTrigger]);

  const rawText = entry.thoughtProcess || '';

  return (
    <div className={`py-2 border-b flex gap-2.5 items-start ${
      isOnyx ? 'border-[#27272a]/30' : 'border-[#e4e4e7]'
    } ${isWalCommit ? 'bg-emerald-950/10 border-l-2 border-l-emerald-800/40 -ml-4 pl-4' : ''}`}>
      <div className={`mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0 ${STATUS_DOT[entry.status] ?? 'bg-zinc-600'}`} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <span
            className={`text-[9px] font-bold px-1.5 py-0.5 rounded tracking-widest uppercase ${
              (() => {
                const key = (entry.agentName || '').toLowerCase();
                const style = AGENT_BADGE_STYLES[key];
                return style
                  ? (themeProfile === 'ALABASTER' ? style.alabaster : style.onyx)
                  : (themeProfile === 'ALABASTER' ? 'text-zinc-600 bg-zinc-100 border border-zinc-300' : 'text-zinc-400 bg-zinc-800 border border-zinc-700');
              })()
            }`}
          >
            {entry.agentName}
          </span>
          {isWalCommit && (
            <span className="text-[7px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-950/20 border border-emerald-900/40 px-1 rounded">
              WAL ✓
            </span>
          )}
          <span className={`text-[9px] font-mono ${isOnyx ? 'text-zinc-500' : 'text-zinc-600'}`}>
            {new Date(entry.timestamp).toLocaleTimeString()}
          </span>
          {entry.tx_hash && (
            <span className={`text-[7px] font-mono truncate max-w-[90px] ${isOnyx ? 'text-zinc-600' : 'text-zinc-500'}`} title={entry.tx_hash}>
              TX: {entry.tx_hash.slice(0, 12)}...
            </span>
          )}
          {isGlobalAdmin && hasRedactedData && !shouldScramble && (
            <button
              onClick={() => setScrambleTrigger((p) => p + 1)}
              className="text-[7px] text-onyx-accent-rose hover:text-rose-400 font-mono tracking-wider ml-auto uppercase border border-onyx-accent-rose/30 px-1.5 py-0.5 rounded bg-rose-950/20 transition-all"
            >
              Re-verify ↻
            </button>
          )}
        </div>
        <p className={`text-[10px] font-mono leading-relaxed whitespace-pre-wrap break-words ${
          isOnyx ? 'text-zinc-300' : 'text-zinc-700'
        }`}>
          {!isGlobalAdmin ? (
            redactedText
          ) : shouldScramble ? (
            <KineticTextScrambler
              encryptedText={redactedText}
              decryptedText={rawText}
              shouldScramble={true}
            />
          ) : (
            rawText
          )}
        </p>
      </div>
    </div>
  );
};

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export default function Dashboard() {
  const currentUser = useZetaStore((s) => s.currentUser);
  const logout = useZetaStore((s) => s.logout);
  const themeProfile = useZetaStore((s) => s.themeProfile);
  const toggleTheme = useZetaStore((s) => s.toggleTheme);
  const lockSession = useZetaStore((s) => s.lockSession);
  const isOnyx = themeProfile === 'ONYX';

  const [activeNav, setActiveNav] = useState<NavView>(
    currentUser?.role === 'intern' ? 'mailbox' : 'dashboard'
  );
  const [tenantFilter, setTenantFilter] = useState<TenantFilter>(
    currentUser?.role === 'tenant_rep' && currentUser?.tenantLock
      ? currentUser.tenantLock
      : 'global'
  );
  const [tenantDropOpen, setTenantDropOpen] = useState(false);
  const [isTerminalCollapsed, setIsTerminalCollapsed] = useState(false);
  const terminalRef = useRef<HTMLDivElement>(null);
  const terminalEndRef = useRef<HTMLDivElement>(null);

  // Store lists
  const leads = useZetaStore((s) => s.leads);
  const warehouseAssets = useZetaStore((s) => s.warehouseAssets);
  const invoices = useZetaStore((s) => s.invoices);
  const agentThoughtLedger = useZetaStore((s) => s.agentThoughtLedger);
  const ambassadors = useZetaStore((s) => s.ambassadors);

  // Store actions
  const getLowStockAssets = useZetaStore((s) => s.getLowStockAssets);
  const addLead = useZetaStore((s) => s.addLead);
  const updateLeadStage = useZetaStore((s) => s.updateLeadStage);
  const logLeadActivity = useZetaStore((s) => s.logLeadActivity);
  const issueInvoice = useZetaStore((s) => s.issueInvoice);
  const restockSKU = useZetaStore((s) => s.restockSKU);
  const restockAsset = useZetaStore((s) => s.restockAsset);
  const addAmbassador = useZetaStore((s) => s.addAmbassador);
  const updateInvoiceStatus = useZetaStore((s) => s.updateInvoiceStatus);

  // Modals UI States
  const [activeLeadForModal, setActiveLeadForModal] = useState<Lead | null>(null);
  const [isAddLeadModalOpen, setIsAddLeadModalOpen] = useState(false);
  const [assetForInvoiceModal, setAssetForInvoiceModal] = useState<WarehouseAsset | null>(null);
  const [activeInvoiceForModal, setActiveInvoiceForModal] = useState<Invoice | null>(null);
  const [isAddAmbassadorModalOpen, setIsAddAmbassadorModalOpen] = useState(false);

  // Search & Filter UI States
  const [crmSearch, setCrmSearch] = useState('');
  const [erpSearch, setErpSearch] = useState('');
  const [erpFilter, setErpFilter] = useState<'all' | 'low'>('all');
  const [invoiceSearch, setInvoiceSearch] = useState('');
  const [invoiceStatusFilter, setInvoiceStatusFilter] = useState<InvoiceStatus | 'ALL'>('ALL');

  // Input states for custom forms
  const [newLeadName, setNewLeadName] = useState('');
  const [newLeadEmail, setNewLeadEmail] = useState('');
  const [newLeadPhone, setNewLeadPhone] = useState('');
  const [newLeadCompany, setNewLeadCompany] = useState('');
  const [newLeadValue, setNewLeadValue] = useState(2500);
  const [newLeadTenant, setNewLeadTenant] = useState<TenantCompany>('skill_tank');

  const [invoiceLeadId, setInvoiceLeadId] = useState('');
  const [invoiceQty, setInvoiceQty] = useState(1);
  const [invoiceAmbassador, setInvoiceAmbassador] = useState('');

  const [newAmbName, setNewAmbName] = useState('');
  const [newAmbCode, setNewAmbCode] = useState('');
  const [newAmbTenant, setNewAmbTenant] = useState<TenantCompany | 'none'>('none');

  const [newActivityText, setNewActivityText] = useState('');
  const [manualRestockQty, setManualRestockQty] = useState<Record<string, number>>({});

  // Start agents on mount, stop on unmount
  useEffect(() => {
    initZetaAgents();
    return () => stopZetaAgents();
  }, []);

  // Filter agent ledger based on venture workspace context (isolation / global override rules)
  const filteredTerminalEntries = useMemo(() => {
    if (!currentUser || currentUser.role === 'global_admin') {
      return agentThoughtLedger;
    }
    const tenantLock = currentUser.tenantLock;
    return agentThoughtLedger.filter(
      (entry) => entry.activeTenantTrack === tenantLock
    );
  }, [agentThoughtLedger, currentUser]);

  // Smooth scroll down to the bottom anchor when new ledger entries arrive
  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [filteredTerminalEntries.length]);

  // ── Tenant isolation filters ──────────────────────────────────────────────
  const filteredLeads = useMemo(() => {
    const term = crmSearch.toLowerCase().trim();
    let list = tenantFilter === 'global' ? leads : leads.filter((l) => l.tenant_company === tenantFilter);
    if (term) {
      list = list.filter((l) => l.name.toLowerCase().includes(term) || l.companyName.toLowerCase().includes(term));
    }
    return list;
  }, [leads, tenantFilter, crmSearch]);

  const filteredAssets = useMemo(() => {
    const term = erpSearch.toLowerCase().trim();
    let list = erpFilter === 'low' ? getLowStockAssets() : warehouseAssets;
    if (term) {
      list = list.filter((a) => a.name.toLowerCase().includes(term) || a.skuCode.toLowerCase().includes(term));
    }
    return list;
  }, [warehouseAssets, erpSearch, erpFilter, getLowStockAssets]);

  const filteredInvoices = useMemo(() => {
    const term = invoiceSearch.toLowerCase().trim();
    let list = invoices;
    if (tenantFilter !== 'global') {
      list = invoices.filter((i) => {
        const lead = leads.find((l) => l.id === i.customerId);
        return lead ? lead.tenant_company === tenantFilter : false;
      });
    }
    if (invoiceStatusFilter !== 'ALL') {
      list = list.filter((i) => i.status === invoiceStatusFilter);
    }
    if (term) {
      list = list.filter((i) => i.invoiceNumber.toLowerCase().includes(term) || i.customerName.toLowerCase().includes(term));
    }
    return list;
  }, [invoices, leads, tenantFilter, invoiceSearch, invoiceStatusFilter]);

  // Dynamic calculations for KPIs
  const totalRevenue = useMemo(() => {
    return filteredInvoices.filter(i => i.status === 'PAID' || i.status === 'SENT').reduce((acc, inv) => acc + inv.total, 0);
  }, [filteredInvoices]);

  const wonLeadsCount = useMemo(() => {
    return filteredLeads.filter((l) => l.pipelineStage === 'CLOSED_WON').length;
  }, [filteredLeads]);

  const conversionRate = useMemo(() => {
    return filteredLeads.length > 0 ? ((wonLeadsCount / filteredLeads.length) * 100).toFixed(1) : '0.0';
  }, [filteredLeads, wonLeadsCount]);

  const lowStockCount = useMemo(() => {
    return getLowStockAssets().length;
  }, [getLowStockAssets]);

  const totalReferralPayouts = useMemo(() => {
    return filteredInvoices.reduce((acc, inv) => acc + inv.discount, 0);
  }, [filteredInvoices]);

  // Ambassador stats
  const ambassadorStats = useMemo(() => {
    return ambassadors.map((amb) => {
      const relatedInvoices = invoices.filter((inv) => inv.ambassadorCode === amb.code);
      const referrals = relatedInvoices.length;
      const salesGenerated = relatedInvoices.reduce((acc, inv) => acc + inv.total, 0);
      const discountsEarned = relatedInvoices.reduce((acc, inv) => acc + inv.discount, 0);
      return {
        ...amb,
        referrals,
        salesGenerated,
        discountsEarned
      };
    });
  }, [ambassadors, invoices]);

  // ── CRM Handlers ───────────────────────────────────────────────────────────
  const handleAddLeadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLeadName || !newLeadCompany || !newLeadEmail) {
      alert('Please fill out Lead Name, Company, and Email.');
      return;
    }
    
    // Auto tenant bind
    const leadTenant = currentUser?.role === 'tenant_rep' && currentUser?.tenantLock 
      ? currentUser.tenantLock 
      : newLeadTenant;

    addLead({
      name: newLeadName,
      email: newLeadEmail,
      phone: newLeadPhone || undefined,
      companyName: newLeadCompany,
      pipelineStage: 'PROSPECT',
      dealVelocity: 1,
      potentialValue: Number(newLeadValue) || 0,
      tenant_company: leadTenant
    });

    setIsAddLeadModalOpen(false);
    setNewLeadName('');
    setNewLeadEmail('');
    setNewLeadPhone('');
    setNewLeadCompany('');
    setNewLeadValue(2500);
  };

  const handleAddActivitySubmit = (e: React.FormEvent, leadId: string) => {
    e.preventDefault();
    if (!newActivityText.trim()) return;
    logLeadActivity(leadId, newActivityText.trim());
    setNewActivityText('');
    // Refresh modal details
    const updated = leads.find(l => l.id === leadId);
    if (updated) setActiveLeadForModal(updated);
  };

  // ── ERP Handlers ───────────────────────────────────────────────────────────
  const openInvoiceComposer = (asset: WarehouseAsset) => {
    setAssetForInvoiceModal(asset);
    setInvoiceQty(1);
    setInvoiceAmbassador('');
    // Prefill first closed won lead if available
    const closedWonLeads = filteredLeads.filter(l => l.pipelineStage === 'CLOSED_WON');
    if (closedWonLeads.length > 0) {
      setInvoiceLeadId(closedWonLeads[0].id);
    } else {
      setInvoiceLeadId('');
    }
  };

  const handleIssueInvoiceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assetForInvoiceModal || !invoiceLeadId) {
      alert('Please select a valid Closed Won lead.');
      return;
    }

    try {
      issueInvoice(
        invoiceLeadId,
        [{
          assetId: assetForInvoiceModal.id,
          description: assetForInvoiceModal.name,
          quantity: invoiceQty,
          unitPrice: assetForInvoiceModal.unitPrice
        }],
        invoiceAmbassador || undefined
      );

      // Decrement stock
      const newQty = Math.max(0, assetForInvoiceModal.quantity - invoiceQty);
      restockAsset(assetForInvoiceModal.skuCode, newQty);

      setAssetForInvoiceModal(null);
      alert('Invoice successfully generated and sent!');
    } catch (err: any) {
      alert(err.message || 'Error composing invoice');
    }
  };

  const handleManualRestock = (skuCode: string) => {
    const qty = manualRestockQty[skuCode];
    if (qty === undefined || isNaN(qty) || qty < 0) {
      alert('Please enter a valid stock quantity.');
      return;
    }
    restockAsset(skuCode, qty);
    setManualRestockQty(prev => ({ ...prev, [skuCode]: 0 }));
    alert(`SKU ${skuCode} stock set to ${qty}.`);
  };

  // ── Ambassador Handlers ────────────────────────────────────────────────────
  const handleAddAmbassadorSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAmbName || !newAmbCode) {
      alert('Please enter Ambassador Name and Code.');
      return;
    }

    const tenantBind = currentUser?.role === 'tenant_rep' && currentUser?.tenantLock
      ? currentUser.tenantLock
      : (newAmbTenant === 'none' ? undefined : newAmbTenant);

    addAmbassador(newAmbName, newAmbCode, tenantBind);
    setIsAddAmbassadorModalOpen(false);
    setNewAmbName('');
    setNewAmbCode('');
    setNewAmbTenant('none');
  };

  // ── Nav Items ──────────────────────────────────────────────────────────────
  const navItems = useMemo(() => {
    if (currentUser?.role === 'intern') {
      return [
        { id: 'mailbox' as NavView, label: 'Secure Mailbox', icon: FileText }
      ];
    }
    const items = [
      { id: 'dashboard' as NavView, label: 'Dashboard', icon: LayoutDashboard },
      { id: 'crm' as NavView, label: 'CRM', icon: Users },
      { id: 'erp' as NavView, label: 'ERP', icon: Package },
      { id: 'invoices' as NavView, label: 'Invoices', icon: FileText },
      { id: 'ambassadors' as NavView, label: 'Ambassadors', icon: Star },
      { id: 'mailbox' as NavView, label: 'Secure Mailbox', icon: FileText }
    ];
    if (currentUser?.role === 'global_admin') {
      items.push({ id: 'hr_portal' as NavView, label: 'HR Portal', icon: FileSignature });
    }
    return items;
  }, [currentUser]);

  return (
    <div className={`flex h-screen w-screen overflow-hidden font-sans select-none ${
      isOnyx ? 'bg-[#000000] text-[#fafafa] border-[#27272a]' : 'bg-[#ffffff] text-[#09090b] border-[#e4e4e7]'
    }`}>
      {/* ── Left Navigation Rail ─────────────────────────────────────────── */}
      <aside className={`w-52 flex-shrink-0 border-r flex flex-col ${
        isOnyx ? 'bg-[#000000] text-[#fafafa] border-[#27272a]' : 'bg-[#ffffff] text-[#09090b] border-[#e4e4e7]'
      }`}>
        {/* Logo */}
        <div className={`px-4 py-4 border-b flex items-center gap-2.5 ${isOnyx ? 'border-[#27272a]' : 'border-[#e4e4e7]'}`}>
          <div className={`w-7 h-7 rounded-md flex items-center justify-center border ${
            isOnyx ? 'bg-onyx-accent-green/10 border-onyx-accent-green/30' : 'bg-emerald-800/10 border-emerald-800/30'
          }`}>
            <Zap size={14} className={isOnyx ? 'text-onyx-accent-green' : 'text-emerald-800'} />
          </div>
          <span className={`text-sm font-bold tracking-tight ${isOnyx ? 'text-[#fafafa]' : 'text-black'}`}>ZETA</span>
          <span className={`text-[9px] ml-auto font-mono ${isOnyx ? 'text-zinc-500' : 'text-zinc-600'}`}>v1.0</span>
        </div>

        {/* Tenant Switcher */}
        {currentUser?.role !== 'intern' && (
          <div className={`px-3 py-3 border-b relative ${isOnyx ? 'border-[#27272a]' : 'border-[#e4e4e7]'}`}>
            <p className={`text-[9px] tracking-widest uppercase mb-1.5 ${isOnyx ? 'text-zinc-500' : 'text-zinc-600'}`}>Workspace</p>
            {currentUser?.role === 'tenant_rep' ? (
              <div className={`w-full flex items-center justify-between border rounded-md px-3 py-2 text-xs font-semibold select-none ${
                isOnyx ? 'bg-[#000000] border-[#27272a] text-[#fafafa]' : 'bg-[#ffffff] border-[#e4e4e7] text-[#09090b]'
              }`}>
                <span className="truncate">{TENANT_LABELS[tenantFilter]}</span>
                <span className="text-[8px] bg-emerald-950/40 border border-emerald-800/20 text-[#22c55e] font-mono px-1 rounded uppercase tracking-wider scale-95">
                  LOCKED
                </span>
              </div>
            ) : (
              <>
                <button
                  id="tenant-switcher-btn"
                  onClick={() => setTenantDropOpen((o) => !o)}
                  className={`w-full flex items-center justify-between border rounded-md px-3 py-2 text-xs font-semibold transition-colors duration-150 ${
                    isOnyx ? 'bg-[#000000] border-[#27272a] text-[#fafafa] hover:border-zinc-500' : 'bg-[#ffffff] border-[#e4e4e7] text-[#09090b] hover:border-zinc-400'
                  }`}
                >
                  <span className="truncate">{TENANT_LABELS[tenantFilter]}</span>
                  <ChevronDown
                    size={12}
                    className={`flex-shrink-0 ml-1 transition-transform duration-200 ${isOnyx ? 'text-zinc-500' : 'text-zinc-600'} ${tenantDropOpen ? 'rotate-180' : ''}`}
                  />
                </button>
                {tenantDropOpen && (
                  <div className={`absolute left-3 right-3 top-full mt-1 z-50 border rounded-md shadow-xl overflow-hidden ${
                    isOnyx ? 'bg-[#09090b] border-[#27272a]' : 'bg-[#f4f4f5] border-[#e4e4e7]'
                  }`}>
                    {(Object.keys(TENANT_LABELS) as TenantFilter[]).map((key) => (
                      <button
                        key={key}
                        onClick={() => {
                          setTenantFilter(key);
                          setTenantDropOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 text-xs transition-colors duration-100 ${
                          isOnyx ? 'hover:bg-[#000000]' : 'hover:bg-[#ffffff]'
                        } ${
                          tenantFilter === key
                            ? (isOnyx ? 'text-onyx-accent-green font-semibold' : 'text-emerald-800 font-semibold')
                            : (isOnyx ? 'text-zinc-300' : 'text-zinc-700')
                        }`}
                      >
                        {TENANT_LABELS[key]}
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Nav Items */}
        <nav className="flex-1 px-3 py-3 space-y-0.5">
          {navItems.map(({ id, label, icon: Icon }) => {
            const isActive = activeNav === id;
            return (
              <button
                key={id}
                id={`nav-${id}`}
                onClick={() => setActiveNav(id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-xs font-medium transition-all duration-150 ${
                  isActive
                    ? (isOnyx 
                        ? 'bg-onyx-accent-green/10 text-onyx-accent-green border border-onyx-accent-green/20' 
                        : 'bg-emerald-800/10 text-emerald-800 border border-emerald-800/20')
                    : (isOnyx 
                        ? 'text-zinc-400 hover:text-zinc-200 hover:bg-[#09090b] border border-transparent' 
                        : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100 border border-transparent')
                }`}
              >
                <Icon size={14} />
                {label}
                {isActive && (
                  <div className={`ml-auto w-1 h-4 rounded-full ${isOnyx ? 'bg-onyx-accent-green' : 'bg-emerald-800'}`} />
                )}
              </button>
            );
          })}
        </nav>

        {/* System status & Secure Actions */}
        <div className={`px-3 py-3 border-t mt-auto flex flex-col gap-1.5 ${isOnyx ? 'border-[#27272a]' : 'border-[#e4e4e7]'}`}>
          <div className="flex items-center gap-2 px-1 mb-1">
            <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${isOnyx ? 'bg-onyx-accent-green' : 'bg-emerald-800'}`} />
            <span className={`text-[10px] font-mono ${isOnyx ? 'text-zinc-500' : 'text-zinc-600'}`}>Agents running</span>
          </div>
          
          <button
            onClick={() => lockSession()}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-xs font-medium border border-transparent transition-all duration-150 text-left ${
              isOnyx 
                ? 'text-onyx-accent-cyan hover:bg-onyx-accent-cyan/5 hover:border-onyx-accent-cyan/20' 
                : 'text-cyan-700 hover:bg-cyan-700/5 hover:border-cyan-700/20'
            }`}
          >
            <Lock size={14} />
            <span>Lock Session</span>
          </button>

          <button
            onClick={() => logout()}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-xs font-medium border border-transparent transition-all duration-150 text-left ${
              isOnyx 
                ? 'text-onyx-accent-rose hover:bg-onyx-accent-rose/5 hover:border-onyx-accent-rose/20' 
                : 'text-rose-700 hover:bg-rose-700/5 hover:border-rose-700/20'
            }`}
          >
            <LogOut size={14} />
            <span>Secure Log Out</span>
          </button>
        </div>
      </aside>

      {/* ── Center Panel ─────────────────────────────────────────────────── */}
      <main className={`flex-1 flex flex-col min-w-0 overflow-hidden ${
        isOnyx ? 'bg-[#000000] text-[#fafafa] border-[#27272a]' : 'bg-[#ffffff] text-[#09090b] border-[#e4e4e7]'
      }`}>
        {/* Top bar */}
        <header className={`h-12 flex-shrink-0 border-b flex items-center px-5 gap-4 ${isOnyx ? 'border-[#27272a]' : 'border-[#e4e4e7]'}`}>
          <div className="flex-1">
            <span className={`text-xs font-mono ${isOnyx ? 'text-zinc-500' : 'text-zinc-600'}`}>
              {tenantFilter === 'global' ? 'All Tenants' : TENANT_LABELS[tenantFilter]}
            </span>
            <span className={`mx-2 ${isOnyx ? 'text-zinc-800' : 'text-zinc-300'}`}>·</span>
            <span className={`text-xs font-semibold capitalize tracking-widest font-mono ${isOnyx ? 'text-[#fafafa]' : 'text-black'}`}>{activeNav}</span>
          </div>
          <div className="flex items-center gap-4 text-[10px] font-mono">
            <button
              onClick={() => toggleTheme()}
              className={`hover:underline cursor-pointer tracking-widest uppercase font-bold ${
                isOnyx ? 'text-onyx-accent-green' : 'text-emerald-800'
              }`}
            >
              {themeProfile === 'ONYX' ? '[ ENV_RENDER: ONYX_DARK ]' : '[ ENV_RENDER: ALABASTER_LIGHT ]'}
            </button>
            <span className={`select-none ${isOnyx ? 'text-zinc-800' : 'text-zinc-300'}`}>|</span>
            <div className={`flex items-center gap-2 ${isOnyx ? 'text-zinc-500' : 'text-zinc-600'}`}>
              <RefreshCw size={10} className="animate-spin" style={{ animationDuration: '3s' }} />
              Live Sync
            </div>
          </div>
        </header>

        {/* KPI Grid */}
        <section className={`flex-shrink-0 p-4 border-b grid grid-cols-2 xl:grid-cols-4 gap-3 ${isOnyx ? 'border-[#27272a]' : 'border-[#e4e4e7]'}`}>
          <KpiCard
            label="Total Revenue"
            value={`$${totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
            icon={DollarSign}
            color="bg-onyx-accent-green/10 text-onyx-accent-green"
            sub={`${filteredInvoices.length} transactions`}
          />
          <KpiCard
            label="Funnel Conversion"
            value={`${conversionRate}%`}
            icon={TrendingUp}
            color="bg-onyx-accent-cyan/10 text-onyx-accent-cyan"
            sub={`${wonLeadsCount} of ${filteredLeads.length} leads won`}
          />
          <KpiCard
            label="Low Stock Alerts"
            value={lowStockCount}
            icon={AlertTriangle}
            color={lowStockCount > 0 ? 'bg-onyx-accent-rose/10 text-onyx-accent-rose' : 'bg-zinc-800 text-zinc-500'}
            sub="Items needing replenishment"
          />
          <KpiCard
            label="Referral Payouts"
            value={`$${totalReferralPayouts.toFixed(2)}`}
            icon={BarChart3}
            color="bg-onyx-accent-purple/10 text-onyx-accent-purple"
            sub="Ambassador discounts applied"
          />
        </section>

        {/* Dynamic Panel Renderer */}
        <div className="flex-1 overflow-auto p-6 min-h-0">
          
          {/* 1. Dashboard Tab */}
          {activeNav === 'dashboard' && (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 h-full">
              <div className="flex flex-col gap-6">
                
                {/* Pipeline Stages widget */}
                <div className={`border rounded-xl p-6 flex flex-col gap-4 shadow-2xl ${isOnyx ? 'bg-[#09090b] border-[#27272a] shadow-zinc-950/40' : 'bg-[#f4f4f5] border-[#e4e4e7] shadow-zinc-200'}`}>
                  <div className={`flex justify-between items-center border-b pb-3 ${isOnyx ? 'border-[#27272a]/50' : 'border-[#e4e4e7]'}`}>
                    <h3 className={`text-lg font-semibold tracking-wide uppercase ${isOnyx ? 'text-onyx-accent-cyan' : 'text-cyan-700'}`}>Pipeline Stages Distribution</h3>
                    <button onClick={() => setActiveNav('crm')} className={`text-sm hover:underline font-semibold ${isOnyx ? 'text-onyx-accent-cyan' : 'text-cyan-700'}`}>View Kanban</button>
                  </div>
                  <div className="space-y-4">
                    {PIPELINE_STAGES.map(stage => {
                      const count = filteredLeads.filter(l => l.pipelineStage === stage).length;
                      const percent = filteredLeads.length > 0 ? (count / filteredLeads.length) * 100 : 0;
                      return (
                        <div key={stage} className="space-y-2">
                          <div className="flex justify-between text-sm font-semibold">
                            <span className={isOnyx ? 'text-zinc-300' : 'text-zinc-700'}>{stage.replace('_', ' ')}</span>
                            <span className={`${isOnyx ? 'text-zinc-400' : 'text-zinc-600'} font-bold`}>{count} ({percent.toFixed(0)}%)</span>
                          </div>
                          <div className={`h-2.5 w-full border rounded overflow-hidden ${isOnyx ? 'bg-[#000000] border-[#27272a]' : 'bg-[#ffffff] border-[#e4e4e7]'}`}>
                            <div 
                              className={`h-full rounded transition-all duration-300 ${
                                isOnyx
                                  ? 'bg-gradient-to-r from-onyx-accent-cyan to-onyx-accent-purple opacity-90'
                                  : 'bg-gradient-to-r from-cyan-600 to-purple-600 opacity-100'
                              }`}
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Stuck & High-Value Deals Widget */}
                <div className={`border rounded-xl p-6 flex flex-col gap-4 shadow-2xl ${isOnyx ? 'bg-[#09090b] border-[#27272a] shadow-zinc-950/40' : 'bg-[#f4f4f5] border-[#e4e4e7] shadow-zinc-200'}`}>
                  <h3 className={`text-lg font-semibold tracking-wide uppercase border-b pb-2 ${isOnyx ? 'text-onyx-accent-rose border-[#27272a]/50' : 'text-rose-700 border-[#e4e4e7]'}`}>Stuck & High-Value Deals</h3>
                  <div className="max-h-[220px] overflow-y-auto space-y-3 pr-1">
                    {filteredLeads.filter(l => (l.potentialValue >= 10000) || (l.pipelineStage === 'PROPOSAL' || l.pipelineStage === 'NEGOTIATION')).length === 0 ? (
                      <div className={`text-center py-6 text-sm font-mono border border-dashed rounded ${isOnyx ? 'text-zinc-500 border-[#27272a]' : 'text-zinc-500 border-[#e4e4e7]'}`}>
                        No high-value/stuck opportunities logged.
                      </div>
                    ) : (
                      filteredLeads
                        .filter(l => (l.potentialValue >= 10000) || (l.pipelineStage === 'PROPOSAL' || l.pipelineStage === 'NEGOTIATION'))
                        .slice(0, 5)
                        .map(lead => (
                          <div key={lead.id} className={`flex justify-between items-center border p-3 rounded-lg transition-all ${isOnyx ? 'bg-[#000000] border-[#27272a]/40 hover:border-zinc-700' : 'bg-[#ffffff] border-[#e4e4e7] hover:border-zinc-400'}`}>
                            <div className="min-w-0">
                              <p className={`text-sm font-bold truncate ${isOnyx ? 'text-[#fafafa]' : 'text-black'}`}>{lead.name}</p>
                              <p className={`text-xs truncate ${isOnyx ? 'text-zinc-400' : 'text-zinc-600'}`}>{lead.companyName}</p>
                            </div>
                            <div className="flex items-center gap-3 font-mono">
                              <span className="text-xs text-onyx-accent-green font-bold">${lead.potentialValue.toLocaleString()}</span>
                              <button 
                                onClick={() => setActiveLeadForModal(lead)}
                                className={`text-xs font-bold border px-3 py-1.5 rounded uppercase ${
                                  isOnyx 
                                    ? 'bg-onyx-accent-cyan/15 hover:bg-onyx-accent-cyan/25 border-onyx-accent-cyan/30 text-onyx-accent-cyan' 
                                    : 'bg-cyan-600/10 hover:bg-cyan-600/20 border-cyan-600/30 text-cyan-700'
                                }`}
                              >
                                Action
                              </button>
                            </div>
                          </div>
                        ))
                    )}
                  </div>
                </div>

              </div>
              
              <div className="flex flex-col gap-6">
                
                {/* Low Stock Alerts widget */}
                <div className={`border rounded-xl p-6 flex flex-col gap-4 shadow-2xl ${isOnyx ? 'bg-[#09090b] border-[#27272a] shadow-zinc-950/40' : 'bg-[#f4f4f5] border-[#e4e4e7] shadow-zinc-200'}`}>
                  <div className={`flex justify-between items-center border-b pb-2 ${isOnyx ? 'border-[#27272a]/50' : 'border-[#e4e4e7]'}`}>
                    <h3 className={`text-lg font-semibold tracking-wide uppercase ${isOnyx ? 'text-onyx-accent-amber' : 'text-amber-700'}`}>Critical Warehouse Deficits</h3>
                    <button onClick={() => setActiveNav('erp')} className={`text-sm hover:underline font-semibold ${isOnyx ? 'text-onyx-accent-amber' : 'text-amber-700'}`}>View ERP</button>
                  </div>
                  <div className="max-h-[220px] overflow-y-auto space-y-3 pr-1">
                    {getLowStockAssets().length === 0 ? (
                      <div className={`text-center py-6 text-sm font-mono border border-dashed rounded flex flex-col items-center justify-center gap-1.5 ${
                        isOnyx 
                          ? 'text-onyx-accent-green border-onyx-accent-green/20 bg-onyx-accent-green/5' 
                          : 'text-emerald-800 border-emerald-800/20 bg-emerald-800/5'
                      }`}>
                        <Check size={18} />
                        All warehouse inventory levels healthy.
                      </div>
                    ) : (
                      getLowStockAssets().map(asset => (
                        <div key={asset.id} className={`flex justify-between items-center border p-3 rounded-lg transition-all ${isOnyx ? 'bg-[#000000] border-[#27272a]/40 hover:border-zinc-700' : 'bg-[#ffffff] border-[#e4e4e7] hover:border-zinc-400'}`}>
                          <div className="min-w-0">
                            <p className={`text-sm font-bold truncate ${isOnyx ? 'text-[#fafafa]' : 'text-black'}`}>{asset.name}</p>
                            <p className={`text-xs ${isOnyx ? 'text-zinc-400' : 'text-zinc-600'}`}>{asset.skuCode} · Location: {asset.warehouseLocation}</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-bold font-mono text-onyx-accent-rose tabular-nums">{asset.quantity} / {asset.restockThreshold}</span>
                            <button 
                              onClick={() => {
                                restockSKU(asset.skuCode);
                                alert(`Restocked ${asset.skuCode} to safety threshold.`);
                              }}
                              className={`text-xs border px-3 py-1.5 rounded font-bold uppercase transition-colors ${
                                isOnyx
                                  ? 'bg-onyx-accent-amber/15 hover:bg-onyx-accent-amber/25 border-onyx-accent-amber/30 text-onyx-accent-amber'
                                  : 'bg-amber-600/10 hover:bg-amber-600/20 border-amber-600/30 text-amber-700'
                              }`}
                            >
                              Replenish
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
 
                {/* Dashboard live terminal stream */}
                <div className={`border rounded-xl p-6 flex flex-col gap-4 flex-1 min-h-[200px] shadow-2xl ${isOnyx ? 'bg-[#09090b] border-[#27272a] shadow-zinc-950/40' : 'bg-[#f4f4f5] border-[#e4e4e7] shadow-zinc-200'}`}>
                  <div className={`flex items-center justify-between border-b pb-2 ${isOnyx ? 'border-[#27272a]/50' : 'border-[#e4e4e7]'}`}>
                    <h3 className={`text-lg font-semibold tracking-wide uppercase ${isOnyx ? 'text-onyx-accent-green' : 'text-emerald-800'}`}>Live Agent Diagnostics Stream</h3>
                    <span className={`text-xs font-semibold ${isOnyx ? 'text-zinc-400' : 'text-zinc-500'}`}>{filteredTerminalEntries.length} entries</span>
                  </div>
                  <div className={`flex-1 rounded-lg p-4 font-mono text-sm overflow-y-auto max-h-[250px] space-y-2 border ${
                    isOnyx ? 'bg-[#000000] text-zinc-400 border-[#27272a]' : 'bg-[#ffffff] text-zinc-800 border-[#e4e4e7]'
                  }`} ref={terminalRef}>
                    {filteredTerminalEntries.length === 0 ? (
                      <div className="text-center text-onyx-muted py-10 animate-pulse">Waiting for autonomic loop...</div>
                    ) : (
                      filteredTerminalEntries.slice(0, 12).map(entry => {
                        const isWal = entry.currentTask?.toLowerCase().includes('wal') || entry.thoughtProcess?.includes('WAL Sequence');
                        const displayText = currentUser?.role !== 'global_admin'
                          ? redactConfidentialData(entry.thoughtProcess)
                          : entry.thoughtProcess;
                        return (
                          <div key={entry.id} className={`pb-2 border-b ${
                            isOnyx ? 'border-zinc-900/50' : 'border-zinc-200'
                          } ${isWal ? 'bg-emerald-950/10 -mx-3 px-3 border-l-2 border-l-emerald-800/40' : ''}`}>
                            <div className="flex gap-2 mb-1 items-center flex-wrap">
                              <span className={`px-2 py-1 rounded uppercase font-bold text-[10px] ${
                                (() => {
                                  const key = (entry.agentName || '').toLowerCase();
                                  const style = AGENT_BADGE_STYLES[key];
                                  return style
                                    ? (themeProfile === 'ALABASTER' ? style.alabaster : style.onyx)
                                    : (themeProfile === 'ALABASTER' ? 'text-zinc-600 bg-zinc-100 border border-zinc-300' : 'text-zinc-400 bg-zinc-800 border border-zinc-700');
                                })()
                              }`}>
                                {entry.agentName}
                              </span>
                              {isWal && (
                                <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">WAL</span>
                              )}
                              <span className={`text-xs ${isOnyx ? 'text-zinc-600' : 'text-zinc-500'}`}>{new Date(entry.timestamp).toLocaleTimeString()}</span>
                              {entry.tx_hash && (
                                <span className={`text-[10px] font-mono ml-auto ${isOnyx ? 'text-zinc-600' : 'text-zinc-500'}`} title={entry.tx_hash}>
                                  {entry.tx_hash.slice(0, 14)}...
                                </span>
                              )}
                            </div>
                            <p className={`leading-relaxed text-xs break-words whitespace-pre-wrap ${isOnyx ? 'text-zinc-300' : 'text-zinc-700'}`}>{displayText}</p>
                          </div>
                        );
                      })
                    )}
                    <div ref={terminalEndRef} />
                  </div>
                </div>
 
              </div>
            </div>
          )}

          {/* 2. CRM Tab */}
          {activeNav === 'crm' && (
            <div className="flex flex-col gap-4 h-full">
              {/* Toolbar */}
              <div className="flex justify-between items-center flex-wrap gap-2">
                <div className="relative w-64">
                  <span className="absolute left-2.5 top-2.5 text-onyx-muted">
                    <Search size={14} />
                  </span>
                  <input
                    type="text"
                    placeholder="Search leads..."
                    value={crmSearch}
                    onChange={(e) => setCrmSearch(e.target.value)}
                    className="w-full text-xs bg-onyx-panel border border-onyx-border rounded pl-8 pr-3 py-2 text-onyx-bright placeholder-onyx-muted focus:outline-none focus:border-zinc-500 transition-colors font-mono"
                  />
                </div>
                <button 
                  onClick={() => setIsAddLeadModalOpen(true)}
                  className="flex items-center gap-1.5 text-xs font-semibold text-onyx-canvas bg-onyx-accent-green hover:bg-emerald-400 px-3.5 py-2 rounded shadow-glow-green transition-all"
                >
                  <Plus size={14} /> Add Lead
                </button>
              </div>

              {/* Kanban Board */}
              <div className="flex gap-4 h-full overflow-x-auto pb-4 min-h-0 flex-1">
                {PIPELINE_STAGES.map((stage) => {
                  const stageLeads = filteredLeads.filter((l) => l.pipelineStage === stage);
                  return (
                    <div key={stage} className="flex-shrink-0 w-72 min-w-[280px] bg-onyx-panel/40 border border-onyx-border rounded-xl p-4 shadow-xl flex flex-col max-h-full">
                      <div className={`px-3 py-2 rounded-t border-b text-sm font-bold tracking-widest uppercase mb-3 flex justify-between items-center ${STAGE_COLORS[stage]}`}>
                        <span>{stage.replace('_', ' ')}</span>
                        <span className="opacity-70 font-mono">({stageLeads.length})</span>
                      </div>
                      <div className="overflow-y-auto flex-1 min-h-0 space-y-3">
                        {stageLeads.length === 0 ? (
                          <div className="text-center text-xs text-onyx-muted py-10 border border-dashed border-onyx-border rounded-xl">
                            Empty stage
                          </div>
                        ) : (
                          stageLeads.map((lead) => (
                            <LeadCard 
                              key={lead.id} 
                              lead={lead} 
                              onClick={() => setActiveLeadForModal(lead)} 
                            />
                          ))
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 3. ERP Tab */}
          {activeNav === 'erp' && (
            <div className="flex flex-col gap-4 h-full">
              {/* Toolbar */}
              <div className="flex justify-between items-center flex-wrap gap-4">
                <div className="flex gap-3">
                  <div className="relative w-72">
                    <span className="absolute left-3.5 top-3.5 text-onyx-muted">
                      <Search size={16} />
                    </span>
                    <input
                      type="text"
                      placeholder="Search SKU or name..."
                      value={erpSearch}
                      onChange={(e) => setErpSearch(e.target.value)}
                      className="w-full h-12 text-sm bg-onyx-panel border border-onyx-border rounded-lg pl-10 pr-4 text-onyx-bright placeholder-onyx-muted focus:outline-none focus:border-zinc-500 transition-colors font-mono"
                    />
                  </div>
                  <div className="flex border border-onyx-border rounded-lg overflow-hidden text-sm font-semibold font-mono h-12">
                    <button 
                      onClick={() => setErpFilter('all')}
                      className={`px-4 h-full transition-colors ${erpFilter === 'all' ? 'bg-onyx-accent-amber/25 text-onyx-accent-amber border-r border-onyx-border' : 'bg-onyx-panel text-onyx-muted hover:text-zinc-300 border-r border-onyx-border'}`}
                    >
                      All Assets
                    </button>
                    <button 
                      onClick={() => setErpFilter('low')}
                      className={`px-4 h-full transition-colors ${erpFilter === 'low' ? 'bg-onyx-accent-rose/25 text-onyx-accent-rose' : 'bg-onyx-panel text-onyx-muted hover:text-zinc-300'}`}
                    >
                      Low Stock ({lowStockCount})
                    </button>
                  </div>
                </div>
              </div>

              {/* Table Ledger */}
              <div className="bg-onyx-panel border border-onyx-border rounded-xl shadow-2xl overflow-hidden flex-1 min-h-0 overflow-y-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-onyx-border bg-onyx-panel/80">
                      {['SKU', 'Item Name', 'Location', 'Current Stock', 'Threshold', 'Unit Price', 'Status', 'Replenish Code', 'Action'].map((h) => (
                        <th key={h} className="text-left text-xs font-bold tracking-wider uppercase text-onyx-muted py-4 px-6 whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAssets.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="text-center py-12 text-onyx-muted font-mono text-sm">No inventory records resolved.</td>
                      </tr>
                    ) : (
                      filteredAssets.map((asset, idx) => (
                        <tr key={asset.id} className={`border-b border-onyx-border/30 hover:bg-onyx-panel/60 transition-colors ${idx % 2 === 0 ? 'bg-onyx-canvas/60' : 'bg-onyx-panel/40'}`}>
                          <td className="py-4 px-6 font-mono text-onyx-accent-cyan text-sm font-semibold">{asset.skuCode}</td>
                          <td className="py-4 px-6 text-onyx-bright font-semibold">{asset.name}</td>
                          <td className="py-4 px-6 text-onyx-muted font-mono text-sm">{asset.warehouseLocation ?? '—'}</td>
                          <td className="py-4 px-6">
                            <span className={`font-bold tabular-nums text-sm ${asset.isBelowThreshold ? 'text-onyx-accent-rose' : 'text-onyx-bright'}`}>
                              {asset.quantity}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-onyx-muted font-mono text-sm font-semibold">{asset.restockThreshold}</td>
                          <td className="py-4 px-6 text-onyx-accent-green font-mono text-sm font-semibold">${asset.unitPrice.toFixed(2)}</td>
                          <td className="py-4 px-6">
                            {asset.isBelowThreshold ? (
                              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-onyx-accent-rose bg-onyx-accent-rose/10 border border-onyx-accent-rose/20 px-2.5 py-1 rounded-md">
                                <AlertTriangle size={10} /> LOW STOCK
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-onyx-accent-green bg-onyx-accent-green/10 border border-onyx-accent-green/20 px-2.5 py-1 rounded-md">
                                HEALTHY
                              </span>
                            )}
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-2">
                              <input 
                                type="number" 
                                placeholder="Qty" 
                                min="0"
                                value={manualRestockQty[asset.skuCode] || ''} 
                                onChange={(e) => {
                                  const val = parseInt(e.target.value);
                                  setManualRestockQty(prev => ({ ...prev, [asset.skuCode]: isNaN(val) ? 0 : val }));
                                }}
                                className="w-16 h-10 text-center bg-onyx-canvas border border-onyx-border rounded-lg text-sm text-onyx-bright font-mono focus:outline-none focus:border-zinc-500"
                              />
                              <button 
                                onClick={() => handleManualRestock(asset.skuCode)}
                                className="text-xs bg-onyx-accent-amber/10 hover:bg-onyx-accent-amber/20 border border-onyx-accent-amber/30 px-3 py-2 rounded-lg text-onyx-accent-amber font-mono font-bold uppercase transition-all h-10"
                              >
                                Set
                              </button>
                            </div>
                          </td>
                          <td className="py-4 px-6 flex items-center gap-2">
                            <button
                              onClick={() => openInvoiceComposer(asset)}
                              disabled={asset.quantity === 0}
                              className={`text-xs font-bold uppercase tracking-wider px-4 py-2.5 rounded-lg transition-all whitespace-nowrap flex items-center gap-1.5 ${
                                asset.quantity === 0
                                  ? 'bg-zinc-800 text-zinc-500 border border-zinc-700 cursor-not-allowed'
                                  : 'text-onyx-accent-cyan bg-onyx-accent-cyan/10 border border-onyx-accent-cyan/30 hover:bg-onyx-accent-cyan/25 shadow-sm'
                              }`}
                            >
                              <FileSignature size={12} /> Bill Lead
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 4. Invoices Tab */}
          {activeNav === 'invoices' && (
            <div className="flex flex-col gap-4 h-full">
              {/* Toolbar */}
              <div className="flex justify-between items-center flex-wrap gap-4">
                <div className="flex gap-3">
                  <div className="relative w-72">
                    <span className="absolute left-3.5 top-3.5 text-onyx-muted">
                      <Search size={16} />
                    </span>
                    <input
                      type="text"
                      placeholder="Search Invoice number or customer..."
                      value={invoiceSearch}
                      onChange={(e) => setInvoiceSearch(e.target.value)}
                      className="w-full h-12 text-sm bg-onyx-panel border border-onyx-border rounded-lg pl-10 pr-4 text-onyx-bright placeholder-onyx-muted focus:outline-none focus:border-zinc-500 transition-colors font-mono"
                    />
                  </div>
                  <div className="flex flex-wrap border border-onyx-border rounded-lg overflow-hidden text-sm font-semibold font-mono h-12 items-center">
                    {(['ALL', 'SENT', 'PAID', 'OVERDUE', 'VOID'] as const).map(status => (
                      <button 
                        key={status}
                        onClick={() => setInvoiceStatusFilter(status)}
                        className={`px-4 h-full transition-colors border-r last:border-r-0 border-onyx-border ${invoiceStatusFilter === status ? 'bg-onyx-accent-cyan/20 text-onyx-accent-cyan' : 'bg-onyx-panel text-onyx-muted hover:text-zinc-300'}`}
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Invoices Table */}
              <div className="bg-onyx-panel border border-onyx-border rounded-xl shadow-2xl overflow-hidden flex-1 min-h-0 overflow-y-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-onyx-border bg-onyx-panel/80">
                      {['Invoice #', 'Customer', 'Issue Date', 'Subtotal', 'Discount', 'Tax', 'Total', 'Status', 'Ambassador', 'Action'].map((h) => (
                        <th key={h} className="text-left text-xs font-bold tracking-wider uppercase text-onyx-muted py-4 px-6">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredInvoices.length === 0 ? (
                      <tr>
                        <td colSpan={10} className="text-center py-12 text-onyx-muted font-mono text-sm">No transactional receipts generated.</td>
                      </tr>
                    ) : (
                      filteredInvoices.map((invoice, idx) => (
                        <tr key={invoice.id} className={`border-b border-onyx-border/30 hover:bg-onyx-panel/60 transition-colors ${idx % 2 === 0 ? 'bg-onyx-canvas/60' : 'bg-onyx-panel/40'}`}>
                          <td className="py-4 px-6 font-mono text-onyx-accent-cyan text-sm font-bold">{invoice.invoiceNumber}</td>
                          <td className="py-4 px-6 text-onyx-bright font-semibold">{invoice.customerName}</td>
                          <td className="py-4 px-6 text-onyx-muted font-mono text-sm font-semibold">{new Date(invoice.issueDate).toLocaleDateString()}</td>
                          <td className="py-4 px-6 font-mono text-sm font-semibold">${invoice.subtotal.toFixed(2)}</td>
                          <td className="py-4 px-6 font-mono text-sm text-onyx-accent-rose font-bold">-${invoice.discount.toFixed(2)}</td>
                          <td className="py-4 px-6 font-mono text-sm font-semibold">${invoice.taxAmount.toFixed(2)}</td>
                          <td className="py-4 px-6 font-mono text-sm text-onyx-accent-green font-bold">${invoice.total.toFixed(2)}</td>
                          <td className="py-4 px-6">
                            <span className={`inline-block text-xs font-bold px-3 py-1 rounded-md tracking-wider font-mono ${
                              invoice.status === 'PAID' ? 'bg-onyx-accent-green/10 text-onyx-accent-green border border-onyx-accent-green/20' :
                              invoice.status === 'SENT' ? 'bg-onyx-accent-cyan/10 text-onyx-accent-cyan border border-onyx-accent-cyan/20' :
                              invoice.status === 'OVERDUE' ? 'bg-onyx-accent-amber/10 text-onyx-accent-amber border border-onyx-accent-amber/20' :
                              'bg-zinc-800/40 text-zinc-500 border border-zinc-700/20'
                            }`}>
                              {invoice.status}
                            </span>
                          </td>
                          <td className="py-4 px-6 font-mono text-onyx-accent-purple text-sm font-semibold">{invoice.ambassadorCode ?? '—'}</td>
                          <td className="py-4 px-6">
                            <button
                              onClick={() => setActiveInvoiceForModal(invoice)}
                              className="text-xs font-bold uppercase tracking-wider bg-onyx-accent-cyan/10 border border-onyx-accent-cyan/30 text-onyx-accent-cyan hover:bg-onyx-accent-cyan/25 px-4 py-2.5 rounded-lg transition-all"
                            >
                              Receipt
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 5. Ambassadors Tab */}
          {activeNav === 'ambassadors' && (
            <div className="flex flex-col gap-4 h-full">
              {/* Header metrics & action */}
              <div className="flex justify-between items-center flex-wrap gap-4">
                <div className="text-sm text-onyx-muted font-mono font-medium">
                  Seeded and registered ambassador discount codes for sales referral velocity.
                </div>
                <button 
                  onClick={() => setIsAddAmbassadorModalOpen(true)}
                  className="flex items-center gap-2 text-sm font-bold text-onyx-canvas bg-onyx-accent-purple hover:bg-fuchsia-400 px-5 py-3 rounded-xl shadow-glow-purple transition-all h-12"
                >
                  <PlusCircle size={16} /> Register Partner
                </button>
              </div>

              {/* Ambassadors table list */}
              <div className="bg-onyx-panel border border-onyx-border rounded-xl shadow-2xl overflow-hidden flex-1 min-h-0 overflow-y-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-onyx-border bg-onyx-panel/80">
                      {['Ambassador Code', 'Partner Name', 'Tenant Context', 'Total Referrals', 'Total Revenue Generated', 'Total Discounts Paid', 'Status'].map((h) => (
                        <th key={h} className="text-left text-xs font-bold tracking-wider uppercase text-onyx-muted py-4 px-6">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {ambassadorStats.map((amb, idx) => (
                      <tr key={amb.id} className={`border-b border-onyx-border/30 hover:bg-onyx-panel/60 transition-colors ${idx % 2 === 0 ? 'bg-onyx-canvas/60' : 'bg-onyx-panel/40'}`}>
                        <td className="py-4 px-6 font-mono text-onyx-accent-purple text-sm font-bold">{amb.code}</td>
                        <td className="py-4 px-6 text-onyx-bright font-semibold">{amb.name}</td>
                        <td className="py-4 px-6 text-onyx-muted font-mono text-sm font-semibold">{amb.tenant_company ? TENANT_LABELS[amb.tenant_company] : 'GLOBAL'}</td>
                        <td className="py-4 px-6 font-mono font-bold text-center tabular-nums text-sm">{amb.referrals}</td>
                        <td className="py-4 px-6 font-mono text-onyx-accent-green font-bold text-sm">${amb.salesGenerated.toFixed(2)}</td>
                        <td className="py-4 px-6 font-mono text-onyx-accent-rose font-bold text-sm">${amb.discountsEarned.toFixed(2)}</td>
                        <td className="py-4 px-6">
                          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-onyx-accent-green bg-onyx-accent-green/10 border border-onyx-accent-green/20 px-2.5 py-1 rounded-md font-mono">
                            ACTIVE
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeNav === 'mailbox' && (
            <div className="flex-1 min-h-0 overflow-y-auto p-1">
              <SecureMailbox />
            </div>
          )}

          {activeNav === 'hr_portal' && (
            <div className="flex-1 min-h-0 overflow-y-auto p-1">
              <AdminHRPortal />
            </div>
          )}

        </div>
      </main>

      {/* ── Right Panel — Agent Activity Matrix ──────────────────────────── */}
      <aside className={`hidden lg:flex flex-shrink-0 flex-col border-l transition-all duration-300 ${
        isTerminalCollapsed ? 'w-16' : 'w-80 xl:w-96'
      } ${
        isOnyx ? 'bg-[#09090b] border-[#27272a]' : 'bg-[#f4f4f5] border-[#e4e4e7]'
      }`}>
        {isTerminalCollapsed ? (
          <>
            {/* Collapsed Header */}
            <div className={`px-2 py-4 border-b flex-shrink-0 flex flex-col items-center gap-3 ${isOnyx ? 'border-[#27272a]' : 'border-[#e4e4e7]'}`}>
              <button
                onClick={() => setIsTerminalCollapsed(false)}
                className={`p-1.5 rounded-lg border transition-all ${
                  isOnyx 
                    ? 'bg-zinc-950 border-zinc-800 text-onyx-accent-green hover:border-zinc-600' 
                    : 'bg-white border-zinc-200 text-emerald-800 hover:border-zinc-400'
                }`}
                title="Expand Agent Command Matrix"
              >
                <ChevronLeft size={16} />
              </button>
              <div className={`h-4 w-px my-1 ${isOnyx ? 'bg-zinc-800' : 'bg-zinc-300'}`} />
              <span className={`text-[10px] font-bold font-mono tracking-widest uppercase rotate-90 my-10 whitespace-nowrap ${
                isOnyx ? 'text-zinc-500' : 'text-zinc-600'
              }`}>
                TELEMETRY
              </span>
            </div>

            {/* Collapsed Stream */}
            <div className={`flex-1 overflow-y-auto px-2 py-4 flex flex-col items-center gap-3 min-h-0 ${
              isOnyx ? 'bg-[#000000]' : 'bg-[#ffffff]'
            }`}>
              {filteredTerminalEntries.slice(0, 15).map((entry) => {
                const colorClass = (() => {
                  const agent = (entry.agentName || '').toLowerCase();
                  if (agent === 'growthagent') return 'bg-sky-500';
                  if (agent === 'logisticsagent') return 'bg-amber-500';
                  if (agent === 'networkagent') return 'bg-purple-500';
                  if (agent === 'securityalert') return 'bg-rose-500';
                  return 'bg-emerald-500';
                })();
                return (
                  <div
                    key={entry.id}
                    className={`w-3.5 h-3.5 rounded-full ${colorClass} shadow-lg animate-pulse cursor-pointer`}
                    title={`${entry.agentName} (${new Date(entry.timestamp).toLocaleTimeString()}): ${entry.thoughtProcess}`}
                  />
                );
              })}
            </div>

            {/* Collapsed Footer */}
            <div className={`flex-shrink-0 border-t py-3 flex flex-col items-center justify-center font-mono ${
              isOnyx ? 'border-[#27272a]' : 'border-[#e4e4e7]'
            }`}>
              <span className={`text-xs font-bold ${isOnyx ? 'text-onyx-accent-green' : 'text-emerald-800'}`}>
                {filteredTerminalEntries.length}
              </span>
              <span className="text-[7px] text-zinc-500 uppercase tracking-widest">LOGS</span>
            </div>
          </>
        ) : (
          <>
            {/* Header */}
            <div className={`px-4 py-3 border-b flex-shrink-0 flex items-center justify-between gap-4 ${isOnyx ? 'border-[#27272a]' : 'border-[#e4e4e7]'}`}>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="relative w-2.5 h-2.5 flex-shrink-0">
                    <div className={`absolute inset-0 rounded-full animate-ping opacity-50 ${isOnyx ? 'bg-[#22c55e]' : 'bg-emerald-800'}`} />
                    <div className={`absolute inset-0 rounded-full ${isOnyx ? 'bg-[#22c55e]' : 'bg-emerald-800'}`} />
                  </div>
                  <h2 className={`text-sm font-bold tracking-wider uppercase ${isOnyx ? 'text-[#22c55e]' : 'text-emerald-800'}`}>
                    Agent Command Matrix
                  </h2>
                </div>
                <p className={`text-[10px] ml-5 font-mono ${isOnyx ? 'text-zinc-500' : 'text-zinc-600'}`}>
                  {filteredTerminalEntries.length} log entries · live stream
                </p>
              </div>
              <button
                onClick={() => setIsTerminalCollapsed(true)}
                className={`p-1.5 rounded-lg border transition-all ${
                  isOnyx 
                    ? 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-600' 
                    : 'bg-white border-zinc-200 text-zinc-500 hover:text-zinc-800 hover:border-zinc-400'
                }`}
                title="Collapse Agent Command Matrix"
              >
                <ChevronRight size={16} />
              </button>
            </div>

            {/* Agent Legend */}
            <div className={`flex-shrink-0 px-4 py-2.5 border-b flex gap-2 flex-wrap ${isOnyx ? 'border-[#27272a]' : 'border-[#e4e4e7]'}`}>
              {(['GrowthAgent', 'LogisticsAgent', 'NetworkAgent', 'DirectorAgent', 'SecurityAlert'] as const).map((agent) => (
                <span key={agent} className={`text-[9px] font-bold px-2 py-0.5 rounded tracking-widest uppercase ${
                  (() => {
                    const key = (agent || '').toLowerCase();
                    const style = AGENT_BADGE_STYLES[key];
                    return style
                      ? (themeProfile === 'ALABASTER' ? style.alabaster : style.onyx)
                      : (themeProfile === 'ALABASTER' ? 'text-zinc-600 bg-zinc-100 border border-zinc-300' : 'text-zinc-400 bg-zinc-800 border border-zinc-700');
                  })()
                }`}>
                  {agent}
                </span>
              ))}
            </div>

            {/* Streaming Terminal */}
            <div
              id="agent-terminal"
              ref={terminalRef}
              className={`flex-1 overflow-y-auto px-4 py-2 min-h-0 relative ${
                isOnyx ? 'bg-[#000000]' : 'bg-[#ffffff]'
              }`}
            >
              {filteredTerminalEntries.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-3">
                  <Activity size={24} className={`animate-pulse ${isOnyx ? 'text-zinc-700' : 'text-zinc-300'}`} />
                  <p className={`text-[10px] text-center font-mono ${isOnyx ? 'text-zinc-500' : 'text-zinc-600'}`}>
                    Initializing agent protocols...
                  </p>
                </div>
              ) : (
                <>
                  {[...filteredTerminalEntries].reverse().map((entry) => (
                    <ThoughtEntry key={entry.id} entry={entry} currentUser={currentUser} />
                  ))}
                  <div ref={terminalEndRef} className="h-0 w-0 opacity-0 pointer-events-none" />
                </>
              )}
            </div>

            {/* Footer stats */}
            <div className={`flex-shrink-0 border-t px-4 py-2.5 grid grid-cols-4 gap-1 text-center ${
              isOnyx ? 'border-[#27272a]' : 'border-[#e4e4e7]'
            }`}>
              {(['GrowthAgent', 'LogisticsAgent', 'NetworkAgent', 'DirectorAgent'] as const).map((agent) => {
                const count = filteredTerminalEntries.filter((e) => e.agentName === agent).length;
                const colorClass = (() => {
                  if (agent === 'GrowthAgent') return isOnyx ? 'text-sky-400' : 'text-blue-700';
                  if (agent === 'LogisticsAgent') return isOnyx ? 'text-amber-400' : 'text-amber-700';
                  if (agent === 'NetworkAgent') return isOnyx ? 'text-purple-400' : 'text-purple-700';
                  return isOnyx ? 'text-[#22c55e]' : 'text-emerald-800';
                })();
                return (
                  <div key={agent}>
                    <p className={`text-sm font-bold ${colorClass}`}>{count}</p>
                    <p className={`text-[7px] truncate font-mono ${isOnyx ? 'text-zinc-500' : 'text-zinc-600'}`}>{agent}</p>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </aside>

      {/* ── MODALS & DIALOGS ────────────────────────────────────────────────── */}

      {/* 1. Lead Details Modal */}
      {activeLeadForModal && (
        <div className="fixed inset-0 bg-onyx-canvas/80 backdrop-blur-sm z-50 flex justify-center items-center p-4">
          <div className="bg-onyx-panel border border-onyx-border rounded-lg w-full max-w-lg overflow-hidden flex flex-col font-mono text-xs shadow-glow-cyan animate-fade-in">
            {/* Header */}
            <div className="p-4 border-b border-onyx-border flex justify-between items-center bg-onyx-panel/80">
              <span className="text-[10px] text-onyx-accent-cyan font-bold tracking-widest uppercase">Lead Scoping Terminal</span>
              <button onClick={() => setActiveLeadForModal(null)} className="text-onyx-muted hover:text-onyx-bright transition-colors">
                <X size={16} />
              </button>
            </div>
            
            {/* Body */}
            <div className="p-4 overflow-y-auto max-h-[75vh] space-y-4">
              <div className="grid grid-cols-2 gap-3 bg-onyx-canvas/40 border border-onyx-border/40 p-3 rounded">
                <div>
                  <span className="text-zinc-500 text-[10px]">LEAD NAME</span>
                  <p className="font-bold text-onyx-bright">{activeLeadForModal.name}</p>
                </div>
                <div>
                  <span className="text-zinc-500 text-[10px]">COMPANY</span>
                  <p className="font-bold text-onyx-bright">{activeLeadForModal.companyName}</p>
                </div>
                <div>
                  <span className="text-zinc-500 text-[10px]">EMAIL ADDRESS</span>
                  <p className="text-onyx-bright select-text">{activeLeadForModal.email}</p>
                </div>
                <div>
                  <span className="text-zinc-500 text-[10px]">CONTACT PHONE</span>
                  <p className="text-onyx-bright select-text">{activeLeadForModal.phone ?? '—'}</p>
                </div>
                <div>
                  <span className="text-zinc-500 text-[10px]">POTENTIAL VALUE</span>
                  <p className="text-onyx-accent-green font-bold text-sm">${activeLeadForModal.potentialValue.toLocaleString()}</p>
                </div>
                <div>
                  <span className="text-zinc-500 text-[10px]">PIPELINE VELOCITY</span>
                  <p className="text-onyx-bright">{activeLeadForModal.dealVelocity} days active</p>
                </div>
              </div>

              {/* Stage mutator */}
              <div className="space-y-1.5 border-t border-onyx-border/30 pt-3">
                <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Pipeline Stage Mutator</label>
                <div className="flex gap-2">
                  <select
                    value={activeLeadForModal.pipelineStage}
                    onChange={(e) => {
                      updateLeadStage(activeLeadForModal.id, e.target.value as PipelineStage);
                      // Update modal instance
                      setActiveLeadForModal(prev => prev ? { ...prev, pipelineStage: e.target.value as PipelineStage } : null);
                    }}
                    className="flex-1 bg-onyx-canvas border border-onyx-border rounded p-2 text-xs text-onyx-bright focus:outline-none focus:border-zinc-500 font-mono"
                  >
                    {PIPELINE_STAGES.map(st => (
                      <option key={st} value={st}>{st.replace('_', ' ')}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Logger Activity Form */}
              <form onSubmit={(e) => handleAddActivitySubmit(e, activeLeadForModal.id)} className="space-y-2 border-t border-onyx-border/30 pt-3">
                <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Append CRM Event Log</label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Log activity (e.g., scoping call completed...)"
                    value={newActivityText}
                    onChange={(e) => setNewActivityText(e.target.value)}
                    className="w-full bg-onyx-canvas border border-onyx-border rounded pl-3 pr-10 py-2.5 text-xs text-onyx-bright focus:outline-none focus:border-zinc-500 font-mono"
                  />
                  <button type="submit" className="absolute right-2.5 top-2.5 text-onyx-accent-cyan hover:scale-105 transition-all">
                    <Send size={14} />
                  </button>
                </div>
              </form>

              {/* Activity history logs */}
              <div className="space-y-1.5 border-t border-onyx-border/30 pt-3">
                <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Chronological Activity Ledger</span>
                <div className="bg-onyx-canvas border border-onyx-border rounded max-h-[140px] overflow-y-auto p-2.5 space-y-2 text-[10px]">
                  {!(activeLeadForModal.activityLogs) || activeLeadForModal.activityLogs.length === 0 ? (
                    <div className="text-zinc-600 italic">No events recorded.</div>
                  ) : (
                    [...activeLeadForModal.activityLogs].reverse().map((act, idx) => (
                      <div key={idx} className="pb-1 border-b border-zinc-900/60 text-zinc-400 flex items-start gap-1">
                        <span className="text-onyx-accent-cyan font-bold select-none">&gt;</span>
                        <span>{act}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* 2. Add Lead Modal */}
      {isAddLeadModalOpen && (
        <div className="fixed inset-0 bg-onyx-canvas/80 backdrop-blur-sm z-50 flex justify-center items-center p-4">
          <div className="bg-onyx-panel border border-onyx-border rounded-lg w-full max-w-sm overflow-hidden flex flex-col font-mono text-xs shadow-glow-green animate-fade-in">
            <div className="p-4 border-b border-onyx-border flex justify-between items-center bg-onyx-panel/80">
              <span className="text-[10px] text-onyx-accent-green font-bold tracking-widest uppercase">Register New Pipeline Lead</span>
              <button onClick={() => setIsAddLeadModalOpen(false)} className="text-onyx-muted hover:text-onyx-bright transition-colors">
                <X size={16} />
              </button>
            </div>
            
            <form onSubmit={handleAddLeadSubmit} className="p-4 space-y-3.5">
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Lead Name *</label>
                <div className="relative">
                  <span className="absolute left-2.5 top-2.5 text-zinc-600"><User size={13} /></span>
                  <input
                    type="text"
                    required
                    placeholder="Aria Thorne"
                    value={newLeadName}
                    onChange={(e) => setNewLeadName(e.target.value)}
                    className="w-full bg-onyx-canvas border border-onyx-border rounded pl-8 pr-3 py-2 text-xs text-onyx-bright focus:outline-none focus:border-zinc-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Company Name *</label>
                <div className="relative">
                  <span className="absolute left-2.5 top-2.5 text-zinc-600"><Package size={13} /></span>
                  <input
                    type="text"
                    required
                    placeholder="Sterling Ops Corp"
                    value={newLeadCompany}
                    onChange={(e) => setNewLeadCompany(e.target.value)}
                    className="w-full bg-onyx-canvas border border-onyx-border rounded pl-8 pr-3 py-2 text-xs text-onyx-bright focus:outline-none focus:border-zinc-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Email Node *</label>
                <div className="relative">
                  <span className="absolute left-2.5 top-2.5 text-zinc-600"><Mail size={13} /></span>
                  <input
                    type="email"
                    required
                    placeholder="aria@sterling.com"
                    value={newLeadEmail}
                    onChange={(e) => setNewLeadEmail(e.target.value)}
                    className="w-full bg-onyx-canvas border border-onyx-border rounded pl-8 pr-3 py-2 text-xs text-onyx-bright focus:outline-none focus:border-zinc-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Contact Phone</label>
                <div className="relative">
                  <span className="absolute left-2.5 top-2.5 text-zinc-600"><Phone size={13} /></span>
                  <input
                    type="text"
                    placeholder="+1-555-0192"
                    value={newLeadPhone}
                    onChange={(e) => setNewLeadPhone(e.target.value)}
                    className="w-full bg-onyx-canvas border border-onyx-border rounded pl-8 pr-3 py-2 text-xs text-onyx-bright focus:outline-none focus:border-zinc-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Deal Potential Value (USD) *</label>
                <div className="relative">
                  <span className="absolute left-2.5 top-2.5 text-zinc-600"><DollarSign size={13} /></span>
                  <input
                    type="number"
                    required
                    min="1"
                    value={newLeadValue}
                    onChange={(e) => setNewLeadValue(parseInt(e.target.value) || 0)}
                    className="w-full bg-onyx-canvas border border-onyx-border rounded pl-8 pr-3 py-2 text-xs text-onyx-bright font-mono focus:outline-none focus:border-zinc-500"
                  />
                </div>
              </div>

              {currentUser?.role === 'global_admin' && (
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Tenant Bind Domain Context</label>
                  <select
                    value={newLeadTenant}
                    onChange={(e) => setNewLeadTenant(e.target.value as TenantCompany)}
                    className="w-full bg-onyx-canvas border border-onyx-border rounded p-2 text-xs text-onyx-bright focus:outline-none focus:border-zinc-500"
                  >
                    <option value="skill_tank">Skill Tank Systems</option>
                    <option value="vriddhi">Vriddhi Logistics</option>
                    <option value="tobofu">Tobofu Agri Group</option>
                    <option value="promtal">Promtal Media</option>
                    <option value="maceco">Maceco Roman Steel</option>
                  </select>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-2.5 rounded bg-onyx-accent-green hover:bg-emerald-400 text-onyx-canvas font-bold uppercase tracking-widest transition-all mt-4"
              >
                Register Lead
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 3. Invoice Composer Modal */}
      {assetForInvoiceModal && (
        <div className="fixed inset-0 bg-onyx-canvas/80 backdrop-blur-sm z-50 flex justify-center items-center p-4">
          <div className="bg-onyx-panel border border-onyx-border rounded-lg w-full max-w-md overflow-hidden flex flex-col font-mono text-xs shadow-glow-cyan animate-fade-in">
            <div className="p-4 border-b border-onyx-border flex justify-between items-center bg-onyx-panel/80">
              <span className="text-[10px] text-onyx-accent-cyan font-bold tracking-widest uppercase">Zeta Invoice Composer</span>
              <button onClick={() => setAssetForInvoiceModal(null)} className="text-onyx-muted hover:text-onyx-bright transition-colors">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleIssueInvoiceSubmit} className="p-4 space-y-4">
              <div className="bg-onyx-canvas/40 border border-onyx-border/40 p-2.5 rounded text-[10px] space-y-1">
                <p className="text-zinc-500">BILLING ITEM DETAILS</p>
                <p className="text-onyx-bright font-bold text-xs">{assetForInvoiceModal.name}</p>
                <p className="text-zinc-400">SKU: {assetForInvoiceModal.skuCode} · Unit Price: <span className="text-onyx-accent-green">${assetForInvoiceModal.unitPrice.toFixed(2)}</span></p>
                <p className="text-zinc-400">Available Stock: <span className="text-onyx-bright font-bold">{assetForInvoiceModal.quantity} units</span></p>
              </div>

              {/* Target CLOSED_WON Leads dropdown */}
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Closed Won Customer *</label>
                {filteredLeads.filter(l => l.pipelineStage === 'CLOSED_WON').length === 0 ? (
                  <div className="p-2 border border-dashed border-onyx-accent-rose bg-onyx-accent-rose/5 text-onyx-accent-rose text-[10px] rounded leading-relaxed">
                    CRITICAL: No closed-won leads available for this tenant context. Please move a lead to CLOSED_WON in the CRM tab first.
                  </div>
                ) : (
                  <select
                    value={invoiceLeadId}
                    onChange={(e) => setInvoiceLeadId(e.target.value)}
                    className="w-full bg-onyx-canvas border border-onyx-border rounded p-2 text-xs text-onyx-bright focus:outline-none focus:border-zinc-500 font-mono"
                  >
                    {filteredLeads.filter(l => l.pipelineStage === 'CLOSED_WON').map(l => (
                      <option key={l.id} value={l.id}>{l.name} ({l.companyName})</option>
                    ))}
                  </select>
                )}
              </div>

              {/* Quantity input */}
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Invoice Quantity *</label>
                <input
                  type="number"
                  required
                  min="1"
                  max={assetForInvoiceModal.quantity}
                  value={invoiceQty}
                  onChange={(e) => setInvoiceQty(Math.min(assetForInvoiceModal.quantity, Math.max(1, parseInt(e.target.value) || 1)))}
                  className="w-full bg-onyx-canvas border border-onyx-border rounded p-2 text-xs text-onyx-bright font-mono focus:outline-none focus:border-zinc-500"
                />
              </div>

              {/* Ambassador Code input */}
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Referral Ambassador Code</label>
                  {invoiceAmbassador && (
                    <span className={`text-[8px] px-1 py-0.2 rounded font-bold uppercase ${
                      ambassadors.some(a => a.code.toUpperCase() === invoiceAmbassador.toUpperCase().trim()) 
                        ? 'text-onyx-accent-green bg-onyx-accent-green/10' 
                        : 'text-onyx-accent-rose bg-onyx-accent-rose/10'
                    }`}>
                      {ambassadors.some(a => a.code.toUpperCase() === invoiceAmbassador.toUpperCase().trim()) ? 'VALID (5% Off)' : 'INVALID'}
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  placeholder="e.g. SKILLTANK5"
                  value={invoiceAmbassador}
                  onChange={(e) => setInvoiceAmbassador(e.target.value)}
                  className="w-full bg-onyx-canvas border border-onyx-border rounded p-2 text-xs text-onyx-bright font-mono focus:outline-none focus:border-zinc-500"
                />
              </div>

              {/* Mathematical Preview Panel */}
              {(() => {
                const subtotal = Number((invoiceQty * assetForInvoiceModal.unitPrice).toFixed(2));
                const isValid = ambassadors.some(a => a.code.toUpperCase() === invoiceAmbassador.toUpperCase().trim());
                const discount = isValid ? Number((subtotal * 0.05).toFixed(2)) : 0;
                const netTaxable = subtotal - discount;
                const tax = Number((netTaxable * 0.18).toFixed(2));
                const grand = Number((netTaxable + tax).toFixed(2));

                return (
                  <div className="bg-onyx-canvas/40 border border-onyx-border/80 p-3 rounded space-y-1.5 font-mono text-[10px] tabular-nums text-zinc-300">
                    <p className="text-zinc-500 border-b border-onyx-border/30 pb-1 uppercase font-bold">Billing Calculations Preview</p>
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span className="text-onyx-bright">${subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-onyx-accent-rose">
                      <span>Ambassador Discount (5%):</span>
                      <span>-${discount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Net Taxable Base:</span>
                      <span className="text-onyx-bright">${netTaxable.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>GST standard tax (18%):</span>
                      <span className="text-onyx-bright">${tax.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-onyx-accent-green font-bold text-xs border-t border-onyx-border/30 pt-1">
                      <span>Grand Net Total:</span>
                      <span>${grand.toFixed(2)}</span>
                    </div>
                  </div>
                );
              })()}

              <button
                type="submit"
                disabled={filteredLeads.filter(l => l.pipelineStage === 'CLOSED_WON').length === 0}
                className={`w-full py-2.5 rounded font-bold uppercase tracking-widest transition-all ${
                  filteredLeads.filter(l => l.pipelineStage === 'CLOSED_WON').length === 0
                    ? 'bg-zinc-800 text-zinc-500 border border-zinc-700 cursor-not-allowed'
                    : 'bg-onyx-accent-cyan hover:bg-cyan-400 text-onyx-canvas shadow-glow-cyan'
                }`}
              >
                Issue Invoice
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 4. Invoice Receipt Viewer Modal */}
      {activeInvoiceForModal && (
        <div className="fixed inset-0 bg-onyx-canvas/80 backdrop-blur-sm z-50 flex justify-center items-center p-4">
          <div className="bg-onyx-panel border border-onyx-border rounded-lg w-full max-w-lg overflow-hidden flex flex-col font-mono text-xs shadow-glow-cyan animate-fade-in">
            <div className="p-4 border-b border-onyx-border flex justify-between items-center bg-onyx-panel/80">
              <span className="text-[10px] text-onyx-accent-cyan font-bold tracking-widest uppercase">Zeta Financial Invoice Sheet</span>
              <button onClick={() => setActiveInvoiceForModal(null)} className="text-onyx-muted hover:text-onyx-bright transition-colors">
                <X size={16} />
              </button>
            </div>

            <div className="p-5 overflow-y-auto max-h-[75vh] space-y-6">
              
              {/* Receipt Banner */}
              <div className="flex justify-between items-start border-b border-onyx-border pb-4">
                <div>
                  <h4 className="text-lg font-bold text-onyx-bright tracking-wider">ZETA SYSTEMS LTD.</h4>
                  <p className="text-[9px] text-onyx-muted uppercase mt-0.5">Enterprise isolation transactions division</p>
                </div>
                <div className="text-right">
                  <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded tracking-wide ${
                    activeInvoiceForModal.status === 'PAID' ? 'bg-onyx-accent-green/10 text-onyx-accent-green border border-onyx-accent-green/20' :
                    activeInvoiceForModal.status === 'SENT' ? 'bg-onyx-accent-cyan/10 text-onyx-accent-cyan border border-onyx-accent-cyan/20' :
                    activeInvoiceForModal.status === 'OVERDUE' ? 'bg-onyx-accent-amber/10 text-onyx-accent-amber border border-onyx-accent-amber/20' :
                    'bg-zinc-800/40 text-zinc-500 border border-zinc-700/20'
                  }`}>
                    {activeInvoiceForModal.status}
                  </span>
                  <p className="text-[10px] font-bold text-onyx-accent-cyan mt-1.5">{activeInvoiceForModal.invoiceNumber}</p>
                </div>
              </div>

              {/* Billing addresses context */}
              <div className="grid grid-cols-2 gap-4 text-[10px]">
                <div>
                  <span className="text-zinc-500 uppercase font-bold">Origin Vendor details</span>
                  <p className="font-bold text-onyx-bright mt-0.5">Centle Global Group</p>
                  <p className="text-zinc-400">Security Suite Port #800</p>
                  <p className="text-zinc-400">admin@centle.com</p>
                </div>
                <div>
                  <span className="text-zinc-500 uppercase font-bold">Billed Customer details</span>
                  <p className="font-bold text-onyx-bright mt-0.5">{activeInvoiceForModal.customerName}</p>
                  <p className="text-zinc-400">Associated Closed Won Opportunity</p>
                  <p className="text-zinc-400">Account ID: {activeInvoiceForModal.customerId}</p>
                </div>
              </div>

              {/* Financial dates block */}
              <div className="grid grid-cols-2 gap-4 bg-onyx-canvas/40 border border-onyx-border/40 p-2.5 rounded text-[10px]">
                <div>
                  <span className="text-zinc-500">DATE OF ISSUANCE:</span>
                  <p className="text-onyx-bright font-bold">{new Date(activeInvoiceForModal.issueDate).toLocaleString()}</p>
                </div>
                <div>
                  <span className="text-zinc-500">PAYMENT TERMS DUE DATE:</span>
                  <p className="text-onyx-bright font-bold">{new Date(activeInvoiceForModal.dueDate).toLocaleDateString()} (Net 14)</p>
                </div>
              </div>

              {/* Item breakdown ledger */}
              <div className="space-y-1">
                <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Transaction line itemizations</span>
                <table className="w-full text-left border-collapse text-[10px] tabular-nums">
                  <thead>
                    <tr className="border-b border-onyx-border bg-onyx-panel/80 text-zinc-400 uppercase font-bold">
                      <th className="py-2 px-2.5">Item Description</th>
                      <th className="py-2 px-2.5 text-center">Qty</th>
                      <th className="py-2 px-2.5 text-right">Unit Price</th>
                      <th className="py-2 px-2.5 text-right">Line Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeInvoiceForModal.lineItems.map(item => (
                      <tr key={item.id} className="border-b border-onyx-border/30">
                        <td className="py-2 px-2.5 text-onyx-bright font-semibold">{item.description}</td>
                        <td className="py-2 px-2.5 text-center text-zinc-300 font-bold">{item.quantity}</td>
                        <td className="py-2 px-2.5 text-right text-zinc-400">${item.unitPrice.toFixed(2)}</td>
                        <td className="py-2 px-2.5 text-right text-onyx-bright font-semibold">${item.totalPrice.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Subtotal tax calculations sheet */}
              <div className="flex justify-end font-mono text-[10px] tabular-nums">
                <div className="w-64 space-y-1.5 text-zinc-300">
                  <div className="flex justify-between">
                    <span>Invoice Subtotal:</span>
                    <span className="text-onyx-bright">${activeInvoiceForModal.subtotal.toFixed(2)}</span>
                  </div>
                  {activeInvoiceForModal.discount > 0 && (
                    <div className="flex justify-between text-onyx-accent-rose">
                      <span>Ambassador discount code applied:</span>
                      <span>-${activeInvoiceForModal.discount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>GST standard tax (18%):</span>
                    <span className="text-onyx-bright">${activeInvoiceForModal.taxAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-onyx-accent-green font-bold text-xs border-t border-onyx-border pt-1.5">
                    <span>Absolute Grand Net Total:</span>
                    <span>${activeInvoiceForModal.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Invoice operations actions */}
              {activeInvoiceForModal.status === 'SENT' && (
                <div className="flex gap-2 border-t border-onyx-border pt-4">
                  <button
                    onClick={() => {
                      updateInvoiceStatus(activeInvoiceForModal.id, 'PAID');
                      setActiveInvoiceForModal(prev => prev ? { ...prev, status: 'PAID' } : null);
                      alert('Invoice cleared and marked as PAID.');
                    }}
                    className="flex-1 py-2.5 bg-onyx-accent-green hover:bg-emerald-400 text-onyx-canvas font-bold uppercase tracking-widest transition-all rounded flex items-center justify-center gap-1.5"
                  >
                    <Check size={14} /> Clear Payment (PAID)
                  </button>
                  <button
                    onClick={() => {
                      updateInvoiceStatus(activeInvoiceForModal.id, 'VOID');
                      setActiveInvoiceForModal(prev => prev ? { ...prev, status: 'VOID' } : null);
                      alert('Invoice cancelled and marked as VOID.');
                    }}
                    className="py-2.5 px-4 bg-onyx-panel hover:bg-rose-950/20 border border-onyx-border hover:border-onyx-accent-rose/50 text-onyx-accent-rose font-bold uppercase tracking-wider transition-all rounded flex items-center justify-center gap-1"
                  >
                    <Ban size={13} /> Void Invoice
                  </button>
                </div>
              )}

            </div>
          </div>
        </div>
      )}

      {/* 5. Add Ambassador Modal */}
      {isAddAmbassadorModalOpen && (
        <div className="fixed inset-0 bg-onyx-canvas/80 backdrop-blur-sm z-50 flex justify-center items-center p-4">
          <div className="bg-onyx-panel border border-onyx-border rounded-lg w-full max-w-sm overflow-hidden flex flex-col font-mono text-xs shadow-glow-purple animate-fade-in">
            <div className="p-4 border-b border-onyx-border flex justify-between items-center bg-onyx-panel/80">
              <span className="text-[10px] text-onyx-accent-purple font-bold tracking-widest uppercase">Register Ambassador Referral</span>
              <button onClick={() => setIsAddAmbassadorModalOpen(false)} className="text-onyx-muted hover:text-onyx-bright transition-colors">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleAddAmbassadorSubmit} className="p-4 space-y-3.5">
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Partner Name *</label>
                <input
                  type="text"
                  required
                  placeholder="Aria Sterling Partner"
                  value={newAmbName}
                  onChange={(e) => setNewAmbName(e.target.value)}
                  className="w-full bg-onyx-canvas border border-onyx-border rounded p-2 text-xs text-onyx-bright focus:outline-none focus:border-zinc-500 font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Referral Discount Code *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. ARIA5"
                  value={newAmbCode}
                  onChange={(e) => setNewAmbCode(e.target.value)}
                  className="w-full bg-onyx-canvas border border-onyx-border rounded p-2 text-xs text-onyx-bright focus:outline-none focus:border-zinc-500 font-mono"
                />
              </div>

              {currentUser?.role === 'global_admin' && (
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Tenant Lock Bind</label>
                  <select
                    value={newAmbTenant}
                    onChange={(e) => setNewAmbTenant(e.target.value as TenantCompany | 'none')}
                    className="w-full bg-onyx-canvas border border-onyx-border rounded p-2 text-xs text-onyx-bright focus:outline-none focus:border-zinc-500 font-mono"
                  >
                    <option value="none">None (Global)</option>
                    <option value="skill_tank">Skill Tank Systems</option>
                    <option value="vriddhi">Vriddhi Logistics</option>
                    <option value="tobofu">Tobofu Agri Group</option>
                    <option value="promtal">Promtal Media</option>
                    <option value="maceco">Maceco Roman Steel</option>
                  </select>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-2.5 rounded bg-onyx-accent-purple hover:bg-fuchsia-400 text-onyx-canvas font-bold uppercase tracking-widest transition-all mt-4"
              >
                Register Ambassador
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
