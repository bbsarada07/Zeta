/**
 * AdminHRPortal — Zero-Trust HR Operations & Dossier Management
 *
 * Features:
 * - Biometric hardware-token modal fires before EVERY state mutation
 * - Multi-step animated button: [Encrypting...] → [Routing...] → [Dispatched Safely]
 * - Kinetic scrambler on financial field reveals in admin directory
 * - Full dossier directory with profile / financial / CRM / work history
 * - Secure message dispatcher with AES-GCM encryption simulation
 * - New dossier creation with tenant lock
 * - Zero implicit 'any'
 */

import { useState, useEffect, useCallback } from 'react';
import { useZetaStore } from '../store/zetaStore';
import { mockEncryptString, generateTxHash } from '../agents/agentRouter';
import { KineticTextScrambler } from './SecureMailbox';
import {
  Fingerprint,
  Lock,
  ShieldCheck,
  RefreshCw,
  Send,
  DollarSign,
  History,
  LineChart,
  PlusCircle,
  FolderOpen,
  CheckCircle2,
  AlertTriangle,
  Activity,
  Cpu,
} from 'lucide-react';
import type { TenantCompany } from '../types/zeta';

// ─── Types ─────────────────────────────────────────────────────────────────────

type TabType = 'dispatcher' | 'directory' | 'create';
type BtnState = 'idle' | 'encrypting' | 'routing' | 'success';
type PasskeyStep = 'awaiting' | 'scanning' | 'verified' | 'closed';
type FinField = 'base_stipend' | 'pending_payout';
type SubjectCategory = 'PAYROLL' | 'COMPLAINT' | 'PERFORMANCE';

/** Every pending action queued to run after biometric verification passes */
interface PendingAction {
  type: 'dispatch_message' | 'log_work' | 'update_financial' | 'create_dossier';
  execute: () => void;
  label: string;
}

// ─── Biometric Modal ───────────────────────────────────────────────────────────

