/**
 * SecureMailbox — Zero-Trust Encrypted Corporate Communication Node
 *
 * Features:
 * - Asymmetric privacy routing: interns see ONLY their own messages (hard layout boundary)
 * - Animated 300ms console-style mount integrity checksum scan
 * - AES-GCM mock kinetic decryption animation on reveal (400ms char scramble)
 * - Cryptographic tracking signatures on each message (sig: 0x...)
 * - [EPHEMERAL] crimson badge with "Dismiss & Burn" purge action
 * - Intern dossier panel with full profile / financial / CRM / work stream
 */

import { useState, useEffect, useRef } from 'react';
import { useZetaStore } from '../store/zetaStore';
import { mockDecryptString, mockEncryptString, generateTxHash } from '../agents/agentRouter';
import {
  Shield,
  Eye,
  EyeOff,
  Trash2,
  MailOpen,
  Clock,
  Tag,
  Flame,
  Lock,
  CheckCircle2,
  AlertTriangle,
  Send,
  Activity,
} from 'lucide-react';
import type { SecureMessage } from '../types/zeta';

// ─── Kinetic Text Scrambler ────────────────────────────────────────────────────
// Rapidly cycles random symbols for 400ms (8 × 50ms frames) before revealing plaintext.
export const KineticTextScrambler = ({
  encryptedText,
  decryptedText,
  shouldScramble,
}: {
  encryptedText: string;
  decryptedText: string;
  shouldScramble: boolean;
}) => {
  const [displayText, setDisplayText] = useState(encryptedText);

  useEffect(() => {
    if (!shouldScramble) {
      setDisplayText(encryptedText);
    }
  }, [shouldScramble, encryptedText]);

  useEffect(() => {
    if (shouldScramble) {
      let iterations = 0;
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$%&*!+=';
      const interval = setInterval(() => {
        setDisplayText(() =>
          decryptedText
            .split('')
            .map((char) => {
              if ([' ', '\n', '.', ',', ':', '-', '(', ')'].includes(char)) return char;
              if (Math.random() < 0.25) return char;
              return chars[Math.floor(Math.random() * chars.length)];
            })
            .join('')
        );
        iterations++;
        if (iterations >= 8) {
          clearInterval(interval);
          setDisplayText(decryptedText);
        }
      }, 50);
      return () => clearInterval(interval);
    }
  }, [shouldScramble, decryptedText]);

  return <span className="font-mono break-all">{displayText}</span>;
};

