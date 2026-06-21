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
  Lock,
  ShieldCheck,
  ArrowUpRight,
  Menu,
  Globe,
  Briefcase,
  GraduationCap
} from 'lucide-react';
import { useZetaStore } from '../store/zetaStore';
import { initZetaAgents, stopZetaAgents } from '../agents/zetaOrchestrator';
import { redactConfidentialData } from '../agents/agentRouter';
import SecureMailbox, { KineticTextScrambler } from './SecureMailbox';
import AdminHRPortal from './AdminHRPortal';
import type { Lead, WarehouseAsset, ThoughtLedgerEntry, Invoice, InvoiceStatus, Ambassador } from '../types/zeta';
import type { TenantCompany, PipelineStage } from '../types/zeta';

// ─── Types ────────────────────────────────────────────────────────────────────

type NavView = 'dashboard' | 'crm' | 'erp' | 'invoices' | 'ambassadors' | 'mailbox' | 'hr_portal';
type TenantFilter = TenantCompany | 'global';

// Flywheel cross-sell toast state interface
interface FlywheelToast {
  id: string;
  leadName: string;
  tenant: string;
  visible: boolean;
}

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
  hiddenMobile,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
  sub?: string;
  hiddenMobile?: boolean;
}) => {
  const themeProfile = useZetaStore((s) => s.themeProfile);
  const isOnyx = themeProfile === 'ONYX';
  return (
    <div className={`snap-center flex-shrink-0 ${
      hiddenMobile ? 'hidden max-md:hidden md:flex' : 'flex'
    } min-w-[150px] max-w-[150px] h-16 p-2 flex flex-col justify-center bg-[#09090b]/50 border border-zinc-800 rounded-lg transition-all duration-200 ${
      isOnyx 
        ? 'md:bg-[#09090b] md:text-[#fafafa] md:border-[#27272a] md:hover:border-zinc-500 md:shadow-zinc-950/50' 
        : 'md:bg-[#f4f4f5] md:text-[#09090b] md:border-[#e4e4e7] md:hover:border-zinc-300 md:shadow-zinc-200'
    } md:p-6 md:min-w-0 md:max-w-none md:h-auto md:flex-1 md:border md:rounded-xl md:shadow-2xl md:gap-4 md:bg-inherit`}>
      <div className="flex items-center justify-between gap-1">
        <span className={`text-[9px] md:text-sm font-semibold tracking-wider uppercase truncate ${
          isOnyx ? 'text-zinc-400' : 'text-zinc-600'
        }`}>{label}</span>
        <div className={`p-1 md:p-2 rounded-lg ${color} flex-shrink-0`}>
          <Icon size={12} className="md:hidden" />
          <Icon size={16} className="hidden md:block" />
        </div>
      </div>
      <div className={`text-sm md:text-3xl font-bold tracking-tight truncate ${
        isOnyx ? 'text-[#fafafa]' : 'text-black'
      }`}>{value}</div>
      {sub && <div className={`hidden md:block text-xs font-medium ${
        isOnyx ? 'text-zinc-500' : 'text-zinc-600'
      }`}>{sub}</div>}
    </div>
  );
};

// AI Next-Action suggestion engine
const getNextAction = (lead: Lead): { text: string; color: string } => {
  switch (lead.pipelineStage) {
    case 'PROSPECT': return { text: '→ Schedule Discovery Call', color: 'text-onyx-accent-cyan' };
    case 'QUALIFICATION': return { text: '→ Send Capability Deck', color: 'text-onyx-accent-purple' };
    case 'PROPOSAL': return { text: '→ Follow Up on RFP', color: 'text-onyx-accent-amber' };
    case 'NEGOTIATION': return { text: '→ Escalate to Director', color: 'text-orange-400' };
    case 'CLOSED_WON': return { text: '✓ Initiate Onboarding', color: 'text-onyx-accent-green' };
    case 'CLOSED_LOST': return { text: '↺ Re-engagement in 90d', color: 'text-zinc-500' };
    default: return { text: '→ Review Lead', color: 'text-zinc-400' };
  }
};

const LeadCard = ({ lead, onClick }: { lead: Lead; onClick: () => void }) => {
  const themeProfile = useZetaStore((s) => s.themeProfile);
  const isOnyx = themeProfile === 'ONYX';
  const nextAction = getNextAction(lead);
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
      {/* AI Next-Action Badge */}
      <p className={`text-[10px] font-mono mt-2 font-semibold truncate ${nextAction.color}`}>{nextAction.text}</p>
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

const fallbackMockLeads: Lead[] = [
  {
    id: 'lead_mock_1',
    name: 'Aria Thorne',
    companyName: 'SkillTank Systems',
    company: 'SkillTank Systems',
    potentialValue: 2500,
    value: 2500,
    pipelineStage: 'PROSPECT',
    stage: 'prospect',
    tenant_company: 'skill_tank',
    tenantContext: 'skill_tank',
    dealVelocity: 3,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    activityLogs: ['Scoping call completed']
  } as any,
  {
    id: 'lead_mock_2',
    name: 'Beckett Thorne',
    companyName: 'Cyberia Solutions',
    company: 'Cyberia Solutions',
    potentialValue: 4500,
    value: 4500,
    pipelineStage: 'QUALIFICATION',
    stage: 'qualification',
    tenant_company: 'skill_tank',
    tenantContext: 'skill_tank',
    dealVelocity: 5,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    activityLogs: ['Introduction request received']
  } as any,
  {
    id: 'lead_mock_3',
    name: 'Clara Sterling',
    companyName: 'Sterling Operations',
    company: 'Sterling Operations',
    potentialValue: 15000,
    value: 15000,
    pipelineStage: 'CLOSED_WON',
    stage: 'won',
    tenant_company: 'skill_tank',
    tenantContext: 'skill_tank',
    dealVelocity: 14,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    activityLogs: ['Contract signed']
  } as any,
  {
    id: 'lead_mock_4',
    name: 'Devon Brooks',
    companyName: 'Vriddhi Logistics',
    company: 'Vriddhi Logistics',
    potentialValue: 8500,
    value: 8500,
    pipelineStage: 'PROPOSAL',
    stage: 'proposal',
    tenant_company: 'vriddhi',
    tenantContext: 'vriddhi',
    dealVelocity: 8,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    activityLogs: ['Proposal v1 delivered']
  } as any,
  {
    id: 'lead_mock_5',
    name: 'Elena Rostova',
    companyName: 'Red Star Holdings',
    company: 'Red Star Holdings',
    potentialValue: 12000,
    value: 12000,
    pipelineStage: 'NEGOTIATION',
    stage: 'negotiation',
    tenant_company: 'vriddhi',
    tenantContext: 'vriddhi',
    dealVelocity: 19,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    activityLogs: ['Contract terms under discussion']
  } as any,
  {
    id: 'lead_mock_6',
    name: 'Luna Lovegood',
    companyName: 'The Quibbler Publishing',
    company: 'The Quibbler Publishing',
    potentialValue: 5000,
    value: 5000,
    pipelineStage: 'CLOSED_LOST',
    stage: 'lost',
    tenant_company: 'promtal',
    tenantContext: 'promtal',
    dealVelocity: 9,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    activityLogs: ['Lost to competitor']
  } as any
];

const INITIAL_SEED_LEADS = fallbackMockLeads;

const fallbackMockAssets: WarehouseAsset[] = [
  {
    id: 'asset_mock_1',
    skuCode: 'SKU-MON-27',
    name: 'UltraWide 27" Monitor',
    description: 'IPS QHD Resolution Office Monitor',
    quantity: 4,
    restockThreshold: 5,
    isBelowThreshold: true,
    unitPrice: 299.99,
    warehouseLocation: 'A-Row-2-Shelf-4',
    updatedAt: new Date().toISOString()
  },
  {
    id: 'asset_mock_2',
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
    id: 'asset_mock_3',
    skuCode: 'SKU-LAP-Z1',
    name: 'Zeta Pro Laptop Z1',
    description: 'Core Ultra 7, 32GB RAM, 1TB SSD',
    quantity: 12,
    restockThreshold: 3,
    isBelowThreshold: false,
    unitPrice: 1499.00,
    warehouseLocation: 'Secured-Cage-1',
    updatedAt: new Date().toISOString()
  }
];

const fallbackMockInvoices: Invoice[] = [
  {
    id: 'inv_mock_1',
    invoiceNumber: 'INV-2026-001',
    customerId: 'lead_mock_3',
    customerName: 'Clara Sterling (Sterling Operations)',
    issueDate: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 25 * 24 * 3600 * 1000).toISOString().split('T')[0],
    lineItems: [
      { id: 'li_1', assetId: 'asset_mock_2', description: 'Mechanical Keyboard MX', quantity: 2, unitPrice: 89.99, totalPrice: 179.98 }
    ],
    subtotal: 179.98,
    taxRate: 0.1,
    taxAmount: 18.00,
    discount: 10.00,
    total: 187.98,
    status: 'PAID',
    ambassadorCode: 'AMB-ST-01',
    createdAt: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
    tenantContext: 'skill_tank'
  } as any,
  {
    id: 'inv_mock_2',
    invoiceNumber: 'INV-2026-002',
    customerId: 'lead_mock_4',
    customerName: 'Devon Brooks (Vriddhi Logistics)',
    issueDate: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString().split('T')[0],
    dueDate: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString().split('T')[0],
    lineItems: [
      { id: 'li_2', assetId: 'asset_mock_3', description: 'Zeta Pro Laptop Z1', quantity: 1, unitPrice: 1499.00, totalPrice: 1499.00 }
    ],
    subtotal: 1499.00,
    taxRate: 0.1,
    taxAmount: 149.90,
    discount: 50.00,
    total: 1598.90,
    status: 'OVERDUE',
    ambassadorCode: 'AMB-VR-02',
    createdAt: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
    tenantContext: 'vriddhi'
  } as any,
  {
    id: 'inv_mock_3',
    invoiceNumber: 'INV-2026-003',
    customerId: 'lead_mock_1',
    customerName: 'Aria Thorne (SkillTank Systems)',
    issueDate: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 29 * 24 * 3600 * 1000).toISOString().split('T')[0],
    lineItems: [
      { id: 'li_3', assetId: 'asset_mock_1', description: 'UltraWide 27" Monitor', quantity: 1, unitPrice: 299.99, totalPrice: 299.99 }
    ],
    subtotal: 299.99,
    taxRate: 0.1,
    taxAmount: 30.00,
    discount: 0.00,
    total: 329.99,
    status: 'SENT',
    ambassadorCode: 'AMB-ST-01',
    createdAt: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString(),
    tenantContext: 'skill_tank'
  } as any,
  {
    id: 'inv_mock_4',
    invoiceNumber: 'INV-2026-004',
    customerId: 'lead_mock_2',
    customerName: 'Beckett Thorne (Cyberia Solutions)',
    issueDate: new Date(Date.now()).toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().split('T')[0],
    lineItems: [
      { id: 'li_4', assetId: 'asset_mock_2', description: 'Mechanical Keyboard MX', quantity: 3, unitPrice: 89.99, totalPrice: 269.97 }
    ],
    subtotal: 269.97,
    taxRate: 0.1,
    taxAmount: 27.00,
    discount: 15.00,
    total: 281.97,
    status: 'SENT',
    ambassadorCode: 'AMB-PR-03',
    createdAt: new Date().toISOString(),
    tenantContext: 'skill_tank'
  } as any
];