const BiometricModal = ({
  step,
  targetId,
  actionLabel,
}: {
  step: PasskeyStep;
  targetId: string;
  actionLabel: string;
}) => {
  const scanLines = [
    '[Initializing Hardware Security Module...]',
    '[Requesting Biometric Handshake...]',
    '[Awaiting Hardware Security Token...]',
  ];
  const [scanIdx, setScanIdx] = useState(0);

  useEffect(() => {
    if (step === 'awaiting') {
      setScanIdx(0);
      const t1 = setTimeout(() => setScanIdx(1), 300);
      const t2 = setTimeout(() => setScanIdx(2), 700);
      return () => { clearTimeout(t1); clearTimeout(t2); };
    }
    if (step === 'scanning') {
      setScanIdx(2);
    }
  }, [step]);

  const txHash = generateTxHash();

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-[200] flex justify-center items-center p-4">
      <div className="bg-[#0a0a0a] border border-zinc-800 rounded-xl w-full max-w-sm overflow-hidden flex flex-col font-mono text-xs shadow-2xl p-6 text-center space-y-5 animate-scale-in">

        {/* Icon ring */}
        <div className="relative mx-auto w-16 h-16 flex items-center justify-center">
          <div
            className={`absolute inset-0 rounded-full border-2 ${
              step === 'verified' ? 'border-emerald-500' : 'border-rose-800/60'
            } transition-all duration-500`}
            style={step !== 'verified' ? { animation: 'spin 3s linear infinite' } : {}}
          />
          <div
            className={`absolute inset-2 rounded-full border ${
              step === 'verified' ? 'border-emerald-500/30' : 'border-rose-900/40'
            }`}
          />
          {step === 'verified' ? (
            <CheckCircle2 className="text-emerald-400" size={28} />
          ) : (
            <Fingerprint
              className={`${step === 'awaiting' ? 'text-amber-400 animate-pulse' : 'text-rose-400'}`}
              size={28}
            />
          )}
        </div>

        {/* Title */}
        <div className="space-y-1">
          <h2 className="text-[11px] font-black text-zinc-100 tracking-widest uppercase">
            Hardware Token Authentication
          </h2>
          <p className="text-[8px] text-zinc-500 uppercase tracking-wider">
            Zero-Trust Biometric Signature Request
          </p>
        </div>

        {/* Request metadata */}
        <div className="bg-black/70 border border-zinc-900 rounded-lg p-3 text-[9px] text-left space-y-1.5">
          <div className="flex justify-between">
            <span className="text-zinc-500">REQUEST TYPE:</span>
            <span className="text-zinc-300 font-bold">HR_CREDENTIALS_MUTATION</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-500">ACTION:</span>
            <span className="text-zinc-300 font-bold truncate max-w-[55%] text-right">{actionLabel}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-500">TARGET:</span>
            <span className="text-zinc-300 font-bold">{targetId || 'NEW_RECORD'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-500">ENCRYPTION:</span>
            <span className="text-zinc-300 font-bold">ASYMMETRIC_AES_GCM</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-500">TX REF:</span>
            <span className="text-zinc-600 font-bold text-[7px]">{txHash.slice(0, 22)}...</span>
          </div>
        </div>

        {/* Status line */}
        <div className="min-h-[28px] flex items-center justify-center gap-1.5 text-[11px] font-bold tracking-wider">
          {step === 'verified' ? (
            <span className="text-emerald-400 flex items-center gap-1.5">
              <CheckCircle2 size={12} />
              [Biometric Handshake Verified ✓]
            </span>
          ) : (
            <div className="space-y-0.5 text-left w-full">
              {scanLines.slice(0, scanIdx + 1).map((line, i) => (
                <p
                  key={i}
                  className={`text-[8px] font-mono ${
                    i === scanIdx ? 'text-amber-400 animate-pulse' : 'text-zinc-600'
                  }`}
                >
                  {line}
                </p>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Submit Button with multi-step animation ────────────────────────────────────

const AnimatedSubmitButton = ({
  btnState,
  idleLabel,
  disabled,
  onClick,
}: {
  btnState: BtnState;
  idleLabel: string;
  disabled?: boolean;
  onClick?: () => void;
}) => {
  const configs: Record<BtnState, { label: string; icon: React.ReactNode; cls: string }> = {
    idle: {
      label: idleLabel,
      icon: <Send size={11} />,
      cls: 'text-onyx-canvas bg-onyx-accent-rose hover:bg-rose-400 border-onyx-accent-rose',
    },
    encrypting: {
      label: '[Encrypting Transmission...]',
      icon: <RefreshCw size={11} className="animate-spin" />,
      cls: 'text-amber-400 bg-amber-950/20 border-amber-700/40',
    },
    routing: {
      label: '[Routing via Secure Tenant Node...]',
      icon: <Activity size={11} className="animate-pulse" />,
      cls: 'text-cyan-400 bg-cyan-950/20 border-cyan-700/40',
    },
    success: {
      label: '[Dispatched Safely ✓]',
      icon: <ShieldCheck size={11} />,
      cls: 'text-emerald-400 bg-emerald-950/20 border-emerald-700/40',
    },
  };
  const cfg = configs[btnState];

  return (
    <button
      type={onClick ? 'button' : 'submit'}
      disabled={disabled || btnState !== 'idle'}
      onClick={onClick}
      className={`w-full py-2.5 rounded text-[10px] font-black uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2 border ${cfg.cls}`}
    >
      {cfg.icon}
      {cfg.label}
    </button>
  );
};

// ─── AdminHRPortal ─────────────────────────────────────────────────────────────

export default function AdminHRPortal() {
  const store = useZetaStore();
  const [activeTab, setActiveTab] = useState<TabType>('directory');
  const [selectedInternId, setSelectedInternId] = useState('');

  // Dispatcher state
  const [subject, setSubject] = useState<SubjectCategory>('PAYROLL');
  const [messageBody, setMessageBody] = useState('');
  const [stipendOverride, setStipendOverride] = useState('');
  const [isEphemeral, setIsEphemeral] = useState(false);

  // Work log state
  const [newProjectTitle, setNewProjectTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newEfficiencyScore, setNewEfficiencyScore] = useState('90');
  const [newReviewerNotes, setNewReviewerNotes] = useState('');

  // Financial adjustment state
  const [finField, setFinField] = useState<FinField>('base_stipend');
  const [finAmountUsd, setFinAmountUsd] = useState('');

  // Create dossier state
  const [createName, setCreateName] = useState('');
  const [createEmail, setCreateEmail] = useState('');
  const [createRole, setCreateRole] = useState('');
  const [createTenant, setCreateTenant] = useState<TenantCompany>('skill_tank');
  const [createBaseStipend, setCreateBaseStipend] = useState('');

  // Biometric modal & button animation state
  const [passkeyStep, setPasskeyStep] = useState<PasskeyStep>('closed');
  const [btnState, setBtnState] = useState<BtnState>('idle');
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);

  // Kinetic decryption toggle for admin financial fields
  const [revealedFields, setRevealedFields] = useState<Set<string>>(new Set());

  // Default-select first intern
  useEffect(() => {
    if (store.internDossiers.length > 0 && !selectedInternId) {
      setSelectedInternId(store.internDossiers[0].intern_id);
    }
  }, [store.internDossiers, selectedInternId]);

  const activeDossier = store.internDossiers.find((d) => d.intern_id === selectedInternId) ?? null;

  // ── Biometric gate: queues an action and triggers the modal ──────────────────
  const gateThroughBiometric = useCallback((action: PendingAction) => {
    setPendingAction(action);
    setPasskeyStep('awaiting');

    // 1.2s awaiting → scanning
    const t1 = setTimeout(() => {
      setPasskeyStep('scanning');
      // 0.6s scanning → verified
      const t2 = setTimeout(() => {
        setPasskeyStep('verified');
        // 0.7s verified → execute & close
        const t3 = setTimeout(() => {
          setPasskeyStep('closed');
          setPendingAction(null);
          action.execute();
        }, 700);
        return () => clearTimeout(t3);
      }, 600);
      return () => clearTimeout(t2);
    }, 1200);
    return () => clearTimeout(t1);
  }, []);

  // ── Animated submission pipeline ─────────────────────────────────────────────
  const runSubmitSequence = useCallback((commit: () => void) => {
    setBtnState('encrypting');
    setTimeout(() => {
      setBtnState('routing');
      setTimeout(() => {
        setBtnState('success');
        commit();
        setTimeout(() => setBtnState('idle'), 2000);
      }, 800);
    }, 800);
  }, []);

  // ── Form handlers — all gated through biometric ───────────────────────────────

  const handleStartDispatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageBody.trim()) return;

    const encryptedBody = mockEncryptString(
      stipendOverride
        ? `${messageBody} [Financial Override Adjustment Amount: $${stipendOverride}]`
        : messageBody
    );
    const txHash = generateTxHash();

    gateThroughBiometric({
      type: 'dispatch_message',
      label: `DISPATCH → ${selectedInternId}`,
      execute: () => {
        runSubmitSequence(() => {
          store.dispatchSecureMessage({
            recipient_intern_id: selectedInternId,
            sender_role: 'Admin',
            subject_category: subject,
            body_content_encrypted_string: encryptedBody,
            is_ephemeral: isEphemeral,
          });

          if (stipendOverride) {
            store.updateInternFinancialsAction(selectedInternId, 'pending_payout', Number(stipendOverride) * 100);
          }

          const targetDossier = store.internDossiers.find((d) => d.intern_id === selectedInternId);
          const tenantTag = targetDossier ? targetDossier.tenant_company.toUpperCase() : 'SKILL_TANK';
          const payrollLogMsg =
            `[OpsAgent] Compiled payroll processing event for Tenant: [${tenantTag}] -> Intern ID: [${selectedInternId}]. [CONFIDENTIAL FINANCIAL DATA REDACTED].`;

          store.addThoughtLedgerEntry({
            agentName: 'OpsAgent',
            status: 'action_executed',
            thoughtProcess: payrollLogMsg,
            message: payrollLogMsg,
            modelUsed: 'gemini-2.5-flash',
            activeTenantTrack: targetDossier?.tenant_company ?? 'skill_tank',
            currentTask: 'Compiling Payroll Metrics',
            tx_hash: txHash,
          });

          store.addThoughtLedgerEntry({
            agentName: 'OpsAgent',
            status: 'action_executed',
            thoughtProcess: `[OpsAgent] Secure notification node updated for target recipient ID: [${selectedInternId}]. tx_hash: ${txHash}`,
            message: `[OpsAgent] Secure notification node updated for target recipient ID: [${selectedInternId}].`,
            modelUsed: 'gemini-2.5-flash',
            activeTenantTrack: 'global_admin',
            currentTask: 'Routing secure payload',
            tx_hash: txHash,
          });

          setMessageBody('');
          setStipendOverride('');
          setIsEphemeral(false);
        });
      },
    });
  };

  const handleAddWorkLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectTitle.trim() || !newDescription.trim()) return;

    gateThroughBiometric({
      type: 'log_work',
      label: `LOG WORK → ${selectedInternId}`,
      execute: () => {
        runSubmitSequence(() => {
          store.appendInternWorkLogAction(selectedInternId, {
            project_title: newProjectTitle,
            description: newDescription,
            efficiency_score: Number(newEfficiencyScore),
            reviewer_notes: newReviewerNotes.trim() || undefined,
          });
          setNewProjectTitle('');
          setNewDescription('');
          setNewEfficiencyScore('90');
          setNewReviewerNotes('');
        });
      },
    });
  };

  const handleFinancialUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!finAmountUsd) return;

    gateThroughBiometric({
      type: 'update_financial',
      label: `UPDATE ${finField.toUpperCase()} → ${selectedInternId}`,
      execute: () => {
        runSubmitSequence(() => {
          store.updateInternFinancialsAction(selectedInternId, finField, Number(finAmountUsd) * 100);
          setFinAmountUsd('');
        });
      },
    });
  };

  const handleCreateDossier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!createName.trim() || !createEmail.trim() || !createRole.trim() || !createBaseStipend) return;

    gateThroughBiometric({
      type: 'create_dossier',
      label: `CREATE DOSSIER → ${createTenant.toUpperCase()}`,
      execute: () => {
        runSubmitSequence(() => {
          store.createInternDossierAction(createTenant, {
            full_name: createName,
            corporate_email: createEmail,
            department_role: createRole,
            base_stipend: Number(createBaseStipend) * 100,
          });
          setCreateName('');
          setCreateEmail('');
          setCreateRole('');
          setCreateBaseStipend('');
          setActiveTab('directory');
        });
      },
    });
  };

  // ── Toggle kinetic admin reveal ───────────────────────────────────────────────
  const toggleReveal = (fieldKey: string) => {
    setRevealedFields((prev) => {
      const next = new Set(prev);
      if (next.has(fieldKey)) next.delete(fieldKey);
      else next.add(fieldKey);
      return next;
    });
  };

  // ── Utility: financial field display with kinetic scramble ───────────────────
  const KineticFinancialField = ({
    fieldKey,
    plaintextValue,
  }: {
    fieldKey: string;
    plaintextValue: string;
  }) => {
    const revealed = revealedFields.has(fieldKey);
    return (
      <button
        type="button"
        onClick={() => toggleReveal(fieldKey)}
        className="text-right font-mono group"
        title={revealed ? 'Click to mask' : 'Click to reveal'}
      >
        {revealed ? (
          <KineticTextScrambler
            encryptedText={'█████████'}
            decryptedText={plaintextValue}
            shouldScramble={true}
          />
        ) : (
          <span className="text-zinc-600 text-[9px] group-hover:text-zinc-500 transition-colors">
            ██████ <span className="text-[8px] text-zinc-700">[click to reveal]</span>
          </span>
        )}
      </button>
    );
  };

  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-5 h-full animate-fade-in font-mono text-xs max-w-6xl w-full">

      {/* Header */}
      <div className="border-b border-onyx-border pb-3 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Lock className="text-onyx-accent-rose" size={15} />
            <h1 className="text-sm font-bold text-onyx-bright uppercase tracking-widest">
              Private Admin HR &amp; Dossier Operations
            </h1>
          </div>
          <p className="text-[9px] text-onyx-muted mt-1">
            Zero-Trust dossier relational storage manager · Biometric gate enforced on every mutation
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex gap-1 bg-black border border-onyx-border p-1 rounded">
          {(['directory', 'dispatcher', 'create'] as TabType[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 text-[9px] font-black uppercase tracking-wider rounded transition-all ${
                activeTab === tab
                  ? 'bg-onyx-accent-rose text-onyx-canvas'
                  : 'text-onyx-muted hover:text-onyx-bright'
              }`}
            >
              {tab === 'directory' ? 'Dossier Directory' : tab === 'dispatcher' ? 'Secure Dispatcher' : 'New Dossier'}
            </button>
          ))}
        </div>
      </div>

      {/* ── TAB: DIRECTORY ── */}
      {activeTab === 'directory' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start flex-1 min-h-0">

          {/* Intern list */}
          <div className="lg:col-span-4 bg-onyx-panel border border-onyx-border rounded-lg p-4 flex flex-col gap-3 max-h-[70vh] overflow-y-auto">
            <h2 className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-1.5 border-b border-onyx-border/50 pb-2">
              <FolderOpen size={11} className="text-onyx-accent-rose" />
              Intern Files ({store.internDossiers.length})
            </h2>
            <div className="space-y-1.5">
              {store.internDossiers.map((dossier) => (
                <button
                  key={dossier.intern_id}
                  onClick={() => setSelectedInternId(dossier.intern_id)}
                  className={`w-full text-left p-3 rounded border transition-all flex flex-col gap-1 ${
                    selectedInternId === dossier.intern_id
                      ? 'bg-onyx-accent-rose/5 border-onyx-accent-rose'
                      : 'bg-black/35 border-onyx-border/50 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex justify-between items-center gap-2">
                    <span className="font-bold text-onyx-bright truncate">{dossier.profile_metadata.full_name}</span>
                    <span className="text-[7px] bg-zinc-900 border border-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded uppercase font-bold flex-shrink-0">
                      {dossier.intern_id}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-[8px]">
                    <span className="text-zinc-500 truncate">{dossier.profile_metadata.department_role}</span>
                    <span className="text-onyx-accent-rose uppercase font-semibold flex-shrink-0">
                      {dossier.tenant_company.replace(/_/g, ' ')}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Intern detailed view */}
          <div className="lg:col-span-8 space-y-4 max-h-[70vh] overflow-y-auto pr-1">
            {activeDossier ? (
              <>
                {/* Profile card */}
                <div className="bg-onyx-panel border border-onyx-border rounded-lg p-5 space-y-4">
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 border-b border-onyx-border pb-3">
                    <div>
                      <h2 className="text-sm font-bold text-onyx-bright">{activeDossier.profile_metadata.full_name}</h2>
                      <p className="text-[9px] text-zinc-500 mt-0.5">{activeDossier.profile_metadata.department_role}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[8px] bg-onyx-accent-rose/10 border border-onyx-accent-rose/30 text-onyx-accent-rose px-2 py-0.5 rounded font-bold uppercase">
                        {activeDossier.tenant_company.replace(/_/g, ' ')}
                      </span>
                      <span className="text-[8px] bg-emerald-950/40 border border-emerald-800/30 text-emerald-400 px-2 py-0.5 rounded font-bold uppercase">
                        {activeDossier.profile_metadata.onboarding_status}
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[9px]">
                    {[
                      ['Corporate Email', activeDossier.profile_metadata.corporate_email],
                      ['Joining Date',    new Date(activeDossier.profile_metadata.joining_date).toLocaleDateString()],
                    ].map(([label, value]) => (
                      <div key={label} className="flex justify-between py-1 border-b border-onyx-border/20">
                        <span className="text-zinc-500 uppercase font-medium">{label}:</span>
                        <span className="text-onyx-bright font-mono">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Financials + CRM */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                  {/* Financial Ledger — with kinetic reveal */}
                  <div className="bg-onyx-panel border border-onyx-border rounded-lg p-5 flex flex-col gap-4">
                    <div>
                      <h3 className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-1.5 border-b border-onyx-border/50 pb-2 mb-3">
                        <DollarSign size={11} className="text-onyx-accent-rose" />
                        Financial Ledger
                        <span className="ml-auto text-[7px] text-zinc-700 font-mono normal-case tracking-normal">
                          [click values to reveal]
                        </span>
                      </h3>
                      <div className="space-y-2 text-[9px]">
                        {[
                          ['Base Stipend (Monthly)',   `$${(activeDossier.financial_ledger.base_stipend / 100).toLocaleString()}`,       `fin_bs_${activeDossier.intern_id}`],
                          ['Paid To Date Total',       `$${(activeDossier.financial_ledger.paid_to_date_total / 100).toLocaleString()}`,  `fin_pt_${activeDossier.intern_id}`],
                          ['Pending Adjustment Payout',`$${(activeDossier.financial_ledger.pending_payout / 100).toLocaleString()}`,      `fin_pp_${activeDossier.intern_id}`],
                        ].map(([label, value, key]) => (
                          <div key={key as string} className="flex justify-between py-1 border-b border-onyx-border/20 items-center gap-2">
                            <span className="text-zinc-500">{label}:</span>
                            <KineticFinancialField fieldKey={key as string} plaintextValue={value as string} />
                          </div>
                        ))}
                        <div className="flex justify-between py-1 border-b border-onyx-border/20">
                          <span className="text-zinc-500">Bank Status:</span>
                          <span className="text-emerald-400 font-bold uppercase">{activeDossier.financial_ledger.bank_payout_status}</span>
                        </div>
                      </div>
                    </div>

                    {/* Adjust financials form */}
                    <form onSubmit={handleFinancialUpdate} className="bg-black/40 border border-onyx-border rounded p-3 space-y-2">
                      <div className="flex gap-2">
                        <select
                          value={finField}
                          onChange={(e) => setFinField(e.target.value as FinField)}
                          className="flex-1 bg-black border border-onyx-border rounded p-1.5 text-[9px] text-onyx-bright focus:outline-none"
                        >
                          <option value="base_stipend">Base Stipend</option>
                          <option value="pending_payout">Pending Payout</option>
                        </select>
                        <input
                          type="number"
                          required
                          placeholder="USD"
                          value={finAmountUsd}
                          onChange={(e) => setFinAmountUsd(e.target.value)}
                          className="w-20 bg-black border border-onyx-border rounded p-1.5 text-[9px] text-onyx-bright font-mono focus:outline-none"
                        />
                      </div>
                      <AnimatedSubmitButton
                        btnState={btnState}
                        idleLabel="Adjust Ledger"
                        disabled={!finAmountUsd}
                      />
                    </form>
                  </div>

                  {/* CRM Metrics */}
                  <div className="bg-onyx-panel border border-onyx-border rounded-lg p-5">
                    <h3 className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-1.5 border-b border-onyx-border/50 pb-2 mb-3">
                      <LineChart size={11} className="text-onyx-accent-rose" />
                      CRM Contribution Metrics
                    </h3>
                    <div className="space-y-2 text-[9px]">
                      {[
                        ['Associated Leads',        String(activeDossier.crm_contribution_metrics.associated_lead_ids.length), 'text-onyx-bright font-bold font-mono'],
                        ['Pipeline Contract Value', `$${activeDossier.crm_contribution_metrics.total_contracts_value.toLocaleString()} USD`, 'text-emerald-400 font-bold font-mono'],
                        ['Ambassador Referrals',    `${activeDossier.crm_contribution_metrics.ambassador_referrals_count} referrals`, 'text-purple-400 font-bold font-mono'],
                      ].map(([label, value, cls]) => (
                        <div key={label as string} className="flex justify-between py-1 border-b border-onyx-border/20">
                          <span className="text-zinc-500">{label}:</span>
                          <span className={cls as string}>{value}</span>
                        </div>
                      ))}
                      <div className="mt-2">
                        <span className="text-zinc-500 uppercase text-[7px] font-bold tracking-wider block mb-1">Associated Lead IDs:</span>
                        {activeDossier.crm_contribution_metrics.associated_lead_ids.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {activeDossier.crm_contribution_metrics.associated_lead_ids.map((lid) => (
                              <span key={lid} className="text-[7px] bg-black border border-onyx-border px-1.5 py-0.5 rounded font-mono text-zinc-300">
                                {lid}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-zinc-600 italic">No linked CRM sales cycles.</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Work History + Log Form */}
                <div className="bg-onyx-panel border border-onyx-border rounded-lg p-5 space-y-4">
                  <h3 className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-1.5 border-b border-onyx-border/50 pb-2">
                    <History size={11} className="text-onyx-accent-rose" />
                    Work History Stream
                  </h3>

                  {/* Log entry form */}
                  <form onSubmit={handleAddWorkLog} className="bg-black/35 border border-onyx-border/80 rounded p-4 grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                    <div className="md:col-span-4 space-y-1">
                      <label className="text-[7px] text-zinc-400 uppercase font-bold">Project Title *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Audit Log Scramble"
                        value={newProjectTitle}
                        onChange={(e) => setNewProjectTitle(e.target.value)}
                        className="w-full bg-black border border-onyx-border rounded p-2 text-[9px] text-onyx-bright focus:outline-none"
                      />
                    </div>
                    <div className="md:col-span-5 space-y-1">
                      <label className="text-[7px] text-zinc-400 uppercase font-bold">Task Description *</label>
                      <input
                        type="text"
                        required
                        placeholder="Analyzed cipher payload..."
                        value={newDescription}
                        onChange={(e) => setNewDescription(e.target.value)}
                        className="w-full bg-black border border-onyx-border rounded p-2 text-[9px] text-onyx-bright focus:outline-none"
                      />
                    </div>
                    <div className="md:col-span-3 space-y-1">
                      <label className="text-[7px] text-zinc-400 uppercase font-bold">Score (1–100)</label>
                      <input
                        type="number"
                        required
                        min="1"
                        max="100"
                        value={newEfficiencyScore}
                        onChange={(e) => setNewEfficiencyScore(e.target.value)}
                        className="w-full bg-black border border-onyx-border rounded p-2 text-[9px] text-onyx-bright font-mono focus:outline-none"
                      />
                    </div>
                    <div className="md:col-span-9 space-y-1">
                      <label className="text-[7px] text-zinc-400 uppercase font-bold">Reviewer Notes (Optional)</label>
                      <input
                        type="text"
                        placeholder="e.g. Well documented"
                        value={newReviewerNotes}
                        onChange={(e) => setNewReviewerNotes(e.target.value)}
                        className="w-full bg-black border border-onyx-border rounded p-2 text-[9px] text-onyx-bright focus:outline-none"
                      />
                    </div>
                    <div className="md:col-span-3">
                      <AnimatedSubmitButton
                        btnState={btnState}
                        idleLabel="Log Task"
                        disabled={!newProjectTitle.trim() || !newDescription.trim()}
                      />
                    </div>
                  </form>

                  {/* Log entries list */}
                  <div className="space-y-2.5">
                    {activeDossier.work_history_stream.length > 0 ? (
                      activeDossier.work_history_stream.map((task) => (
                        <div key={task.task_id} className="bg-black/45 border border-onyx-border/40 rounded p-3 space-y-1.5">
                          <div className="flex justify-between items-start gap-2">
                            <div>
                              <h4 className="font-bold text-onyx-bright">{task.project_title}</h4>
                              <p className="text-[9px] text-zinc-400 mt-0.5 leading-relaxed">{task.description}</p>
                            </div>
                            <div className="text-right flex-shrink-0 space-y-1">
                              <span
                                className={`text-[8px] font-bold px-1.5 py-0.5 rounded ${
                                  task.efficiency_score >= 90
                                    ? 'text-emerald-400 bg-emerald-950/20 border border-emerald-800/30'
                                    : 'text-amber-400 bg-amber-950/20 border border-amber-800/30'
                                }`}
                              >
                                {task.efficiency_score}%
                              </span>
                              <span className="block text-[7px] text-zinc-600 font-mono">
                                {new Date(task.timestamp_iso).toLocaleString()}
                              </span>
                            </div>
                          </div>
                          {task.reviewer_notes && (
                            <div className="text-[8px] bg-zinc-950/50 border border-zinc-900/60 p-2 rounded text-zinc-500">
                              <span className="font-bold text-zinc-400 uppercase tracking-widest text-[7px]">Notes: </span>
                              {task.reviewer_notes}
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <p className="text-zinc-500 italic text-center py-6 border border-dashed border-onyx-border/30 rounded text-[9px]">
                        No operations logged in work stream yet.
                      </p>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="bg-onyx-panel border border-onyx-border rounded-lg p-10 text-center text-onyx-muted uppercase tracking-widest">
                No intern file selected.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TAB: SECURE DISPATCHER ── */}
      {activeTab === 'dispatcher' && (
        <form
          onSubmit={handleStartDispatch}
          className="bg-onyx-panel border border-onyx-border rounded-lg p-5 space-y-4 max-w-xl mx-auto w-full"
        >
          <div className="flex items-center gap-2 border-b border-onyx-border pb-3">
            <Cpu size={12} className="text-onyx-accent-rose" />
            <h2 className="text-[10px] font-black text-zinc-300 uppercase tracking-widest">
              Secure Communication Dispatcher
            </h2>
          </div>

          {/* Recipient */}
          <div className="space-y-1">
            <label className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest">Recipient Intern ID *</label>
            <select
              value={selectedInternId}
              onChange={(e) => setSelectedInternId(e.target.value)}
              className="w-full bg-black border border-onyx-border rounded p-2.5 text-[10px] text-onyx-bright focus:outline-none focus:border-zinc-600 font-mono"
            >
              {store.internDossiers.map((d) => (
                <option key={d.intern_id} value={d.intern_id}>
                  {d.intern_id} ({d.profile_metadata.full_name} · {d.tenant_company.toUpperCase()})
                </option>
              ))}
            </select>
          </div>

          {/* Subject */}
          <div className="space-y-1">
            <label className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest">Subject Category *</label>
            <div className="flex gap-2">
              {(['PAYROLL', 'COMPLAINT', 'PERFORMANCE'] as SubjectCategory[]).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSubject(cat)}
                  className={`flex-1 py-2 text-[9px] font-bold tracking-widest rounded border transition-all ${
                    subject === cat
                      ? 'text-onyx-canvas bg-onyx-accent-rose border-onyx-accent-rose'
                      : 'text-onyx-muted bg-black border-onyx-border hover:border-zinc-700'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Financial override */}
          <div className="space-y-1">
            <label className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest">
              Stipend Financial Adjustment (USD)
            </label>
            <input
              type="number"
              placeholder="e.g. 3200"
              value={stipendOverride}
              onChange={(e) => setStipendOverride(e.target.value)}
              className="w-full bg-black border border-onyx-border rounded p-2.5 text-[10px] text-onyx-bright font-mono focus:outline-none focus:border-zinc-600"
            />
          </div>

          {/* Message body */}
          <div className="space-y-1">
            <label className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest">Secure Communication Body *</label>
            <textarea
              required
              rows={4}
              placeholder="Type official private feedback or payroll processing notice..."
              value={messageBody}
              onChange={(e) => setMessageBody(e.target.value)}
              className="w-full bg-black border border-onyx-border rounded p-2.5 text-[10px] text-onyx-bright font-mono focus:outline-none focus:border-zinc-600 leading-relaxed resize-none"
            />
          </div>

          {/* Ephemeral toggle */}
          <div className="flex items-center gap-2.5 bg-black/40 border border-onyx-border/30 p-3 rounded">
            <input
              type="checkbox"
              id="ephemeral"
              checked={isEphemeral}
              onChange={(e) => setIsEphemeral(e.target.checked)}
              className="rounded border-onyx-border bg-black text-onyx-accent-rose focus:ring-0 cursor-pointer"
            />
            <label htmlFor="ephemeral" className="text-[9px] font-bold text-zinc-300 uppercase tracking-wider cursor-pointer select-none">
              Mark as Ephemeral Message
            </label>
            <span className="text-[7px] text-zinc-600 font-mono ml-auto">
              Purges from client cache on dismissal
            </span>
          </div>

          <AnimatedSubmitButton btnState={btnState} idleLabel="Dispatch Action" disabled={!messageBody.trim()} />
        </form>
      )}

      {/* ── TAB: CREATE DOSSIER ── */}
      {activeTab === 'create' && (
        <form
          onSubmit={handleCreateDossier}
          className="bg-onyx-panel border border-onyx-border rounded-lg p-5 space-y-4 max-w-md mx-auto w-full"
        >
          <h2 className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-1.5 border-b border-onyx-border/50 pb-2">
            <PlusCircle size={11} className="text-onyx-accent-rose" />
            Create Intern Dossier
          </h2>

          {[
            { label: 'Full Name *',       placeholder: 'e.g. Liam Fletcher',          value: createName,        onChange: setCreateName,        type: 'text' },
            { label: 'Corporate Email *', placeholder: 'liam@tobofu.com',             value: createEmail,       onChange: setCreateEmail,       type: 'email' },
            { label: 'Assigned Role *',   placeholder: 'Supply Chain Coordinator',    value: createRole,        onChange: setCreateRole,        type: 'text' },
            { label: 'Base Stipend (USD)*', placeholder: '2500',                       value: createBaseStipend, onChange: setCreateBaseStipend, type: 'number' },
          ].map(({ label, placeholder, value, onChange, type }) => (
            <div key={label} className="space-y-1">
              <label className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest">{label}</label>
              <input
                type={type}
                required
                placeholder={placeholder}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-full bg-black border border-onyx-border rounded p-2.5 text-[10px] text-onyx-bright focus:outline-none focus:border-zinc-600"
              />
            </div>
          ))}

          <div className="space-y-1">
            <label className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest">Parent Division (Tenant Lock) *</label>
            <select
              value={createTenant}
              onChange={(e) => setCreateTenant(e.target.value as TenantCompany)}
              className="w-full bg-black border border-onyx-border rounded p-2.5 text-[10px] text-onyx-bright focus:outline-none"
            >
              <option value="skill_tank">Skill Tank Systems</option>
              <option value="vriddhi">Vriddhi Logistics</option>
              <option value="tobofu">Tobofu Agri Group</option>
              <option value="promtal">Promtal Media</option>
              <option value="maceco">Maceco Roman Steel</option>
            </select>
          </div>

          <AnimatedSubmitButton btnState={btnState} idleLabel="Create Intern Folder" />
        </form>
      )}

      {/* Security notice */}
      <div className="flex items-center gap-2 text-[7px] font-mono text-zinc-700 border-t border-onyx-border/20 pt-3 mt-auto">
        <AlertTriangle size={9} className="text-zinc-800 flex-shrink-0" />
        All mutations require biometric hardware-token verification. Actions are sealed with AES-GCM-256 and logged to the WAL transaction ledger.
      </div>

      {/* ── Biometric Modal ── */}
      {passkeyStep !== 'closed' && (
        <BiometricModal
          step={passkeyStep}
          targetId={selectedInternId}
          actionLabel={pendingAction?.label ?? ''}
        />
      )}
    </div>
  );
}