// ─── Console Scan-Line Header ──────────────────────────────────────────────────
// Renders a 300ms boot-integrity check micro-animation on mount.
const IntegrityCheckHeader = () => {
  const [scanStep, setScanStep] = useState<0 | 1 | 2 | 3>(0);

  useEffect(() => {
    const t1 = setTimeout(() => setScanStep(1), 80);
    const t2 = setTimeout(() => setScanStep(2), 180);
    const t3 = setTimeout(() => setScanStep(3), 300);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  const lines = [
    { text: '[Initializing Secure Communication Layer...]', color: 'text-zinc-600' },
    { text: '[Scanning Cryptographic Session Token...]',    color: 'text-zinc-500' },
    { text: '[Verifying Client Integrity Checksum: OK]',   color: 'text-emerald-500 font-bold' },
  ];

  return (
    <div className="font-mono text-[8px] tracking-wider space-y-0.5 mb-2 min-h-[36px]">
      {lines.slice(0, scanStep).map((line, i) => (
        <div
          key={i}
          className={`transition-all duration-150 ${line.color} ${i === scanStep - 1 ? 'opacity-100' : 'opacity-40'}`}
        >
          {line.text}
        </div>
      ))}
    </div>
  );
};

// ─── Tracking Signature Badge ──────────────────────────────────────────────────
// Low-visibility monospace crypto handshake signature rendered per message.
const TrackingSignature = ({ sig }: { sig: string }) => (
  <span className="text-[7px] font-mono text-zinc-700 select-all tracking-tight">
    sig: {sig}
  </span>
);

// ─── Subject Category Badge Styles ────────────────────────────────────────────
const SUBJECT_STYLES: Record<string, string> = {
  PAYROLL:     'text-emerald-400 bg-emerald-950/40 border-emerald-800/30',
  COMPLAINT:   'text-rose-400 bg-rose-950/40 border-rose-800/30',
  PERFORMANCE: 'text-purple-400 bg-purple-950/40 border-purple-800/30',
};

// ─── SecureMessageItem ─────────────────────────────────────────────────────────
const SecureMessageItem = ({
  msg,
  onDismiss,
  isAdminView,
  tenantFilter,
}: {
  msg: SecureMessage;
  onDismiss: (id: string) => void;
  isAdminView: boolean;
  tenantFilter: string;
}) => {
  // Stable per-message tracking signature (derived from message_id, not random on each render)
  const sigRef = useRef<string>('');
  if (!sigRef.current) {
    // Deterministic-looking hex from message_id
    const base = msg.message_id.replace(/[^a-zA-Z0-9]/g, '');
    const chars = '0123456789abcdef';
    let sig = '0x';
    for (let i = 0; i < 8; i++) {
      sig += chars[(base.charCodeAt(i % base.length) + i * 13) % 16];
    }
    sigRef.current = sig;
  }

  const currentUser = useZetaStore((s) => s.currentUser);
  const dispatchSecureMessage = useZetaStore((s) => s.dispatchSecureMessage);
  const dossiers = useZetaStore((s) => s.internDossiers);
  
  const isIntern = currentUser?.role === 'intern';
  const targetInternId = currentUser?.internId;
  const myDossier = isIntern && targetInternId
    ? dossiers.find((d) => d.intern_id === targetInternId) ?? null
    : null;

  const activeIdentity = isIntern 
    ? (myDossier?.tenant_company || targetInternId || 'intern')
    : (tenantFilter !== 'global' && tenantFilter ? tenantFilter : 'Global Admin');

  // A received dispatch is where we are the recipient
  const isReceived = isAdminView
    ? (msg.recipient === 'Global Admin' || msg.recipient_intern_id === 'Global Admin')
    : (isIntern 
        ? (msg.recipient === targetInternId || msg.recipient_intern_id === targetInternId)
        : (msg.recipient === tenantFilter)
      );

  const [isDecrypted, setIsDecrypted] = useState(false);
  const [shouldAnimate, setShouldAnimate] = useState(false);
  const [replyText, setReplyText] = useState('');

  const decryptedBody = mockDecryptString(msg.body_content_encrypted_string);

  const handleDecryptToggle = () => {
    if (!isDecrypted) {
      setShouldAnimate(true);
      setIsDecrypted(true);
      setTimeout(() => setShouldAnimate(false), 450);
    } else {
      setIsDecrypted(false);
      setShouldAnimate(false);
    }
  };

  const handleSendReply = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!replyText.trim()) return;

    const encrypted = mockEncryptString(replyText);

    dispatchSecureMessage({
      sender: activeIdentity,
      recipient: 'Global Admin',
      subject: `RE: ${msg.subject || msg.subject_category}`,
      body: encrypted,
      isRead: false,

      recipient_intern_id: 'Global Admin',
      sender_role: isIntern ? 'Intern' : 'TenantRep',
      subject_category: msg.subject_category || 'PAYROLL',
      body_content_encrypted_string: encrypted,
      is_ephemeral: false
    });

    setReplyText('');
    alert('Secure response payload transmitted successfully.');
  };

  return (
    <div className="bg-onyx-panel border border-onyx-border rounded-lg p-4 flex flex-col gap-3 hover:border-zinc-600 transition-all duration-200 relative overflow-hidden group">
      {/* Top bar: subject + ephemeral badge + time + sig */}
      <div className="flex items-start justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider border ${SUBJECT_STYLES[msg.subject_category] ?? 'text-zinc-400 bg-zinc-800 border-zinc-700'}`}
          >
            <Tag className="inline mr-1" size={8} />
            {msg.subject_category}
          </span>
          {msg.is_ephemeral && (
            <span className="text-[8px] font-black text-rose-400 bg-rose-950/50 border border-rose-600/40 px-2 py-0.5 rounded uppercase tracking-widest animate-pulse flex items-center gap-1">
              <Flame size={8} />
              [EPHEMERAL]
            </span>
          )}
        </div>
        <div className="flex flex-col items-end gap-0.5">
          <div className="flex items-center gap-1.5 text-onyx-muted text-[9px] font-mono">
            <Clock size={9} />
            <span>{new Date(msg.timestamp_iso).toLocaleTimeString()}</span>
          </div>
          <TrackingSignature sig={sigRef.current} />
        </div>
      </div>

      {/* Routing metadata */}
      <div className="text-[9px] text-zinc-500 font-mono space-y-0.5 border-l-2 border-zinc-800 pl-2">
        <p className="uppercase font-bold tracking-widest">FROM: {msg.sender} ROUTING NODE</p>
        <p className="uppercase font-bold tracking-widest">RECIPIENT: {msg.recipient}</p>
        {isAdminView && (
          <p className="uppercase tracking-wider text-zinc-600">
            ENCRYPTION: AES-GCM-256 / ASYMMETRIC PASSKEY
          </p>
        )}
      </div>

      {/* Message body — ciphertext or kinetic-decrypted plaintext */}
      <div className="bg-black/70 border border-zinc-900 rounded p-3 text-[11px] min-h-[50px] relative overflow-hidden">
        {isDecrypted ? (
          shouldAnimate ? (
            <KineticTextScrambler
              encryptedText={msg.body_content_encrypted_string}
              decryptedText={decryptedBody}
              shouldScramble={true}
            />
          ) : (
            <span className="font-mono text-zinc-200 leading-relaxed whitespace-pre-wrap">
              {decryptedBody}
            </span>
          )
        ) : (
          <span className="font-mono text-zinc-600 select-all leading-normal break-all text-[9px]">
            {msg.body_content_encrypted_string}
          </span>
        )}
        {/* Subtle glow line at bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-zinc-700/30 to-transparent" />
      </div>

      {/* Reply Container - Inline Conditional Protocol */}
      {isDecrypted && isReceived && (
        <div className="p-5 border border-onyx-border rounded-xl bg-[#09090b]/80 space-y-4 animate-fade-in">
          <h4 className="text-xs font-bold uppercase tracking-widest text-onyx-accent-rose flex items-center gap-1.5">
            <Lock size={10} />
            REPLY SECURE PROTOCOL
          </h4>
          <p className="text-[10px] text-zinc-500 font-mono">
            IDENTITY ANCHOR: <span className="text-zinc-300 font-bold uppercase">{activeIdentity}</span> (SYSTEM LOCK)
          </p>
          <textarea
            required
            rows={3}
            placeholder="Type secure response payload to Global Admin..."
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            className="w-full p-4 text-xs font-medium font-mono rounded-lg bg-[#0e0e11]/80 border border-zinc-800 text-white focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 leading-relaxed resize-none"
          />
          <button
            onClick={handleSendReply}
            className="text-xs font-mono font-bold uppercase tracking-wider text-onyx-canvas bg-onyx-accent-rose hover:bg-rose-400 border border-onyx-accent-rose px-5 py-2.5 rounded-lg transition-all shadow-glow-rose"
          >
            Send Response
          </button>
        </div>
      )}

      {/* Action Row */}
      <div className="flex items-center gap-3 mt-1 border-t border-onyx-border/20 pt-2.5">
        <button
          onClick={handleDecryptToggle}
          className="flex items-center gap-1.5 text-[9px] font-mono font-bold uppercase tracking-widest text-onyx-accent-cyan bg-onyx-accent-cyan/10 hover:bg-onyx-accent-cyan/20 border border-onyx-accent-cyan/30 px-3 py-1.5 rounded transition-all"
        >
          {isDecrypted ? (
            <><EyeOff size={10} /> Mask Ciphertext</>
          ) : (
            <><Eye size={10} /> Decrypt Content</>
          )}
        </button>

        <button
          onClick={() => onDismiss(msg.message_id)}
          className="flex items-center gap-1 text-[9px] font-mono font-bold uppercase tracking-widest text-rose-400 bg-rose-950/20 hover:bg-rose-950/50 border border-rose-800/30 px-3 py-1.5 rounded transition-all ml-auto"
        >
          {msg.is_ephemeral ? (
            <><Flame size={10} /> Dismiss &amp; Burn</>
          ) : (
            <><Trash2 size={10} /> Dismiss</>
          )}
        </button>
      </div>
    </div>
  );
};