const fallbackMockAmbassadors: Ambassador[] = [
  { id: 'amb_1', code: 'AMB-ST-01', name: 'Alex Partner', tenant_company: 'skill_tank', tenantContext: 'skill_tank', createdAt: new Date().toISOString() } as any,
  { id: 'amb_2', code: 'AMB-VR-02', name: 'Brandon Partner', tenant_company: 'vriddhi', tenantContext: 'vriddhi', createdAt: new Date().toISOString() } as any,
  { id: 'amb_3', code: 'AMB-PR-03', name: 'Kai Partner', tenant_company: 'promtal', tenantContext: 'promtal', createdAt: new Date().toISOString() } as any,
  { id: 'amb_4', code: 'AMB-TB-04', name: 'Gideon Partner', tenant_company: 'tobofu', tenantContext: 'tobofu', createdAt: new Date().toISOString() } as any,
  { id: 'amb_5', code: 'AMB-MC-05', name: 'Jordan Partner', tenant_company: 'maceco', tenantContext: 'maceco', createdAt: new Date().toISOString() } as any
];

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
  const storeLeads = useZetaStore((s) => s.leads);
  const storeWarehouseAssets = useZetaStore((s) => s.warehouseAssets);
  const storeInvoices = useZetaStore((s) => s.invoices);
  const storeAmbassadors = useZetaStore((s) => s.ambassadors);

  const [leads, setLeads] = useState<Lead[]>(() => {
    const cached = localStorage.getItem('zeta_leads');
    return cached ? JSON.parse(cached) : INITIAL_SEED_LEADS;
  });

  const [warehouseAssets, setWarehouseAssets] = useState<WarehouseAsset[]>(() => {
    const cached = localStorage.getItem('zeta_warehouse_assets');
    return cached ? JSON.parse(cached) : fallbackMockAssets;
  });

  const [invoices, setInvoices] = useState<Invoice[]>(() => {
    const cached = localStorage.getItem('zeta_invoices');
    return cached ? JSON.parse(cached) : fallbackMockInvoices;
  });

  const [ambassadors, setAmbassadors] = useState<Ambassador[]>(() => {
    const cached = localStorage.getItem('zeta_ambassadors');
    return cached ? JSON.parse(cached) : fallbackMockAmbassadors;
  });

  const agentThoughtLedger = useZetaStore((s) => s.agentThoughtLedger);
  const internDossiers = useZetaStore((s) => s.internDossiers);
  const secureMailboxQueue = useZetaStore((s) => s.secureMailboxQueue);

  // Sync state loops with error guards
  useEffect(() => {
    if (storeLeads && storeLeads.length > 0) {
      setLeads(storeLeads);
      localStorage.setItem('zeta_leads', JSON.stringify(storeLeads));
    }
  }, [storeLeads]);

  useEffect(() => {
    if (storeWarehouseAssets && storeWarehouseAssets.length > 0) {
      setWarehouseAssets(storeWarehouseAssets);
      localStorage.setItem('zeta_warehouse_assets', JSON.stringify(storeWarehouseAssets));
    }
  }, [storeWarehouseAssets]);

  useEffect(() => {
    if (storeInvoices && storeInvoices.length > 0) {
      setInvoices(storeInvoices);
      localStorage.setItem('zeta_invoices', JSON.stringify(storeInvoices));
    }
  }, [storeInvoices]);

  useEffect(() => {
    if (storeAmbassadors && storeAmbassadors.length > 0) {
      setAmbassadors(storeAmbassadors);
      localStorage.setItem('zeta_ambassadors', JSON.stringify(storeAmbassadors));
    }
  }, [storeAmbassadors]);

  // Store actions
  const getLowStockAssets = useZetaStore((s) => s.getLowStockAssets);
  const addLead = useZetaStore((s) => s.addLead);
  const updateLeadStage = useZetaStore((s) => s.updateLeadStage);
  const logLeadActivity = useZetaStore((s) => s.logLeadActivity);
  const mergeLeads = useZetaStore((s) => s.mergeLeads);
  const triggerPipelineIngestion = useZetaStore((s) => s.triggerPipelineIngestion);
  const issueInvoice = useZetaStore((s) => s.issueInvoice);
  const restockSKU = useZetaStore((s) => s.restockSKU);
  const restockAsset = useZetaStore((s) => s.restockAsset);
  const addAmbassador = useZetaStore((s) => s.addAmbassador);
  const updateInvoiceStatus = useZetaStore((s) => s.updateInvoiceStatus);
  const createInternDossierAction = useZetaStore((s) => s.createInternDossierAction);
  const dispatchSecureMessage = useZetaStore((s) => s.dispatchSecureMessage);

  // Flywheel Cross-sell Toast System
  const [flywheelToasts, setFlywheelToasts] = useState<FlywheelToast[]>([]);

  // Subscribe to CLOSED_WON transitions via thought ledger updates for flywheel toasts
  useEffect(() => {
    const flywheelEntries = agentThoughtLedger
      .filter(e => e.thoughtProcess?.includes('[FLYWHEEL CROSS-SELL]') && e.agentName === 'NetworkAgent')
      .slice(0, 1);
    if (flywheelEntries.length > 0) {
      const entry = flywheelEntries[0];
      const toastId = `toast_${entry.id}`;
      setFlywheelToasts(prev => {
        if (prev.some(t => t.id === toastId)) return prev;
        const match = entry.thoughtProcess.match(/Opportunity detected: (.+?) \(/);
        const tenantMatch = entry.thoughtProcess.match(/for ([A-Z_]+) →/);
        const newToast: FlywheelToast = {
          id: toastId,
          leadName: match ? match[1] : 'Deal',
          tenant: tenantMatch ? tenantMatch[1] : (entry.activeTenantTrack || 'GLOBAL'),
          visible: true
        };
        return [newToast, ...prev].slice(0, 3);
      });
      // Auto-dismiss after 7 seconds
      setTimeout(() => {
        setFlywheelToasts(prev => prev.map(t => t.id === toastId ? { ...t, visible: false } : t));
        setTimeout(() => setFlywheelToasts(prev => prev.filter(t => t.id !== toastId)), 500);
      }, 7000);
    }
  }, [agentThoughtLedger]);

  // Duplicate detection state
  const [isMergeModalOpen, setIsMergeModalOpen] = useState(false);
  const [mergePrimaryId, setMergePrimaryId] = useState<string>('');
  const [mergeDuplicateId, setMergeDuplicateId] = useState<string>('');
  const [isPipelineIngesting, setIsPipelineIngesting] = useState(false);

  // ── Mobile UI State ──────────────────────────────────────────────────────────
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [isMobileTerminalOpen, setIsMobileTerminalOpen] = useState(false);
  const [activeMobileStage, setActiveMobileStage] = useState<PipelineStage>('PROSPECT');
  const [showGatewayRouter, setShowGatewayRouter] = useState(false);
  const [gatewayRouterChoice, setGatewayRouterChoice] = useState<string | null>(null);

  // Modals UI States
  const [activeLeadForModal, setActiveLeadForModal] = useState<Lead | null>(null);
  const [isAddLeadModalOpen, setIsAddLeadModalOpen] = useState(false);
  const [assetForInvoiceModal, setAssetForInvoiceModal] = useState<WarehouseAsset | null>(null);
  const [activeInvoiceForModal, setActiveInvoiceForModal] = useState<Invoice | null>(null);
  const [isAddAmbassadorModalOpen, setIsAddAmbassadorModalOpen] = useState(false);
  const [isAddDossierMobileOpen, setIsAddDossierMobileOpen] = useState(false);
  const [isDispatchMobileOpen, setIsDispatchMobileOpen] = useState(false);

  // Mobile form input states
  const [mobileDossierName, setMobileDossierName] = useState('');
  const [mobileDossierEmail, setMobileDossierEmail] = useState('');
  const [mobileDossierRole, setMobileDossierRole] = useState('');
  const [mobileDossierTenant, setMobileDossierTenant] = useState<TenantCompany>('skill_tank');
  const [mobileDossierStipend, setMobileDossierStipend] = useState('2000');

  const [mobileDispatchRecipient, setMobileDispatchRecipient] = useState('');
  const [mobileDispatchSubject, setMobileDispatchSubject] = useState<'PAYROLL' | 'COMPLAINT' | 'PERFORMANCE'>('PAYROLL');
  const [mobileDispatchBody, setMobileDispatchBody] = useState('');

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

  // Lock scroll when any mobile menu or modal is active
  const isAnyOverlayOpen = 
    isMobileDrawerOpen || 
    showGatewayRouter || 
    isMobileTerminalOpen || 
    !!activeLeadForModal || 
    isAddLeadModalOpen || 
    !!assetForInvoiceModal || 
    isAddDossierMobileOpen || 
    isDispatchMobileOpen;

  useEffect(() => {
    if (isAnyOverlayOpen) {
      document.body.classList.add('overflow-hidden');
    } else {
      document.body.classList.remove('overflow-hidden');
    }
    return () => {
      document.body.classList.remove('overflow-hidden');
    };
  }, [isAnyOverlayOpen]);


  // Async data fetching on user login or change
  useEffect(() => {
    if (currentUser) {
      useZetaStore.getState().fetchLeadsAction().catch(err => console.warn('Leads fetch 404 or drop, using fallback cache', err));
      useZetaStore.getState().fetchInvoicesAction().catch(err => console.warn('Invoices fetch 404 or drop, using fallback cache', err));
      useZetaStore.getState().fetchAmbassadorsAction().catch(err => console.warn('Ambassadors fetch 404 or drop, using fallback cache', err));
    }
  }, [currentUser]);

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
    const activeWorkspace = (tenantFilter as string) === 'global' || (tenantFilter as string) === 'Global Admin' || (tenantFilter as string) === 'global_admin' ? 'Global Admin' : (tenantFilter as string);
    const allLeads = leads as any[];
    const displayedLeads = activeWorkspace === 'Global Admin' ? allLeads : allLeads.filter(l => l.tenantContext === activeWorkspace || l.tenant_company === activeWorkspace);
    let list = displayedLeads as Lead[];
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
    const activeWorkspace = (tenantFilter as string) === 'global' || (tenantFilter as string) === 'Global Admin' || (tenantFilter as string) === 'global_admin' ? 'Global Admin' : (tenantFilter as string);
    let list = invoices;
    if (activeWorkspace !== 'Global Admin') {
      list = invoices.filter((i) => {
        const lead = leads.find((l) => l.id === i.customerId);
        const tenantMatches = lead ? (lead.tenant_company === activeWorkspace || (lead as any).tenantContext === activeWorkspace) : false;
        const invoiceMatches = (i as any).tenantContext === activeWorkspace;
        return tenantMatches || invoiceMatches;
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

  const displayedAmbassadors = useMemo(() => {
    const activeWorkspace = (tenantFilter as string) === 'global' || (tenantFilter as string) === 'Global Admin' || (tenantFilter as string) === 'global_admin' ? 'Global Admin' : (tenantFilter as string);
    const allAmbassadors = ambassadorStats;
    const displayedItems = activeWorkspace === 'Global Admin' ? allAmbassadors : allAmbassadors.filter(item => (item as any).tenantContext === activeWorkspace || item.tenant_company === activeWorkspace);
    return displayedItems;
  }, [ambassadorStats, tenantFilter]);

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

  const handleGatewayChoice = (choice: 'student' | 'enterprise' | 'coordinator') => {
    setGatewayRouterChoice(choice);
    
    let targetVenture = '';
    let msg = '';
    if (choice === 'student') {
      targetVenture = 'Skill Tank';
      msg = 'Redirecting to Skill Tank internship onboarding portal...';
    } else if (choice === 'enterprise') {
      targetVenture = 'Vriddhi';
      msg = 'Routing query to Vriddhi B2B enterprise pipeline...';
    } else {
      targetVenture = 'Promtal';
      msg = 'Forwarding college coordinator registration to Promtal...';
    }
    
    const newToast: FlywheelToast = {
      id: `gateway_${Date.now()}`,
      leadName: `User (${choice.toUpperCase()})`,
      tenant: targetVenture.toUpperCase().replace(' ', '_'),
      visible: true
    };
    
    setFlywheelToasts(prev => [newToast, ...prev]);
    alert(`${msg}\nCross-sell matching initiated for ${targetVenture}.`);
    
    setTimeout(() => {
      setShowGatewayRouter(false);
      setGatewayRouterChoice(null);
    }, 500);
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
    <div className={`flex flex-col min-h-screen max-w-full overflow-hidden font-sans select-none relative md:flex-row md:h-screen md:w-screen ${
      isOnyx ? 'bg-[#000000] text-[#fafafa] border-[#27272a]' : 'bg-[#ffffff] text-[#09090b] border-[#e4e4e7]'
    }`}>
      <header className="w-full h-14 flex items-center justify-between px-3 bg-zinc-950 border-b border-zinc-900 fixed top-0 z-40 md:hidden">
        <div className="flex items-center gap-2">
          <div className={`w-6 h-6 rounded flex items-center justify-center border ${
            isOnyx ? 'bg-onyx-accent-green/10 border-onyx-accent-green/30' : 'bg-emerald-800/10 border-emerald-800/30'
          }`}>
            <Zap size={12} className={isOnyx ? 'text-onyx-accent-green' : 'text-emerald-800'} />
          </div>
          <span className="text-xs font-bold tracking-tight text-white">ZETA</span>
        </div>
        
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setIsMobileTerminalOpen(true)}
            className={`flex items-center gap-1 px-2 py-1 border rounded-full text-[10px] font-bold font-mono tracking-wider transition-all ${
              isOnyx
                ? 'bg-onyx-accent-green/10 border-onyx-accent-green/20 text-onyx-accent-green'
                : 'bg-emerald-50 border-emerald-200 text-emerald-800'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" />
            <span>Sync</span>
          </button>

          <button
            onClick={() => setShowGatewayRouter(true)}
            className={`flex items-center justify-center gap-1 px-2 py-1 border rounded-full text-[10px] font-bold uppercase transition-all tracking-wider ${
              isOnyx
                ? 'bg-onyx-accent-purple/10 border-onyx-accent-purple/30 text-onyx-accent-purple hover:bg-onyx-accent-purple/20'
                : 'bg-fuchsia-50 border-fuchsia-300 text-fuchsia-800 hover:bg-fuchsia-100'
            }`}
          >
            <Globe size={10} />
            <span>Router</span>
          </button>
          
          <button 
            onClick={() => setIsMobileDrawerOpen(true)}
            className={`p-1.5 rounded-full border transition-all flex items-center justify-center ${
              isOnyx ? 'bg-zinc-950 border-zinc-800 hover:border-zinc-600 text-zinc-300' : 'bg-white border-zinc-200 hover:border-zinc-400 text-zinc-700'
            }`}
          >
            <Menu size={14} />
          </button>
        </div>
      </header>

      {/* Mobile Drawer Overlay */}
      {isMobileDrawerOpen && (
        <div 
          className="fixed inset-0 z-45 md:hidden bg-black/60 backdrop-blur-sm"
          onClick={() => setIsMobileDrawerOpen(false)}
        >
          <div 
            className={`w-64 h-full border-r flex flex-col transition-all duration-300 transform translate-x-0 ${
              isOnyx ? 'bg-[#000000] text-[#fafafa] border-[#27272a]' : 'bg-[#ffffff] text-[#09090b] border-[#e4e4e7]'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Logo & Close Button */}
            <div className={`px-4 py-4 border-b flex items-center justify-between ${isOnyx ? 'border-[#27272a]' : 'border-[#e4e4e7]'}`}>
              <div className="flex items-center gap-2.5">
                <div className={`w-7 h-7 rounded-md flex items-center justify-center border ${
                  isOnyx ? 'bg-onyx-accent-green/10 border-onyx-accent-green/30' : 'bg-emerald-800/10 border-emerald-800/30'
                }`}>
                  <Zap size={14} className={isOnyx ? 'text-onyx-accent-green' : 'text-emerald-800'} />
                </div>
                <span className={`text-sm font-bold tracking-tight ${isOnyx ? 'text-[#fafafa]' : 'text-black'}`}>ZETA</span>
              </div>
              <button 
                onClick={() => setIsMobileDrawerOpen(false)}
                className={`p-1.5 rounded-md border min-h-[44px] min-w-[44px] flex items-center justify-center ${
                  isOnyx ? 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-white' : 'bg-white border-zinc-200 text-zinc-500 hover:text-black'
                }`}
              >
                <X size={14} />
              </button>
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
                      id="mobile-tenant-switcher-btn"
                      onClick={() => setTenantDropOpen((o) => !o)}
                      className={`w-full flex items-center justify-between border rounded-md px-3 py-3 min-h-[44px] text-xs font-semibold transition-colors duration-150 ${
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
                              setIsMobileDrawerOpen(false);
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
                    id={`mobile-nav-${id}`}
                    onClick={() => {
                      setActiveNav(id);
                      setIsMobileDrawerOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-3 min-h-[44px] rounded-md text-xs font-medium transition-all duration-150 ${
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
                onClick={() => {
                  lockSession();
                  setIsMobileDrawerOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-3 min-h-[44px] rounded-md text-xs font-medium border border-transparent transition-all duration-150 text-left ${
                  isOnyx 
                    ? 'text-onyx-accent-cyan hover:bg-onyx-accent-cyan/5 hover:border-onyx-accent-cyan/20' 
                    : 'text-cyan-700 hover:bg-cyan-700/5 hover:border-cyan-700/20'
                }`}
              >
                <Lock size={14} />
                <span>Lock Session</span>
              </button>

              <button
                onClick={() => {
                  logout();
                  setIsMobileDrawerOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-3 min-h-[44px] rounded-md text-xs font-medium border border-transparent transition-all duration-150 text-left ${
                  isOnyx 
                    ? 'text-onyx-accent-rose hover:bg-onyx-accent-rose/5 hover:border-onyx-accent-rose/20' 
                    : 'text-rose-700 hover:bg-rose-700/5 hover:border-rose-700/20'
                }`}
              >
                <LogOut size={14} />
                <span>Secure Log Out</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Left Navigation Rail ─────────────────────────────────────────── */}
      <aside className={`hidden md:flex w-52 flex-shrink-0 border-r flex flex-col ${
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
      <main className={`w-full max-w-full px-4 pt-16 pb-20 overflow-x-hidden block md:flex-1 md:flex md:flex-col md:min-w-0 md:overflow-hidden md:pt-0 md:px-0 md:pb-0 ${
        isOnyx ? 'bg-[#000000] text-[#fafafa] border-[#27272a]' : 'bg-[#ffffff] text-[#09090b] border-[#e4e4e7]'
      }`}>
        {/* Top bar */}
        <header className={`hidden md:flex h-12 flex-shrink-0 border-b items-center px-5 gap-4 ${isOnyx ? 'border-[#27272a]' : 'border-[#e4e4e7]'}`}>
          <div className="flex-1 flex items-center">
            <span className={`text-xs font-mono ${isOnyx ? 'text-zinc-500' : 'text-zinc-600'}`}>
              {tenantFilter === 'global' ? 'All Tenants' : TENANT_LABELS[tenantFilter]}
            </span>
            <span className={`mx-2 ${isOnyx ? 'text-zinc-800' : 'text-zinc-300'}`}>·</span>
            <span className={`text-xs font-semibold capitalize tracking-widest font-mono ${isOnyx ? 'text-[#fafafa]' : 'text-black'}`}>{activeNav}</span>
          </div>
          <div className="flex items-center gap-4 text-[10px] font-mono">
            <button
              onClick={() => setShowGatewayRouter(true)}
              className={`flex items-center gap-1.5 px-3 py-1 border rounded-md font-bold uppercase transition-all tracking-wider ${
                isOnyx
                  ? 'bg-onyx-accent-purple/10 border-onyx-accent-purple/30 text-onyx-accent-purple hover:bg-onyx-accent-purple/20 shadow-sm shadow-fuchsia-950/20'
                  : 'bg-fuchsia-50 border-fuchsia-300 text-fuchsia-800 hover:bg-fuchsia-100'
              }`}
            >
              <Globe size={11} />
              Venture Router
            </button>
            <span className={`select-none ${isOnyx ? 'text-zinc-800' : 'text-zinc-300'}`}>|</span>
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

        {/* Micro KPI Ticker Strip */}
        <div className="flex flex-row items-center gap-2 overflow-x-auto scrollbar-none w-full py-1 border-b border-zinc-900/50 mb-3 md:hidden">
          <div className="px-2 py-0.5 bg-zinc-950 border border-zinc-800 rounded-full text-[10px] text-zinc-400 whitespace-nowrap">
            Rev: ${totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <div className="px-2 py-0.5 bg-zinc-950 border border-zinc-800 rounded-full text-[10px] text-zinc-400 whitespace-nowrap">
            Conv: {conversionRate}%
          </div>
          <div className="px-2 py-0.5 bg-zinc-950 border border-zinc-800 rounded-full text-[10px] text-zinc-400 whitespace-nowrap">
            Stock: {lowStockCount}
          </div>
          <div className="px-2 py-0.5 bg-zinc-950 border border-zinc-800 rounded-full text-[10px] text-zinc-400 whitespace-nowrap">
            Compliance: 94.8%
          </div>
        </div>

        {/* High-Performance Mobile Quick Action Launchpad */}
        <div className="grid grid-cols-3 gap-2 w-full mb-4 md:hidden">
          <button
            onClick={() => setIsAddLeadModalOpen(true)}
            className="h-10 bg-zinc-900 border border-zinc-800 rounded-lg text-xs font-semibold text-zinc-200 flex items-center justify-center active:scale-95 transition-transform"
          >
            + Lead
          </button>
          <button
            onClick={() => setIsAddDossierMobileOpen(true)}
            className="h-10 bg-zinc-900 border border-zinc-800 rounded-lg text-xs font-semibold text-zinc-200 flex items-center justify-center active:scale-95 transition-transform"
          >
            + Dossier
          </button>
          <button
            onClick={() => setIsDispatchMobileOpen(true)}
            className="h-10 bg-zinc-900 border border-zinc-800 rounded-lg text-xs font-semibold text-zinc-200 flex items-center justify-center active:scale-95 transition-transform"
          >
            + Dispatch
          </button>
        </div>

        {/* KPI Grid */}
        <section className={`hidden md:block flex-shrink-0 p-4 border-b ${isOnyx ? 'border-[#27272a]' : 'border-[#e4e4e7]'}`}>
          <div key={activeNav} className={`flex flex-row overflow-x-auto snap-x snap-mandatory gap-3 w-full scrollbar-none pb-4 md:grid md:grid-cols-3 ${
            ['dashboard', 'erp', 'invoices', 'ambassadors'].includes(activeNav) ? 'xl:grid-cols-4' : 'xl:grid-cols-3'
          } md:gap-6 animate-fade-in transition-all duration-200 ease-in-out`}>
            {(() => {
              switch (activeNav) {
                case 'hr_portal':
                  return (
                    <>
                      <KpiCard
                        label="TOTAL TEAM COUNT"
                        value={internDossiers.length}
                        icon={Users}
                        color="bg-onyx-accent-rose/10 text-onyx-accent-rose"
                        sub="Registered intern folders"
                      />
                      <KpiCard
                        label="GLOBAL COMPLIANCE"
                        value="94.8%"
                        icon={ShieldCheck}
                        color="bg-onyx-accent-green/10 text-onyx-accent-green"
                        sub="HSM key encryption pass"
                        hiddenMobile
                      />
                      <KpiCard
                        label="PENDING MONITORING DEPLOYMENTS"
                        value={internDossiers.reduce((sum, d) => sum + d.work_history_stream.filter(t => !t.reviewer_notes).length, 0) || 4}
                        icon={Activity}
                        color="bg-onyx-accent-amber/10 text-onyx-accent-amber"
                        sub="Active monitoring tasks"
                      />
                    </>
                  );
                case 'crm':
                  return (
                    <>
                      <KpiCard
                        label="ACTIVE PIPELINE DEALS"
                        value={filteredLeads.length}
                        icon={Users}
                        color="bg-onyx-accent-cyan/10 text-onyx-accent-cyan"
                        sub="Total opportunities"
                      />
                      <KpiCard
                        label="PIPELINE VALUE"
                        value={`$${filteredLeads.reduce((sum, lead) => sum + (lead.potentialValue || 0), 0).toLocaleString('en-US')}`}
                        icon={DollarSign}
                        color="bg-onyx-accent-green/10 text-onyx-accent-green"
                        sub="Gross contract value"
                      />
                      <KpiCard
                        label="WIN GRADIENT"
                        value={(() => {
                          const total = filteredLeads.length;
                          if (total === 0) return '0.0%';
                          const wonCount = filteredLeads.filter(l => l.pipelineStage === 'CLOSED_WON').length;
                          return `+${((wonCount / total) * 100).toFixed(1)}%`;
                        })()}
                        icon={ArrowUpRight}
                        color="bg-onyx-accent-purple/10 text-onyx-accent-purple"
                        sub="Won deal velocity indicator"
                      />
                    </>
                  );
                case 'mailbox':
                  return (
                    <>
                      <KpiCard
                        label="ENCRYPTED DISPATCHES"
                        value={secureMailboxQueue.length}
                        icon={Send}
                        color="bg-onyx-accent-cyan/10 text-onyx-accent-cyan"
                        sub="Safe communication queue"
                      />
                      <KpiCard
                        label="SESSION SYNC STATUS"
                        value="SECURE (AES-256)"
                        icon={Lock}
                        color="bg-onyx-accent-green/10 text-onyx-accent-green"
                        sub="Active token validated"
                        hiddenMobile
                      />
                      <KpiCard
                        label="THREAT SURFACE"
                        value="0.00%"
                        icon={AlertTriangle}
                        color="bg-zinc-800 text-zinc-500"
                        sub="Vulnerability Detected"
                        hiddenMobile
                      />
                    </>
                  );
                default:
                  return (
                    <>
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
                    </>
                  );
              }
            })()}
          </div>
        </section>

        {/* Dynamic Panel Renderer */}
        <div className="w-full max-w-full px-4 pt-16 pb-24 overflow-x-hidden block box-border md:flex-1 md:overflow-auto md:p-6 md:min-h-0">
          
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
                <div className={`border rounded-xl p-6 flex flex-col gap-4 shadow-2xl flex-1 ${isOnyx ? 'bg-[#09090b] border-[#27272a] shadow-zinc-950/40' : 'bg-[#f4f4f5] border-[#e4e4e7] shadow-zinc-200'}`}>
                  <h3 className={`text-lg font-semibold tracking-wide uppercase border-b pb-2 ${isOnyx ? 'text-onyx-accent-rose border-[#27272a]/50' : 'text-rose-700 border-[#e4e4e7]'}`}>Stuck & High-Value Deals</h3>
                  <div className="flex-1 min-h-[200px] overflow-y-auto space-y-3 pr-1">
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
                <div className={`border rounded-xl p-6 flex flex-col gap-4 shadow-2xl flex-1 ${isOnyx ? 'bg-[#09090b] border-[#27272a] shadow-zinc-950/40' : 'bg-[#f4f4f5] border-[#e4e4e7] shadow-zinc-200'}`}>
                  <div className={`flex justify-between items-center border-b pb-2 ${isOnyx ? 'border-[#27272a]/50' : 'border-[#e4e4e7]'}`}>
                    <h3 className={`text-lg font-semibold tracking-wide uppercase ${isOnyx ? 'text-onyx-accent-amber' : 'text-amber-700'}`}>Critical Warehouse Deficits</h3>
                    <button onClick={() => setActiveNav('erp')} className={`text-sm hover:underline font-semibold ${isOnyx ? 'text-onyx-accent-amber' : 'text-amber-700'}`}>View ERP</button>
                  </div>
                  <div className="flex-1 min-h-[300px] overflow-y-auto space-y-3 pr-1">
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

 
              </div>
            </div>
          )}

          {/* 2. CRM Tab */}
          {activeNav === 'crm' && (
            <div className="flex flex-col gap-4 h-full">
              {/* Toolbar */}
              <div className="flex justify-between items-center flex-wrap gap-2">
                <div className="flex gap-2 flex-wrap items-center">
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
                  {/* ADS Pipeline Ingestion Simulator */}
                  <button
                    id="ads-pipeline-ingestion-btn"
                    onClick={() => {
                      setIsPipelineIngesting(true);
                      triggerPipelineIngestion(tenantFilter);
                      setTimeout(() => setIsPipelineIngesting(false), 2500);
                    }}
                    disabled={isPipelineIngesting}
                    className={`flex items-center gap-1.5 text-xs font-bold px-3.5 py-2 rounded border transition-all font-mono ${
                      isPipelineIngesting
                        ? 'bg-onyx-accent-cyan/5 border-onyx-accent-cyan/20 text-onyx-accent-cyan cursor-wait animate-pulse'
                        : 'bg-onyx-accent-cyan/10 border-onyx-accent-cyan/30 text-onyx-accent-cyan hover:bg-onyx-accent-cyan/20'
                    }`}
                  >
                    <Zap size={13} />
                    {isPipelineIngesting ? 'INGESTING...' : 'ADS PIPELINE INGESTION'}
                  </button>
                  {/* Merge Records Trigger */}
                  {filteredLeads.length >= 2 && (
                    <button
                      id="merge-records-btn"
                      onClick={() => {
                        setMergePrimaryId(filteredLeads[0].id);
                        setMergeDuplicateId(filteredLeads[1].id);
                        setIsMergeModalOpen(true);
                      }}
                      className="flex items-center gap-1.5 text-xs font-bold px-3.5 py-2 rounded border border-onyx-accent-amber/30 text-onyx-accent-amber bg-onyx-accent-amber/5 hover:bg-onyx-accent-amber/15 transition-all font-mono"
                    >
                      <RefreshCw size={13} /> MERGE RECORDS
                    </button>
                  )}
                </div>
                <button 
                  onClick={() => setIsAddLeadModalOpen(true)}
                  className="flex items-center gap-1.5 text-xs font-semibold text-onyx-canvas bg-onyx-accent-green hover:bg-emerald-400 px-3.5 py-2 rounded shadow-glow-green transition-all"
                >
                  <Plus size={14} /> Add Lead
                </button>
              </div>

              {/* Mobile Stage Selector */}
              <div className="flex md:hidden overflow-x-auto gap-1.5 pb-2 scrollbar-none flex-shrink-0">
                {PIPELINE_STAGES.map((stage) => {
                  const stageLeads = filteredLeads.filter((l) => l.pipelineStage === stage);
                  const isActive = activeMobileStage === stage;
                  return (
                    <button
                      key={stage}
                      onClick={() => setActiveMobileStage(stage)}
                      className={`flex-shrink-0 px-3 py-1.5 rounded-full text-[10px] font-bold font-mono tracking-wider transition-all border ${
                        isActive
                          ? (isOnyx 
                              ? 'bg-onyx-accent-cyan/20 border-onyx-accent-cyan text-onyx-accent-cyan' 
                              : 'bg-cyan-100 border-cyan-600 text-cyan-800')
                          : (isOnyx 
                              ? 'bg-[#09090b] border-[#27272a] text-zinc-400 hover:text-zinc-200' 
                              : 'bg-[#f4f4f5] border-[#e4e4e7] text-zinc-600 hover:text-zinc-950')
                      }`}
                    >
                      {stage.replace('_', ' ')} ({stageLeads.length})
                    </button>
                  );
                })}
              </div>

              {/* Mobile Stage Card Column */}
              <div className="flex md:hidden flex-col flex-1 min-h-0 overflow-y-auto bg-onyx-panel/20 border border-onyx-border/60 rounded-xl p-4">
                {(() => {
                  const stageLeads = filteredLeads.filter((l) => l.pipelineStage === activeMobileStage);
                  if (stageLeads.length === 0) {
                    return (
                      <div className="text-center text-xs text-onyx-muted py-12 border border-dashed border-onyx-border rounded-xl">
                        No opportunities in {activeMobileStage.replace('_', ' ')}
                      </div>
                    );
                  }
                  return stageLeads.map((lead) => (
                    <LeadCard 
                      key={lead.id} 
                      lead={lead} 
                      onClick={() => setActiveLeadForModal(lead)} 
                    />
                  ));
                })()}
              </div>

              {/* Desktop Kanban Board */}
              <div className="hidden md:flex gap-4 h-full overflow-x-auto pb-4 min-h-0 flex-1">
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

              {/* Table Ledger - Desktop Only */}
              <div className="bg-onyx-panel border border-onyx-border rounded-xl shadow-2xl overflow-auto flex-1 min-h-0 hidden md:block">
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

              {/* Mobile Cards View - Mobile Only */}
              <div className="block md:hidden overflow-y-auto flex-1 min-h-0 space-y-3">
                {filteredAssets.length === 0 ? (
                  <div className="text-center py-12 text-onyx-muted font-mono text-sm">No inventory records resolved.</div>
                ) : (
                  filteredAssets.map((asset) => (
                    <div key={asset.id} className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-4 mb-3 flex flex-col gap-2">
                      <div className="flex justify-between items-center border-b border-zinc-800 pb-2">
                        <span className="font-mono text-onyx-accent-cyan text-sm font-semibold">{asset.skuCode}</span>
                        {asset.isBelowThreshold ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-onyx-accent-rose bg-onyx-accent-rose/10 border border-onyx-accent-rose/20 px-2 py-0.5 rounded-md">
                            <AlertTriangle size={8} /> LOW STOCK
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-onyx-accent-green bg-onyx-accent-green/10 border border-onyx-accent-green/20 px-2 py-0.5 rounded-md">
                            HEALTHY
                          </span>
                        )}
                      </div>
                      
                      <div className="space-y-1.5 text-xs text-zinc-400 py-1 font-mono">
                        <div className="flex justify-between">
                          <span className="text-zinc-500">NAME:</span>
                          <span className="text-zinc-200 font-semibold break-words text-wrap whitespace-normal">{asset.name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-zinc-500">LOCATION:</span>
                          <span className="text-zinc-200 break-words text-wrap whitespace-normal">{asset.warehouseLocation ?? '—'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-zinc-500">STOCK:</span>
                          <span className={`font-bold ${asset.isBelowThreshold ? 'text-onyx-accent-rose' : 'text-zinc-200'}`}>
                            {asset.quantity} / {asset.restockThreshold} Threshold
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-zinc-500">UNIT PRICE:</span>
                          <span className="text-onyx-accent-green font-bold">${asset.unitPrice.toFixed(2)}</span>
                        </div>
                      </div>

                      {/* Manual Restock input row */}
                      <div className="flex items-center gap-2 mt-1 border-t border-zinc-800/50 pt-2">
                        <input 
                          type="number" 
                          placeholder="Qty" 
                          min="0"
                          value={manualRestockQty[asset.skuCode] || ''} 
                          onChange={(e) => {
                            const val = parseInt(e.target.value);
                            setManualRestockQty(prev => ({ ...prev, [asset.skuCode]: isNaN(val) ? 0 : val }));
                          }}
                          className="w-20 h-9 px-2 text-center bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-white font-mono focus:outline-none"
                        />
                        <button 
                          onClick={() => handleManualRestock(asset.skuCode)}
                          className="flex-1 h-9 bg-zinc-800 text-zinc-300 hover:text-white rounded-lg text-xs font-semibold font-mono border border-zinc-700 transition-all"
                        >
                          SET STOCK
                        </button>
                      </div>

                      {/* Bill Lead Button */}
                      <button
                        onClick={() => openInvoiceComposer(asset)}
                        disabled={asset.quantity === 0}
                        className={`w-full h-10 mt-2 bg-zinc-100 text-zinc-950 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                          asset.quantity === 0
                            ? 'bg-zinc-800 text-zinc-500 border border-zinc-700 cursor-not-allowed'
                            : 'bg-zinc-100 text-zinc-950 hover:bg-white'
                        }`}
                      >
                        <FileSignature size={12} /> Bill Lead
                      </button>
                    </div>
                  ))
                )}
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

              {/* Invoices Table - Desktop Only */}
              <div className="bg-onyx-panel border border-onyx-border rounded-xl shadow-2xl overflow-auto flex-1 min-h-0 hidden md:block">
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

              {/* Mobile Cards View - Mobile Only */}
              <div className="block md:hidden overflow-y-auto flex-1 min-h-0 space-y-3">
                {filteredInvoices.length === 0 ? (
                  <div className="text-center py-12 text-onyx-muted font-mono text-sm">No transactional receipts generated.</div>
                ) : (
                  filteredInvoices.map((invoice) => (
                    <div key={invoice.id} className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-4 mb-3 flex flex-col gap-2">
                      <div className="flex justify-between items-center border-b border-zinc-800 pb-2">
                        <span className="font-mono text-onyx-accent-cyan text-sm font-bold">{invoice.invoiceNumber}</span>
                        <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-md tracking-wider font-mono ${
                          invoice.status === 'PAID' ? 'bg-onyx-accent-green/10 text-onyx-accent-green border border-onyx-accent-green/20' :
                          invoice.status === 'SENT' ? 'bg-onyx-accent-cyan/10 text-onyx-accent-cyan border border-onyx-accent-cyan/20' :
                          invoice.status === 'OVERDUE' ? 'bg-onyx-accent-amber/10 text-onyx-accent-amber border border-onyx-accent-amber/20' :
                          'bg-zinc-800/40 text-zinc-500 border border-zinc-700/20'
                        }`}>
                          {invoice.status}
                        </span>
                      </div>
                      
                      <div className="space-y-1.5 text-xs text-zinc-400 py-1 font-mono">
                        <div className="flex justify-between">
                          <span className="text-zinc-500">CUSTOMER:</span>
                          <span className="text-zinc-200 font-semibold break-words text-wrap whitespace-normal">{invoice.customerName}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-zinc-500">DATE:</span>
                          <span className="text-zinc-200">{new Date(invoice.issueDate).toLocaleDateString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-zinc-500">SUBTOTAL / TAX:</span>
                          <span className="text-zinc-200">${invoice.subtotal.toFixed(2)} / ${invoice.taxAmount.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-zinc-500">DISCOUNT:</span>
                          <span className="text-onyx-accent-rose font-bold">-${invoice.discount.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between border-t border-zinc-800/50 pt-1.5">
                          <span className="text-zinc-500">TOTAL:</span>
                          <span className="text-onyx-accent-green font-bold text-sm">${invoice.total.toFixed(2)}</span>
                        </div>
                      </div>

                      <button
                        onClick={() => setActiveInvoiceForModal(invoice)}
                        className="w-full h-10 mt-2 bg-zinc-100 text-zinc-950 rounded-lg text-xs font-semibold hover:bg-white transition-all flex items-center justify-center"
                      >
                        View Receipt
                      </button>
                    </div>
                  ))
                )}
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

              {/* Ambassadors Table - Desktop Only */}
              <div className="bg-onyx-panel border border-onyx-border rounded-xl shadow-2xl overflow-auto flex-1 min-h-0 hidden md:block">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-onyx-border bg-onyx-panel/80">
                      {['Rank', 'Ambassador Code', 'Partner Name', 'Tenant Context', 'Total Referrals', 'Total Revenue Generated', 'Commissions Paid', 'Status'].map((h) => (
                        <th key={h} className="text-left text-xs font-bold tracking-wider uppercase text-onyx-muted py-4 px-6">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[...displayedAmbassadors]
                      .sort((a, b) => b.salesGenerated - a.salesGenerated)
                      .map((amb, idx) => {
                        const rankEmoji = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`;
                        const rankColor = idx === 0 ? 'text-yellow-400' : idx === 1 ? 'text-zinc-400' : idx === 2 ? 'text-amber-600' : 'text-zinc-600';
                        return (
                          <tr key={amb.id} className={`border-b border-onyx-border/30 hover:bg-onyx-panel/60 transition-colors ${idx % 2 === 0 ? 'bg-onyx-canvas/60' : 'bg-onyx-panel/40'}`}>
                            <td className="py-4 px-6">
                              <span className={`font-mono font-black text-sm ${rankColor}`}>{rankEmoji}</span>
                            </td>
                            <td className="py-4 px-6 font-mono text-onyx-accent-purple text-sm font-bold">{amb.code}</td>
                            <td className="py-4 px-6 text-onyx-bright font-semibold">{amb.name}</td>
                            <td className="py-4 px-6 text-onyx-muted font-mono text-sm font-semibold">{amb.tenant_company ? TENANT_LABELS[amb.tenant_company as TenantCompany] : 'GLOBAL'}</td>
                            <td className="py-4 px-6 font-mono font-bold text-center tabular-nums text-sm">{amb.referrals}</td>
                            <td className="py-4 px-6 font-mono text-onyx-accent-green font-bold text-sm">${amb.salesGenerated.toFixed(2)}</td>
                            <td className="py-4 px-6 font-mono text-onyx-accent-rose font-bold text-sm">${amb.discountsEarned.toFixed(2)}</td>
                            <td className="py-4 px-6">
                              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-onyx-accent-green bg-onyx-accent-green/10 border border-onyx-accent-green/20 px-2.5 py-1 rounded-md font-mono">
                                ACTIVE
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards View - Mobile Only */}
              <div className="block md:hidden overflow-y-auto flex-1 min-h-0 space-y-3">
                {[...displayedAmbassadors]
                  .sort((a, b) => b.salesGenerated - a.salesGenerated)
                  .map((amb, idx) => {
                    const rankEmoji = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`;
                    const rankColor = idx === 0 ? 'text-yellow-400' : idx === 1 ? 'text-zinc-400' : idx === 2 ? 'text-amber-600' : 'text-zinc-600';
                    return (
                      <div key={amb.id} className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-4 mb-3 flex flex-col gap-2">
                        <div className="flex justify-between items-center border-b border-zinc-800 pb-2">
                          <span className={`font-mono font-black text-sm ${rankColor}`}>{rankEmoji} {amb.code}</span>
                          <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-onyx-accent-green bg-onyx-accent-green/10 border border-onyx-accent-green/20 px-2 py-0.5 rounded-md font-mono">
                            ACTIVE
                          </span>
                        </div>
                        
                        <div className="space-y-1.5 text-xs text-zinc-400 py-1 font-mono">
                          <div className="flex justify-between">
                            <span className="text-zinc-500">PARTNER:</span>
                            <span className="text-zinc-200 font-semibold break-words text-wrap whitespace-normal">{amb.name}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-zinc-500">CONTEXT:</span>
                            <span className="text-zinc-200 break-words text-wrap whitespace-normal">{amb.tenant_company ? TENANT_LABELS[amb.tenant_company as TenantCompany] : 'GLOBAL'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-zinc-500">REFERRALS:</span>
                            <span className="text-zinc-200 font-bold">{amb.referrals}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-zinc-500">REVENUE GEN:</span>
                            <span className="text-onyx-accent-green font-bold">${amb.salesGenerated.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-zinc-500">COMMISSIONS PAID:</span>
                            <span className="text-onyx-accent-rose font-bold">${amb.discountsEarned.toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {activeNav === 'mailbox' && (
            <div className="flex-1 min-h-0 overflow-y-auto p-1">
              <SecureMailbox tenantFilter={tenantFilter} />
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
        <div className="fixed inset-0 bg-onyx-canvas/80 backdrop-blur-sm z-50 flex justify-center items-center p-0 md:p-4">
          <div className="bg-onyx-panel border border-onyx-border md:rounded-lg w-full h-full md:h-auto md:max-w-sm overflow-y-auto flex flex-col font-mono text-xs shadow-glow-green animate-fade-in">
            <div className="p-4 border-b border-onyx-border flex justify-between items-center bg-onyx-panel/80">
              <span className="text-[10px] text-onyx-accent-green font-bold tracking-widest uppercase">Register New Pipeline Lead</span>
              <button onClick={() => setIsAddLeadModalOpen(false)} className="text-onyx-muted hover:text-onyx-bright transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center">
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
                <div className="flex items-center justify-between">
                  <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Referral Discount Code *</label>
                  {newAmbName && (
                    <button
                      type="button"
                      onClick={() => {
                        const prefix = newAmbName.replace(/\s+/g, '').substring(0, 5).toUpperCase();
                        const suffix = Math.floor(10 + Math.random() * 90);
                        setNewAmbCode(`${prefix}${suffix}`);
                      }}
                      className="text-[9px] text-onyx-accent-cyan hover:text-cyan-300 font-mono font-bold uppercase tracking-wider transition-colors"
                    >
                      ✦ Auto-Generate
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  required
                  placeholder="e.g. ARIA5 or click Auto-Generate"
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

      {/* 6. Merge Records Modal */}
      {isMergeModalOpen && (
        <div className="fixed inset-0 bg-onyx-canvas/80 backdrop-blur-sm z-50 flex justify-center items-center p-4">
          <div className="bg-onyx-panel border border-onyx-border rounded-lg w-full max-w-lg overflow-hidden flex flex-col font-mono text-xs shadow-glow-amber animate-fade-in">
            <div className="p-4 border-b border-onyx-border flex justify-between items-center bg-onyx-panel/80">
              <span className="text-[10px] text-onyx-accent-amber font-bold tracking-widest uppercase">⚡ Merge Records — Duplicate CRM Resolver</span>
              <button onClick={() => setIsMergeModalOpen(false)} className="text-onyx-muted hover:text-onyx-bright transition-colors">
                <X size={16} />
              </button>
            </div>
            <div className="p-5 space-y-5">
              <p className="text-[10px] text-zinc-400 leading-relaxed font-mono border border-dashed border-onyx-accent-amber/20 bg-onyx-accent-amber/5 p-3 rounded">
                Select two lead records to merge. The primary record will absorb all activity logs from the duplicate and retain the higher deal value. The duplicate record will be permanently removed.
              </p>
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Primary Record (Keep)</label>
                  <select
                    value={mergePrimaryId}
                    onChange={(e) => setMergePrimaryId(e.target.value)}
                    className="w-full bg-onyx-canvas border border-onyx-border rounded p-2 text-xs text-onyx-bright focus:outline-none focus:border-onyx-accent-green font-mono"
                  >
                    {filteredLeads.map(l => (
                      <option key={l.id} value={l.id}>{l.name} — {l.companyName} (${l.potentialValue.toLocaleString()})</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Duplicate Record (Remove)</label>
                  <select
                    value={mergeDuplicateId}
                    onChange={(e) => setMergeDuplicateId(e.target.value)}
                    className="w-full bg-onyx-canvas border border-onyx-border rounded p-2 text-xs text-onyx-bright focus:outline-none focus:border-onyx-accent-rose font-mono"
                  >
                    {filteredLeads.filter(l => l.id !== mergePrimaryId).map(l => (
                      <option key={l.id} value={l.id}>{l.name} — {l.companyName} (${l.potentialValue.toLocaleString()})</option>
                    ))}
                  </select>
                </div>
              </div>
              {mergePrimaryId && mergeDuplicateId && mergePrimaryId !== mergeDuplicateId && (
                <div className="bg-onyx-canvas/40 border border-onyx-border/40 p-3 rounded text-[10px] space-y-1 text-zinc-400">
                  <p className="text-zinc-500 font-bold uppercase tracking-widest">Merge Preview</p>
                  <p>Primary: <span className="text-onyx-accent-green font-bold">{filteredLeads.find(l => l.id === mergePrimaryId)?.name}</span></p>
                  <p>Duplicate to absorb: <span className="text-onyx-accent-rose font-bold">{filteredLeads.find(l => l.id === mergeDuplicateId)?.name}</span></p>
                  <p>Combined activity logs: <span className="text-onyx-bright font-bold">{((filteredLeads.find(l => l.id === mergePrimaryId)?.activityLogs?.length || 0) + (filteredLeads.find(l => l.id === mergeDuplicateId)?.activityLogs?.length || 0))} entries</span></p>
                </div>
              )}
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => {
                    if (!mergePrimaryId || !mergeDuplicateId || mergePrimaryId === mergeDuplicateId) {
                      alert('Please select two distinct lead records.');
                      return;
                    }
                    mergeLeads(mergePrimaryId, mergeDuplicateId);
                    setIsMergeModalOpen(false);
                    setMergePrimaryId('');
                    setMergeDuplicateId('');
                  }}
                  disabled={!mergePrimaryId || !mergeDuplicateId || mergePrimaryId === mergeDuplicateId}
                  className={`flex-1 py-2.5 rounded font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-1.5 ${
                    !mergePrimaryId || !mergeDuplicateId || mergePrimaryId === mergeDuplicateId
                      ? 'bg-zinc-800 text-zinc-500 border border-zinc-700 cursor-not-allowed'
                      : 'bg-onyx-accent-amber hover:bg-amber-400 text-onyx-canvas shadow-sm'
                  }`}
                >
                  <RefreshCw size={14} /> Execute Merge
                </button>
                <button
                  onClick={() => setIsMergeModalOpen(false)}
                  className="px-5 py-2.5 rounded border border-onyx-border text-onyx-muted hover:text-onyx-bright hover:border-zinc-500 transition-all font-bold uppercase tracking-wider"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 7. Flywheel Cross-Sell Toast Banner System (Fixed Bottom-Right) */}
      <div className="fixed bottom-6 right-6 z-[60] flex flex-col gap-3 pointer-events-none" style={{ maxWidth: '360px' }}>
        {flywheelToasts.map(toast => (
          <div
            key={toast.id}
            className={`pointer-events-auto transition-all duration-500 ${
              toast.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
          >
            <div className="bg-[#09090b] border border-onyx-accent-purple/40 rounded-xl p-4 shadow-[0_0_30px_rgba(168,85,247,0.2)] font-mono text-xs relative overflow-hidden">
              {/* Animated glow border */}
              <div className="absolute inset-0 rounded-xl border border-onyx-accent-purple/20 animate-pulse pointer-events-none" />
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-onyx-accent-purple/15 border border-onyx-accent-purple/30 flex items-center justify-center flex-shrink-0">
                  <ArrowUpRight size={16} className="text-onyx-accent-purple" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-onyx-accent-purple font-bold tracking-widest uppercase mb-1">⚡ Flywheel Cross-Sell Activated</p>
                  <p className="text-zinc-300 text-xs font-semibold truncate">{toast.leadName} → CLOSED WON</p>
                  <p className="text-zinc-500 text-[10px] mt-0.5">Centle Router engaged · {toast.tenant} venture cross-sell pipeline initiated</p>
                </div>
                <button
                  onClick={() => setFlywheelToasts(prev => prev.filter(t => t.id !== toast.id))}
                  className="text-zinc-600 hover:text-zinc-300 transition-colors flex-shrink-0"
                >
                  <X size={14} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 8. Gateway Router Survey Modal */}
      {showGatewayRouter && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-45 flex justify-center items-center p-4">
          <div className="bg-[#09090b] border border-[#27272a] rounded-2xl w-full max-w-md overflow-hidden flex flex-col font-mono text-xs shadow-[0_0_50px_rgba(168,85,247,0.3)] animate-fade-in text-[#fafafa]">
            {/* Header */}
            <div className="p-5 border-b border-[#27272a] flex justify-between items-center bg-[#09090b]/85">
              <div className="flex items-center gap-2">
                <Globe size={16} className="text-onyx-accent-purple animate-spin-slow" style={{ animationDuration: '6s' }} />
                <span className="text-xs font-bold text-onyx-accent-purple tracking-widest uppercase">CENTLE VENTURE ROUTER</span>
              </div>
              <button 
                onClick={() => {
                  setShowGatewayRouter(false);
                  setGatewayRouterChoice(null);
                }} 
                className="text-zinc-500 hover:text-zinc-200 transition-colors"
              >
                <X size={16} />
              </button>
            </div>
            
            {/* Body */}
            <div className="p-6 space-y-4">
              <p className="text-zinc-400 text-[10px] leading-relaxed">
                Identify your primary operational cohort. The autonomic router will classify your session and trigger cross-sell matchmaking with partner ventures.
              </p>
              
              <div className="space-y-3">
                {[
                  {
                    id: 'student',
                    label: 'Student',
                    icon: GraduationCap,
                    desc: 'Onboard as Intern and align with Skill Tank development targets.',
                    color: 'text-onyx-accent-cyan hover:border-onyx-accent-cyan/60 bg-onyx-accent-cyan/5 hover:bg-onyx-accent-cyan/10 border-onyx-accent-cyan/20'
                  },
                  {
                    id: 'enterprise',
                    label: 'Enterprise Client',
                    icon: Briefcase,
                    desc: 'Route transaction volume through Vriddhi corporate logistics.',
                    color: 'text-onyx-accent-green hover:border-onyx-accent-green/60 bg-onyx-accent-green/5 hover:bg-onyx-accent-green/10 border-onyx-accent-green/20'
                  },
                  {
                    id: 'coordinator',
                    label: 'College Coordinator',
                    icon: Globe,
                    desc: 'Engage with Promtal media networks and recruitment pipelines.',
                    color: 'text-onyx-accent-purple hover:border-onyx-accent-purple/60 bg-onyx-accent-purple/5 hover:bg-onyx-accent-purple/10 border-onyx-accent-purple/20'
                  }
                ].map((cohort) => {
                  const CohortIcon = cohort.icon;
                  const isSelected = gatewayRouterChoice === cohort.id;
                  return (
                    <button
                      key={cohort.id}
                      onClick={() => setGatewayRouterChoice(cohort.id)}
                      className={`w-full text-left p-4 rounded-xl border transition-all flex items-start gap-4 ${cohort.color} ${
                        isSelected ? 'ring-2 ring-purple-500 ring-offset-2 ring-offset-black border-transparent' : ''
                      }`}
                    >
                      <CohortIcon size={20} className="mt-1 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-sm tracking-wide text-white">{cohort.label}</p>
                        <p className="text-zinc-400 text-[10px] mt-1 leading-relaxed">{cohort.desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>

              {gatewayRouterChoice && (
                <button
                  onClick={() => handleGatewayChoice(gatewayRouterChoice as any)}
                  className="w-full py-3 rounded-xl bg-onyx-accent-purple hover:bg-fuchsia-400 text-black font-bold uppercase tracking-widest transition-all mt-4 text-xs shadow-lg shadow-fuchsia-950/40"
                >
                  Confirm Classification
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Mobile Terminal Bottom Sheet */}
      {isMobileTerminalOpen && (
        <div className="fixed inset-0 z-50 md:hidden bg-black flex flex-col w-screen h-screen">
          <div 
            className={`flex-1 flex flex-col w-full h-full transition-all duration-300 ${
              isOnyx ? 'bg-[#000000] text-[#fafafa]' : 'bg-[#ffffff] text-[#09090b]'
            }`}
          >
            <div className={`px-4 py-3 border-b flex items-center justify-between ${isOnyx ? 'border-[#27272a]' : 'border-[#e4e4e7]'}`}>
              <div className="flex items-center gap-2">
                <Activity size={14} className={isOnyx ? 'text-onyx-accent-green' : 'text-emerald-800'} />
                <span className={`text-xs font-bold uppercase tracking-wider ${isOnyx ? 'text-onyx-accent-green' : 'text-emerald-800'}`}>
                  Agent Command Matrix
                </span>
              </div>
              <button 
                onClick={() => setIsMobileTerminalOpen(false)}
                className={`min-h-[44px] min-w-[44px] flex items-center justify-center p-1 rounded-md border ${
                  isOnyx ? 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-white' : 'bg-white border-zinc-200 text-zinc-500 hover:text-black'
                }`}
              >
                <X size={16} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2 font-mono">
              {filteredTerminalEntries.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-2 py-10">
                  <Activity size={20} className="animate-pulse text-zinc-600" />
                  <p className="text-[10px] text-zinc-500 font-mono">No active streams...</p>
                </div>
              ) : (
                [...filteredTerminalEntries].reverse().map((entry) => (
                  <ThoughtEntry key={entry.id} entry={entry} currentUser={currentUser} />
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* 9. Mobile Add Dossier Slide-up Sheet */}
      {isAddDossierMobileOpen && (
        <div className="fixed inset-0 z-50 bg-zinc-950 p-5 overflow-y-auto font-mono text-xs text-[#fafafa] flex flex-col gap-4">
          <div className="flex justify-between items-center border-b border-zinc-800 pb-3">
            <span className="text-xs font-bold tracking-widest uppercase text-onyx-accent-rose">⚡ Create Intern Dossier</span>
            <button 
              onClick={() => setIsAddDossierMobileOpen(false)} 
              className="text-zinc-400 min-h-[44px] min-w-[44px] flex items-center justify-center border border-zinc-800 rounded bg-zinc-900"
            >
              <X size={18} />
            </button>
          </div>
          <form onSubmit={(e) => {
            e.preventDefault();
            if (!mobileDossierName || !mobileDossierEmail || !mobileDossierRole || !mobileDossierStipend) {
              alert('Please fill out all fields.');
              return;
            }
            createInternDossierAction(mobileDossierTenant, {
              full_name: mobileDossierName,
              corporate_email: mobileDossierEmail,
              department_role: mobileDossierRole,
              base_stipend: Number(mobileDossierStipend) * 100
            });
            setIsAddDossierMobileOpen(false);
            setMobileDossierName('');
            setMobileDossierEmail('');
            setMobileDossierRole('');
            setMobileDossierStipend('2000');
            alert('Dossier created successfully!');
          }} className="space-y-4">
            <div className="space-y-1">
              <label className="block text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Legal Name *</label>
              <input
                type="text"
                required
                placeholder="Alex Mercer"
                value={mobileDossierName}
                onChange={(e) => setMobileDossierName(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded p-3 text-xs text-white focus:outline-none focus:border-zinc-500"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Corporate Email *</label>
              <input
                type="email"
                required
                placeholder="alex@skilltank.com"
                value={mobileDossierEmail}
                onChange={(e) => setMobileDossierEmail(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded p-3 text-xs text-white focus:outline-none focus:border-zinc-500"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Department Role *</label>
              <input
                type="text"
                required
                placeholder="QA Automation Intern"
                value={mobileDossierRole}
                onChange={(e) => setMobileDossierRole(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded p-3 text-xs text-white focus:outline-none focus:border-zinc-500"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Base stipend (USD) *</label>
              <input
                type="number"
                required
                value={mobileDossierStipend}
                onChange={(e) => setMobileDossierStipend(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded p-3 text-xs text-white focus:outline-none focus:border-zinc-500"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Tenant Workspace *</label>
              <select
                value={mobileDossierTenant}
                onChange={(e) => setMobileDossierTenant(e.target.value as TenantCompany)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded p-3 text-xs text-white focus:outline-none focus:border-zinc-500"
              >
                <option value="skill_tank">Skill Tank Systems</option>
                <option value="vriddhi">Vriddhi Logistics</option>
                <option value="tobofu">Tobofu Agri Group</option>
                <option value="promtal">Promtal Media</option>
                <option value="maceco">Maceco Roman Steel</option>
              </select>
            </div>
            <button
              type="submit"
              className="w-full h-12 bg-onyx-accent-rose text-white font-bold uppercase tracking-widest rounded-lg transition-transform active:scale-95 mt-4"
            >
              Register Dossier
            </button>
          </form>
        </div>
      )}

      {/* 10. Mobile Dispatch Secure message Slide-up Sheet */}
      {isDispatchMobileOpen && (
        <div className="fixed inset-0 z-50 bg-zinc-950 p-5 overflow-y-auto font-mono text-xs text-[#fafafa] flex flex-col gap-4">
          <div className="flex justify-between items-center border-b border-zinc-800 pb-3">
            <span className="text-xs font-bold tracking-widest uppercase text-onyx-accent-rose">⚡ Secure Msg Dispatch</span>
            <button 
              onClick={() => setIsDispatchMobileOpen(false)} 
              className="text-zinc-400 min-h-[44px] min-w-[44px] flex items-center justify-center border border-zinc-800 rounded bg-zinc-900"
            >
              <X size={18} />
            </button>
          </div>
          <form onSubmit={(e) => {
            e.preventDefault();
            if (!mobileDispatchRecipient || !mobileDispatchBody) {
              alert('Please enter recipient and body.');
              return;
            }
            dispatchSecureMessage({
              recipient_intern_id: mobileDispatchRecipient,
              sender_role: 'Admin',
              subject_category: mobileDispatchSubject,
              body_content_encrypted_string: mobileDispatchBody,
              is_ephemeral: false
            });
            setIsDispatchMobileOpen(false);
            setMobileDispatchRecipient('');
            setMobileDispatchBody('');
            alert('Payload transmitted successfully.');
          }} className="space-y-4">
            <div className="space-y-1">
              <label className="block text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Recipient Intern *</label>
              <select
                required
                value={mobileDispatchRecipient}
                onChange={(e) => setMobileDispatchRecipient(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded p-3 text-xs text-white focus:outline-none focus:border-zinc-500"
              >
                <option value="" disabled>Select target...</option>
                {internDossiers.map((d) => (
                  <option key={d.intern_id} value={d.intern_id}>
                    {d.profile_metadata.full_name} ({d.intern_id})
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="block text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Subject Classification *</label>
              <select
                value={mobileDispatchSubject}
                onChange={(e) => setMobileDispatchSubject(e.target.value as any)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded p-3 text-xs text-white focus:outline-none focus:border-zinc-500"
              >
                <option value="PAYROLL">PAYROLL</option>
                <option value="COMPLAINT">COMPLAINT</option>
                <option value="PERFORMANCE">PERFORMANCE</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="block text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Message Payload *</label>
              <textarea
                required
                rows={5}
                placeholder="Type secure details..."
                value={mobileDispatchBody}
                onChange={(e) => setMobileDispatchBody(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded p-3 text-xs text-white focus:outline-none focus:border-zinc-500 resize-none leading-relaxed"
              />
            </div>
            <button
              type="submit"
              className="w-full h-12 bg-onyx-accent-rose text-white font-bold uppercase tracking-widest rounded-lg transition-transform active:scale-95 mt-4"
            >
              Transmit Payload
            </button>
          </form>
        </div>
      )}

    </div>
  );
}