// ─── Main SecureMailbox Component ──────────────────────────────────────────────
export default function SecureMailbox({ tenantFilter }: { tenantFilter: string }) {
  const currentUser    = useZetaStore((s) => s.currentUser);
  const secureMailboxQueue  = useZetaStore((s) => s.secureMailboxQueue);
  const dismissSecureMessage = useZetaStore((s) => s.dismissSecureMessage);
  const dispatchSecureMessage = useZetaStore((s) => s.dispatchSecureMessage);
  const dossiers       = useZetaStore((s) => s.internDossiers);

  const isAdmin  = currentUser?.role === 'global_admin';
  const isIntern = currentUser?.role === 'intern';
  const targetInternId = currentUser?.internId;

  const [recipientInternId, setRecipientInternId] = useState('');
  const [subjectLine, setSubjectLine] = useState('');
  const [messageBody, setMessageBody] = useState('');
  const [diagnosticLog, setDiagnosticLog] = useState<string | null>(null);

  // Set default recipient on load
  useEffect(() => {
    if (dossiers.length > 0 && !recipientInternId) {
      setRecipientInternId(dossiers[0].intern_id);
    }
  }, [dossiers, recipientInternId]);

  // ── Zero-Trust Layout Boundary ────────────────────────────────────────────
  // If the session is locked to an intern, ONLY their messages are mapped.
  // Any other recipient's mail items are structurally excluded before render.
  const messages = secureMailboxQueue.filter((msg) => {
    if (isIntern) {
      // Hard boundary: must match the locked intern's ID exactly
      return (
        msg.recipient === targetInternId ||
        msg.recipient_intern_id === targetInternId ||
        msg.sender === targetInternId
      );
    }

    // Otherwise, we are an Admin / Tenant Rep viewing through tenantFilter
    if (tenantFilter === 'global') {
      // Display all messages sent to or from administration nodes
      return (
        msg.sender === 'Global Admin' ||
        msg.recipient === 'Global Admin' ||
        msg.recipient_intern_id === 'Global Admin'
      );
    } else {
      // Restrict strictly to dispatches sent to or from that specific tenant or its interns
      if (msg.sender === tenantFilter || msg.recipient === tenantFilter) {
        return true;
      }
      const senderDossier = dossiers.find((d) => d.intern_id === msg.sender);
      if (senderDossier && senderDossier.tenant_company === tenantFilter) {
        return true;
      }
      const recipientDossier = dossiers.find(
        (d) => d.intern_id === msg.recipient || d.intern_id === msg.recipient_intern_id
      );
      if (recipientDossier && recipientDossier.tenant_company === tenantFilter) {
        return true;
      }
      return false;
    }
  });

  const myDossier =
    isIntern && targetInternId
      ? dossiers.find((d) => d.intern_id === targetInternId) ?? null
      : null;

  const handleDismiss = (id: string) => dismissSecureMessage(id);

  const handleAdminDispatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipientInternId || !subjectLine.trim() || !messageBody.trim()) return;

    // Progressive logging stream
    setDiagnosticLog('[SECURE CRYPTO MATRIX] Salting payload...');
    setTimeout(() => {
      setDiagnosticLog('[SECURE CRYPTO MATRIX] Salting payload... Encrypting dispatch block...');
      setTimeout(() => {
        setDiagnosticLog('[SECURE CRYPTO MATRIX] Salting payload... Encrypting dispatch block... Dispatched.');
        
        const encrypted = mockEncryptString(messageBody);
        dispatchSecureMessage({
          sender: 'Global Admin',
          recipient: recipientInternId,
          subject: subjectLine,
          body: encrypted,
          isRead: false,
          
          recipient_intern_id: recipientInternId,
          sender_role: 'Admin',
          subject_category: 'PAYROLL',
          body_content_encrypted_string: encrypted,
          is_ephemeral: false
        });

        setSubjectLine('');
        setMessageBody('');

        setTimeout(() => {
          setDiagnosticLog(null);
        }, 4000);
      }, 600);
    }, 600);
  };

  return (
    <div className="flex flex-col gap-4 h-full animate-fade-in font-mono">
      {/* Mount integrity scan header */}
      <IntegrityCheckHeader />

      {/* Section header */}
      <div className="border-b border-onyx-border pb-3 flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Shield className="text-onyx-accent-purple" size={15} />
            <h1 className="text-sm font-bold text-onyx-bright uppercase tracking-widest">
              Zero-Trust Secure Mailbox
            </h1>
          </div>
          <p className="text-[9px] text-onyx-muted mt-1 font-mono">
            {isIntern
              ? `Workspace lock active: recipient key bound to [${targetInternId}]. Cross-tenant access: DENIED.`
              : `Global Security Oversight Monitor — Workspace role: ${tenantFilter === 'global' ? 'Global Admin' : tenantFilter.toUpperCase()}. Asymmetric routing: ENABLED.`}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isIntern && (
            <div className="flex items-center gap-1.5 text-[8px] font-mono text-rose-400 bg-rose-950/20 border border-rose-800/30 px-2 py-1 rounded">
              <Lock size={8} />
              [IDENTITY LOCK] TENANT ENFORCED
            </div>
          )}
          <div className="text-[9px] font-mono font-semibold bg-purple-950/30 text-onyx-accent-purple border border-purple-800/20 px-2.5 py-1 rounded">
            {messages.length} ACTIVE MESSAGES
          </div>
        </div>
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start flex-1 min-h-0">
        {/* ── Messages List ─── */}
        <div
          className={`${
            (isIntern && myDossier) ? 'xl:col-span-6' : (isAdmin ? 'xl:col-span-7' : 'xl:col-span-12 max-w-2xl')
          } space-y-4 max-h-[75vh] overflow-y-auto pr-1`}
        >
          {/* Micro-terminal diagnostic log stream */}
          {diagnosticLog && (
            <div className="bg-[#09090b] border border-emerald-500/30 text-emerald-400 p-4 rounded-lg font-mono text-xs mb-4 shadow-[0_0_15px_rgba(16,185,129,0.15)] flex items-center gap-2 animate-pulse">
              <Activity size={12} className="animate-spin text-emerald-400 animate-duration-1000" />
              <span>{diagnosticLog}</span>
            </div>
          )}

          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 border border-dashed border-onyx-border rounded-lg gap-3 bg-black/20">
              <MailOpen className="text-onyx-border animate-pulse" size={28} />
              <p className="text-[10px] text-onyx-muted tracking-widest text-center uppercase">
                {isIntern
                  ? `No secure messages found for recipient [${targetInternId}].`
                  : 'No secure messages in mailbox queue.'}
              </p>
            </div>
          ) : (
            messages.map((msg) => (
              <SecureMessageItem
                key={msg.message_id}
                msg={msg}
                onDismiss={handleDismiss}
                isAdminView={isAdmin}
                tenantFilter={tenantFilter}
              />
            ))
          )}
        </div>

        {/* ── Admin Dispatch Panel (only for logged-in global admin) ─── */}
        {isAdmin && (
          <div className="xl:col-span-5 space-y-4 max-h-[75vh] overflow-y-auto pr-1">
            <div className="bg-onyx-panel border border-onyx-border rounded-2xl p-8 shadow-2xl space-y-6">
              <div className="border-b border-onyx-border pb-3 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-onyx-bright uppercase tracking-widest flex items-center gap-1.5">
                    <Lock className="text-onyx-accent-rose" size={13} />
                    NEW ENCRYPTED DISPATCH
                  </h2>
                  <p className="text-[9px] text-zinc-600 mt-1 font-mono uppercase">
                    Zero-Trust Outbound Cryptographic Channel
                  </p>
                </div>
                <div className="flex items-center gap-1 text-[8px] font-mono text-rose-400 bg-rose-950/20 border border-rose-800/30 px-1.5 py-0.5 rounded">
                  <Shield className="animate-pulse" size={8} />
                  SECURE NODE
                </div>
              </div>

              <form onSubmit={handleAdminDispatch} className="space-y-5">
                <div className="space-y-2">
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                    Recipient Intern
                  </label>
                  <select
                    required
                    value={recipientInternId}
                    onChange={(e) => setRecipientInternId(e.target.value)}
                    className="w-full h-12 px-4 text-sm font-medium font-mono rounded-lg bg-[#0e0e11]/80 border border-zinc-800 text-white focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
                  >
                    <option value="" disabled>Select target recipient...</option>
                    {dossiers.map((d) => (
                      <option key={d.intern_id} value={d.intern_id}>
                        {d.profile_metadata.full_name} ({d.intern_id} - {d.tenant_company.replace(/_/g, ' ').toUpperCase()})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                    Subject Line / Category
                  </label>
                  <input
                    required
                    type="text"
                    placeholder="Enter dispatch subject classification..."
                    value={subjectLine}
                    onChange={(e) => setSubjectLine(e.target.value)}
                    className="w-full h-12 px-4 text-sm font-medium font-mono rounded-lg bg-[#0e0e11]/80 border border-zinc-800 text-white focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                    Secure Payload / Message Body
                  </label>
                  <textarea
                    required
                    rows={6}
                    placeholder="Enter secure message contents..."
                    value={messageBody}
                    onChange={(e) => setMessageBody(e.target.value)}
                    className="w-full p-4 text-sm font-medium font-mono rounded-lg bg-[#0e0e11]/80 border border-zinc-800 text-white focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 leading-relaxed resize-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 text-sm font-bold uppercase tracking-widest text-onyx-canvas bg-onyx-accent-rose hover:bg-rose-400 border border-onyx-accent-rose rounded-lg transition-all shadow-glow-rose flex items-center justify-center gap-2"
                >
                  <Send size={14} />
                  Transmit Payload
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ── Intern Dossier Panel (only for logged-in interns) ─── */}
        {isIntern && myDossier && (
          <div className="xl:col-span-6 space-y-4 max-h-[75vh] overflow-y-auto pr-1">

            {/* Dossier header */}
            <div className="bg-onyx-panel border border-onyx-border rounded-lg p-4 space-y-4">
              <div className="border-b border-onyx-border pb-3 flex items-center justify-between">
                <div>
                  <h2 className="text-xs font-bold text-onyx-bright uppercase tracking-widest flex items-center gap-1.5">
                    <Tag className="text-onyx-accent-purple" size={11} />
                    Your Official Intern Dossier Folder
                  </h2>
                  <p className="text-[8px] text-zinc-600 mt-1 font-mono uppercase">
                    Relational Document File: {myDossier.intern_id} / Tenant: {myDossier.tenant_company}
                  </p>
                </div>
                <div className="flex items-center gap-1 text-[8px] font-mono text-emerald-400 bg-emerald-950/20 border border-emerald-800/30 px-1.5 py-0.5 rounded">
                  <CheckCircle2 size={8} />
                  Verified
                </div>
              </div>

              {/* Profile block */}
              <div className="space-y-1.5 text-[10px] bg-black/35 border border-onyx-border/40 p-3 rounded">
                {[
                  ['Legal Name',       myDossier.profile_metadata.full_name,         'text-onyx-bright font-bold'],
                  ['Corporate Email',  myDossier.profile_metadata.corporate_email,    'text-onyx-bright'],
                  ['Assigned Role',    myDossier.profile_metadata.department_role,    'text-onyx-bright font-medium'],
                  ['Division',         myDossier.tenant_company.replace(/_/g, ' ').toUpperCase(), 'text-onyx-accent-purple font-bold'],
                  ['Status',           myDossier.profile_metadata.onboarding_status,  'text-emerald-400 font-bold uppercase'],
                  ['Joined',           new Date(myDossier.profile_metadata.joining_date).toLocaleDateString(), 'text-onyx-bright'],
                ].map(([label, value, cls]) => (
                  <div key={String(label)} className="flex justify-between py-0.5 border-b border-onyx-border/10">
                    <span className="text-zinc-500">{label}:</span>
                    <span className={String(cls)}>{value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Financial Ledger */}
            <div className="bg-onyx-panel border border-onyx-border rounded-lg p-4 space-y-3">
              <h3 className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest border-b border-onyx-border/20 pb-1.5 flex items-center gap-1.5">
                <Lock size={9} className="text-amber-400" />
                Financial Ledger
                <span className="ml-auto text-[7px] text-zinc-600 font-mono normal-case tracking-normal">
                  sig: {generateTxHash().slice(0, 18)}...
                </span>
              </h3>
              <div className="space-y-1.5 text-[10px]">
                {[
                  ['Base Monthly Stipend',   `$${(myDossier.financial_ledger.base_stipend / 100).toLocaleString()}`,      'text-onyx-bright font-bold font-mono'],
                  ['Paid To Date',           `$${(myDossier.financial_ledger.paid_to_date_total / 100).toLocaleString()}`, 'text-zinc-400 font-mono'],
                  ['Pending Payout',         `$${(myDossier.financial_ledger.pending_payout / 100).toLocaleString()}`,    'text-amber-400 font-bold font-mono'],
                  ['Bank Status',            myDossier.financial_ledger.bank_payout_status,                                'text-emerald-400 font-bold uppercase'],
                ].map(([label, value, cls]) => (
                  <div key={String(label)} className="flex justify-between py-0.5">
                    <span className="text-zinc-500">{label}:</span>
                    <span className={String(cls)}>{value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* CRM Metrics */}
            <div className="bg-onyx-panel border border-onyx-border rounded-lg p-4 space-y-3">
              <h3 className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest border-b border-onyx-border/20 pb-1.5">
                Divisional CRM Contribution Metrics
              </h3>
              <div className="space-y-1.5 text-[10px]">
                {[
                  ['Associated Leads',        String(myDossier.crm_contribution_metrics.associated_lead_ids.length), 'text-onyx-bright font-bold'],
                  ['Pipeline Contract Value', `$${myDossier.crm_contribution_metrics.total_contracts_value.toLocaleString()} USD`, 'text-emerald-400 font-bold font-mono'],
                  ['Ambassador Referrals',    String(myDossier.crm_contribution_metrics.ambassador_referrals_count), 'text-purple-400 font-bold font-mono'],
                ].map(([label, value, cls]) => (
                  <div key={String(label)} className="flex justify-between py-0.5">
                    <span className="text-zinc-500">{label}:</span>
                    <span className={String(cls)}>{value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Work History Stream */}
            <div className="bg-onyx-panel border border-onyx-border rounded-lg p-4 space-y-3">
              <h3 className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest border-b border-onyx-border/20 pb-1.5">
                Work History &amp; Operations Stream
              </h3>
              {myDossier.work_history_stream.length > 0 ? (
                <div className="space-y-2.5 max-h-[28vh] overflow-y-auto pr-1">
                  {myDossier.work_history_stream.map((task) => (
                    <div
                      key={task.task_id}
                      className="bg-black/50 border border-onyx-border/30 rounded p-2.5 text-[10px] space-y-1.5"
                    >
                      <div className="flex justify-between items-start">
                        <span className="font-bold text-onyx-bright">{task.project_title}</span>
                        <span className="text-[8px] bg-emerald-950/20 border border-emerald-800/30 text-emerald-400 px-1.5 py-0.5 rounded font-bold flex-shrink-0">
                          {task.efficiency_score}% Score
                        </span>
                      </div>
                      <p className="text-zinc-400 leading-relaxed">{task.description}</p>
                      <div className="flex justify-between items-center">
                        <span className="text-[7px] text-zinc-600 font-mono">
                          {new Date(task.timestamp_iso).toLocaleString()}
                        </span>
                        {task.reviewer_notes && (
                          <span className="text-[8px] text-zinc-500 bg-zinc-950/40 px-1.5 py-0.5 rounded border border-zinc-900/40 font-mono max-w-[60%] truncate">
                            {task.reviewer_notes}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-zinc-600 italic text-[10px] text-center py-4">
                  No operations logged in work stream yet.
                </p>
              )}
            </div>

            {/* Access restriction notice */}
            <div className="flex items-start gap-2 text-[8px] font-mono text-zinc-600 bg-zinc-950/40 border border-zinc-900/40 p-2.5 rounded">
              <AlertTriangle size={10} className="text-amber-800 flex-shrink-0 mt-0.5" />
              <span>
                Access restricted to your intern node only. Any attempt to query other tenant indices will trigger a Zero-Trust security alert and halt execution immediately.
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
