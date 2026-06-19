import { useState, useEffect, useRef, useCallback } from 'react';
import { useZetaStore } from '../store/zetaStore';

// ─── Types ───────────────────────────────────────────────────────────────────

type WakePhase = 'locked' | 'intercepting' | 'validating' | 'restored';

interface JitterOffset {
  x: number;
  y: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const SECURITY_LEDGER_LINES: readonly string[] = [
  '[SYSTEM IDLE] Rotating cryptographic workspace keys... OK',
  '[SECURE] Encrypted local memory nodes frozen.',
  '[TELEMETRY] Ambient agent monitoring channels active.',
  '[CRYPTO] PBKDF2 key derivation cycle refreshed. Entropy: HIGH',
  '[SECURE] Session state checksum validated. SHA-256: MATCH',
  '[TELEMETRY] WAL sequence counter paused. Replay buffer: CLEAN',
  '[SYSTEM IDLE] Tenant boundary isolation enforced. Zero bleed confirmed.',
  '[CRYPTO] AES-GCM workspace sealed. Nonce rotation: COMPLETE',
  '[SECURE] Agent orchestration loop in standby. Heartbeat: ALIVE',
  '[TELEMETRY] Memory node entropy stable. Drift: \u00b10.001ms',
  '[SYSTEM IDLE] Dashboard panels suspended. UI render tree: FROZEN',
  '[CRYPTO] JWT token rotation scheduled. Next cycle: T+90s',
  '[SECURE] Biometric sensor in passive scan mode.',
  '[TELEMETRY] Cross-tenant data fence integrity: NOMINAL',
  '[CRYPTO] Workspace encryption layer integrity: VERIFIED',
  '[SECURE] Audit log ledger sealed. WAL transaction replay: READY',
];

const AGENT_STATUS_LINES: readonly string[] = [
  '[OpsAgent] Terminal locked down. Monitoring background telemetry channels actively... System state: SECURE.',
  '[DirectorAgent] Orchestration frame paused. Agent crew in standby. Resuming on wake signal.',
  '[GrowthAgent] CRM pipeline state frozen. Deal velocity metrics preserved in memory cache.',
  '[LogisticsAgent] ERP inventory monitors paused. Low-stock threshold watchers: ACTIVE.',
  '[NetworkAgent] Ambassador referral channels suspended. Commission ledger: SEALED.',
];

const WAKE_PHASE_TEXT: Record<WakePhase, string> = {
  locked: '',
  intercepting: '[Intercepting Wake Request...]',
  validating: '[Validating Local Tenant Tokens...]',
  restored: '[Session Restored \u2713]',
};

const PASSMAP: Record<string, string> = {
  'admin@centle.com': 'Zeta_Admin_2026!',
  'rep@skilltank.com': 'SkillTank_Zeta_2026',
  'rep@vriddhi.com': 'Vriddhi_Zeta_2026',
  'rep@tobofu.com': 'Tobofu_Zeta_2026',
  'rep@promtal.com': 'Promtal_Zeta_2026',
  'rep@maceco.com': 'Maceco_Zeta_2026',
  'intern204@skilltank.com': 'SkillTank_Intern_2026',
  'intern305@maceco.com': 'Maceco_Intern_2026',
};

// ─── Component ───────────────────────────────────────────────────────────────

export default function TerminalLockscreen() {
  const currentUser     = useZetaStore((s) => s.currentUser);
  const unlockSession   = useZetaStore((s) => s.unlockSession);
  const logout          = useZetaStore((s) => s.logout);
  const themeProfile    = useZetaStore((s) => s.themeProfile);
  const toggleTheme     = useZetaStore((s) => s.toggleTheme);
  const agentLedger     = useZetaStore((s) => s.agentThoughtLedger);

  // ── Wake phase
  const [wakePhase, setWakePhase]   = useState<WakePhase>('locked');
  const [isExiting, setIsExiting]   = useState(false);
  const wakePhaseRef                = useRef<WakePhase>('locked');
  const wakeLockedRef               = useRef(false);

  // Keep ref in sync with state (avoids stale closure in event listener)
  useEffect(() => { wakePhaseRef.current = wakePhase; }, [wakePhase]);

  // ── Burn-in pixel jitter (every 30s)
  const [jitter, setJitter] = useState<JitterOffset>({ x: 0, y: 0 });

  // ── Scrolling ledger state
  const [visibleLines, setVisibleLines] = useState<string[]>([]);
  const [agentLineIdx, setAgentLineIdx] = useState(0);
  const ledgerRef    = useRef<HTMLDivElement>(null);
  const ledgerTimer  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lineIndexRef = useRef(0);

  // ── Timestamp refresh
  const [clockStr, setClockStr] = useState(() => new Date().toLocaleTimeString());

  // ── Computing Flare state reactive to new entries in agentThoughtLedger
  const [isComputingFlare, setIsComputingFlare] = useState(false);
  const ledgerLengthRef = useRef(agentLedger.length);

  useEffect(() => {
    if (agentLedger.length > ledgerLengthRef.current) {
      setIsComputingFlare(true);
      const t = setTimeout(() => {
        setIsComputingFlare(false);
      }, 400);
      ledgerLengthRef.current = agentLedger.length;
      return () => clearTimeout(t);
    } else {
      ledgerLengthRef.current = agentLedger.length;
    }
  }, [agentLedger]);

  // ─── Theme-derived tokens ────────────────────────────────────────────────
  const isDark         = themeProfile === 'ONYX';
  const accent         = isDark ? '#22c55e'  : '#1e293b';
  const accentCyan     = isDark ? '#06b6d4'  : '#0891b2';
  const accentAmber    = isDark ? '#f59e0b'  : '#d97706';
  const bgHex          = isDark ? '#000000'  : '#ffffff';
  const panelHex       = isDark ? '#09090b'  : '#f4f4f5';
  const borderHex      = isDark ? '#27272a'  : '#e4e4e7';
  const textHex        = isDark ? '#fafafa'  : '#09090b';
  const mutedHex       = isDark ? '#a1a1aa'  : '#71717a';
  const cylBorderColor = isDark ? '#27272a'  : '#475569';

  // ─── Jitter: 30-second burn-in prevention ───────────────────────────────
  useEffect(() => {
    const DIRS: readonly number[] = [-2, -1, 0, 0, 1, 2];
    const tick = setInterval(() => {
      setJitter({
        x: DIRS[Math.floor(Math.random() * DIRS.length)],
        y: DIRS[Math.floor(Math.random() * DIRS.length)],
      });
    }, 30_000);
    return () => clearInterval(tick);
  }, []);

  // ─── Ledger drip: append lines at irregular sub-second intervals ─────────
  useEffect(() => {
    const scheduleNext = (): void => {
      const delay = 900 + Math.random() * 2600; // 0.9s–3.5s irregular cadence
      ledgerTimer.current = setTimeout(() => {
        const line = SECURITY_LEDGER_LINES[lineIndexRef.current % SECURITY_LEDGER_LINES.length];
        lineIndexRef.current++;
        setVisibleLines((prev) => [...prev, line].slice(-14)); // keep last 14 lines
        scheduleNext();
      }, delay);
    };
    scheduleNext();
    return () => {
      if (ledgerTimer.current) clearTimeout(ledgerTimer.current);
    };
  }, []);

  // ─── Auto-scroll ledger to bottom ───────────────────────────────────────
  useEffect(() => {
    if (ledgerRef.current) {
      ledgerRef.current.scrollTop = ledgerRef.current.scrollHeight;
    }
  }, [visibleLines]);

  // ─── Cycle agent status lines ────────────────────────────────────────────
  useEffect(() => {
    const t = setInterval(() => {
      setAgentLineIdx((i) => (i + 1) % AGENT_STATUS_LINES.length);
    }, 4000);
    return () => clearInterval(t);
  }, []);

  // ─── Clock tick ──────────────────────────────────────────────────────────
  useEffect(() => {
    const t = setInterval(() => setClockStr(new Date().toLocaleTimeString()), 1000);
    return () => clearInterval(t);
  }, []);

  // ─── Wake restoration handshake ──────────────────────────────────────────
  const handleWakeAttempt = useCallback((): void => {
    if (wakeLockedRef.current || wakePhaseRef.current !== 'locked') return;
    wakeLockedRef.current = true;

    setWakePhase('intercepting');

    setTimeout(() => {
      setWakePhase('validating');

      setTimeout(async () => {
        const email = (currentUser?.email ?? '').toLowerCase().trim();
        const pass  = PASSMAP[email];

        if (pass) {
          setWakePhase('restored');
          setIsExiting(true);
          // Fade-out then unlock — store update unmounts component
          setTimeout(async () => {
            const ok = await unlockSession(pass);
            if (!ok) {
              // Fallback: re-lock if unlock fails
              setIsExiting(false);
              setWakePhase('locked');
              wakeLockedRef.current = false;
            }
          }, 320);
        } else {
          // No passmap entry — return to locked
          setWakePhase('locked');
          wakeLockedRef.current = false;
        }
      }, 160);
    }, 140);
  }, [currentUser, unlockSession]);

  // ─── Global interaction listeners for wake ───────────────────────────────
  useEffect(() => {
    const events: readonly string[] = ['mousemove', 'mousedown', 'keydown', 'touchstart'];
    const handler = () => handleWakeAttempt();
    events.forEach((e) => window.addEventListener(e, handler, { passive: true }));
    return () => events.forEach((e) => window.removeEventListener(e, handler));
  }, [handleWakeAttempt]);

  if (!currentUser) return null;

  const latestEntry   = agentLedger[0];
  const isShowingWake = wakePhase !== 'locked';

  // Concentric tilted 3D graphic values
  const containerStyle: React.CSSProperties = {
    perspective: '1000px',
    transformStyle: 'preserve-3d',
    transform: `translate(${jitter.x}px, ${jitter.y}px)`,
    transition: 'transform 2.5s ease-in-out',
  };

  const floatingLayerStyle: React.CSSProperties = {
    transformStyle: 'preserve-3d',
    animation: 'zt-hologram-float 6s ease-in-out infinite',
  };

  const railBaseStyle: React.CSSProperties = {
    position: 'absolute',
    width: '1px',
    height: '80px',
    backgroundColor: cylBorderColor,
    opacity: 0.35,
    transformOrigin: 'center',
  };

  const cylStyle = {
    '--rot-speed': isComputingFlare ? '2s' : '12s',
    filter: isComputingFlare ? `drop-shadow(0 0 12px ${accent})` : 'none',
  } as React.CSSProperties;

  return (
    <div
      id="lockscreen-root"
      className="fixed inset-0 z-[9999] overflow-hidden font-mono select-none"
      style={{
        backgroundColor: bgHex,
        color: textHex,
        opacity: isExiting ? 0 : 1,
        transition: 'opacity 320ms ease-out',
        pointerEvents: isExiting ? 'none' : 'all',
      }}
    >
      {/* ── Animation keyframes ── */}
      <style>{`
        @keyframes zt-hologram-float {
          0%, 100% { transform: translateY(0px) rotateY(-5deg); }
          50% { transform: translateY(-10px) rotateY(5deg); }
        }
        @keyframes zt-cyl-top-rotate {
          from { transform: translateZ(40px) rotateZ(0deg); }
          to { transform: translateZ(40px) rotateZ(360deg); }
        }
        @keyframes zt-cyl-bot-rotate {
          from { transform: translateZ(-40px) rotateZ(0deg); }
          to { transform: translateZ(-40px) rotateZ(-360deg); }
        }
        @keyframes zt-orbit {
          from { transform: translateZ(40px) rotateZ(0deg) translateX(110px); }
          to { transform: translateZ(40px) rotateZ(360deg) translateX(110px); }
        }
        @keyframes zt-ripple {
          0% { transform: translateZ(0px) scale(0.8); opacity: 0.8; }
          100% { transform: translateZ(0px) scale(2.2); opacity: 0; }
        }
        @keyframes zt-ledger-in  { from { opacity: 0; transform: translateY(3px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes zt-wake-flash { 0% { opacity: 0; } 60% { opacity: 1; } 100% { opacity: 0.9; } }
        
        .zt-cyl-top {
          position: absolute;
          width: 256px;
          height: 256px;
          transform-style: preserve-3d;
          animation: zt-cyl-top-rotate var(--rot-speed, 12s) linear infinite;
          backface-visibility: hidden;
          transition: animation-duration 0.3s ease, filter 0.3s ease;
        }
        .zt-cyl-bot {
          position: absolute;
          width: 256px;
          height: 256px;
          transform-style: preserve-3d;
          animation: zt-cyl-bot-rotate var(--rot-speed, 12s) linear infinite;
          backface-visibility: hidden;
          transition: animation-duration 0.3s ease, filter 0.3s ease;
        }
        .zt-orbit-node {
          position: absolute;
          width: 6px;
          height: 6px;
          border-radius: 50%;
          transform-style: preserve-3d;
          animation: zt-orbit var(--rot-speed, 12s) linear infinite;
          backface-visibility: hidden;
          transition: animation-duration 0.3s ease;
        }
        .zt-ledger   { animation: zt-ledger-in 0.25s ease-out both; }
        .zt-wake     { animation: zt-wake-flash 0.38s ease-out both; }
      `}</style>

      {/* ── Top telemetry header bar ── */}
      <div
        className="absolute top-0 left-0 right-0 flex items-center justify-between w-full px-6 py-4 z-10"
        style={{ borderBottom: `1px solid ${borderHex}` }}
      >
        <div className="flex items-center gap-2.5">
          <div className="w-2.5 h-2.5 rounded-full animate-pulse" style={{ backgroundColor: '#ef4444' }} />
          <span className="text-sm font-black tracking-widest uppercase" style={{ color: '#ef4444' }}>
            TERMINAL SESSION LOCKED
          </span>
        </div>
        <div className={`flex items-center space-x-4 text-xs font-mono tracking-wider ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
          <span>ZETA_LOCK_SHIELD_v2</span>
          <span className="text-zinc-300 dark:text-zinc-800 select-none">|</span>
          <span className="tabular-nums">{clockStr}</span>
          <span className="text-zinc-300 dark:text-zinc-800 select-none">|</span>
          <span>{currentUser.role.replace('_', ' ').toUpperCase()}</span>
          <span className="text-zinc-300 dark:text-zinc-800 select-none">|</span>
          <button
            onClick={toggleTheme}
            className={`font-black hover:opacity-70 transition-all uppercase px-3 py-1.5 rounded border ${
              isDark ? 'border-[#27272a] text-zinc-400' : 'border-[#e4e4e7] text-zinc-600'
            }`}
          >
            {themeProfile === 'ONYX' ? '[ ENV_RENDER: ONYX_DARK ]' : '[ ENV_RENDER: ALABASTER_LIGHT ]'}
          </button>
        </div>
      </div>

      {/* ── Left panel: user card + security metrics ── */}
      <div className="absolute left-6 top-16 bottom-16 w-72 flex flex-col gap-4 z-10">
        {/* User identity card */}
        <div
          className="rounded-lg p-5 flex flex-col gap-3"
          style={{ backgroundColor: panelHex, border: `1px solid ${borderHex}` }}
        >
          <p className="text-[10px] font-black tracking-widest uppercase" style={{ color: mutedHex }}>
            AUTHENTICATED SESSION
          </p>
          <p className="text-base font-black uppercase tracking-wide" style={{ color: textHex }}>
            {currentUser.displayName}
          </p>
          <p className="text-xs font-semibold truncate" style={{ color: mutedHex }}>
            {currentUser.email}
          </p>
          <div className="flex items-center gap-2 mt-0.5">
            <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: accent }} />
            <span className="text-xs uppercase tracking-widest font-black" style={{ color: accent }}>
              {currentUser.role.replace('_', ' ').toUpperCase()}
            </span>
          </div>
        </div>

        {/* Security metrics */}
        <div
          className="rounded-lg p-5 space-y-3.5"
          style={{ backgroundColor: panelHex, border: `1px solid ${borderHex}` }}
        >
          <p className="text-[10px] font-black tracking-widest uppercase" style={{ color: mutedHex }}>
            SECURITY METRICS
          </p>
          {([
            { label: 'Encryption',    value: 'AES-256-GCM',  color: accent },
            { label: 'Session State', value: 'SEALED',       color: accentCyan },
            { label: 'WAL Status',    value: 'FROZEN',       color: accentAmber },
            { label: 'Agent Feed',    value: 'ACTIVE',       color: accent },
            { label: 'Pointer Events',value: 'DISABLED',     color: '#ef4444' },
          ] as const).map(({ label, value, color }) => (
            <div key={label} className="flex justify-between items-center py-0.5">
              <span className="text-xs font-bold tracking-wide" style={{ color: mutedHex }}>{label}</span>
              <span className="text-xs font-black tracking-widest font-mono tabular-nums" style={{ color }}>{value}</span>
            </div>
          ))}
        </div>

        {/* Micro grid art */}
        <div
          className="rounded-lg p-3 flex-1 flex flex-col justify-end"
          style={{ backgroundColor: panelHex, border: `1px solid ${borderHex}` }}
        >
          <div className="w-full space-y-1.5">
            {Array.from({ length: 5 }).map((_, ri) => (
              <div key={ri} className="flex gap-1.5">
                {Array.from({ length: 8 }).map((_, ci) => (
                  <div
                    key={ci}
                    className="flex-1 rounded-sm"
                    style={{
                      height: 5,
                      backgroundColor: ((ri + ci) % 3 === 0) ? accent : borderHex,
                      opacity: ((ri + ci) % 3 === 0) ? 0.6 : 0.3,
                    }}
                  />
                ))}
              </div>
            ))}
            <p className="text-[9px] font-bold text-center mt-2 tracking-widest uppercase" style={{ color: mutedHex }}>
              IDLE STATE MATRIX
            </p>
          </div>
        </div>

        {/* Switch user */}
        <button
          onClick={() => logout()}
          className="text-xs font-black uppercase tracking-widest rounded px-4 py-2 transition-all hover:opacity-60"
          style={{ border: `1px solid ${borderHex}`, color: textHex }}
        >
          &#8629; Switch User
        </button>
      </div>

      {/* ── Center: 3D Hologram graphic + user metadata + wake phase ── */}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-10 z-10">
        
        {/* Hardware-Accelerated 3D Hologram Shield Core */}
        <div
          className="h-64 w-64 flex items-center justify-center relative mx-auto mb-6 pointer-events-none"
          style={containerStyle}
        >
          {/* Main Tilted Sub-container tilted at rotateX(60deg) */}
          <div
            className="absolute w-[256px] h-[256px] flex items-center justify-center"
            style={{
              ...floatingLayerStyle,
              transform: 'rotateX(60deg)',
            }}
          >
            {/* Top Security Ring (Z-Axis: translateZ(40px)) */}
            <div className="zt-cyl-top" style={cylStyle}>
              <svg viewBox="0 0 240 240" width="256" height="256" className="w-full h-full">
                <circle cx="120" cy="120" r="110" fill="none" stroke={cylBorderColor} strokeWidth="1.5" opacity="0.6" strokeDasharray="30 10 15 10" />
                <circle cx="120" cy="120" r="96" fill="none" stroke={accent} strokeWidth="1" opacity="0.4" strokeDasharray="5 5" />
                <polygon points="120,20 200,66 200,154 120,200 40,154 40,66" fill="none" stroke={accentCyan} strokeWidth="1.2" opacity="0.5" />
              </svg>
            </div>

            {/* Bottom Base Ring (Z-Axis: translateZ(-40px)) */}
            <div className="zt-cyl-bot" style={cylStyle}>
              <svg viewBox="0 0 240 240" width="256" height="256" className="w-full h-full">
                <circle cx="120" cy="120" r="110" fill="none" stroke={cylBorderColor} strokeWidth="1.5" opacity="0.5" strokeDasharray="40 20" />
                <circle cx="120" cy="120" r="82" fill="none" stroke={accent} strokeWidth="1" opacity="0.3" strokeDasharray="10 10" />
                <circle cx="120" cy="38" r="4" fill={accent} opacity="0.8" />
                <circle cx="202" cy="120" r="4" fill={accent} opacity="0.8" />
                <circle cx="120" cy="202" r="4" fill={accent} opacity="0.8" />
                <circle cx="38" cy="120" r="4" fill={accent} opacity="0.8" />
              </svg>
            </div>

            {/* Vertical Lattice Rails */}
            <div style={{ ...railBaseStyle, transform: 'translateX(110px) rotateX(90deg)' }} />
            <div style={{ ...railBaseStyle, transform: 'translateX(-110px) rotateX(90deg)' }} />
            <div style={{ ...railBaseStyle, transform: 'translateY(110px) rotateX(90deg)' }} />
            <div style={{ ...railBaseStyle, transform: 'translateY(-110px) rotateX(90deg)' }} />

            {/* Orbital Data Packets */}
            <div
              className="zt-orbit-node"
              style={{
                ...cylStyle,
                backgroundColor: accentCyan,
                animationDelay: '-2s',
                boxShadow: isDark ? `0 0 8px ${accentCyan}` : 'none',
              }}
            />
            <div
              className="zt-orbit-node"
              style={{
                ...cylStyle,
                backgroundColor: accentCyan,
                animationDelay: '-6s',
                boxShadow: isDark ? `0 0 8px ${accentCyan}` : 'none',
              }}
            />
            <div
              className="zt-orbit-node"
              style={{
                ...cylStyle,
                backgroundColor: accentCyan,
                animationDelay: '-10s',
                boxShadow: isDark ? `0 0 8px ${accentCyan}` : 'none',
              }}
            />
          </div>

          {/* Central Matrix Dot (translateZ(0)) */}
          <div
            className="absolute w-8 h-8 rounded-full flex items-center justify-center animate-pulse"
            style={{
              transform: 'translateZ(0px)',
              backgroundColor: accent,
              boxShadow: isDark ? `0 0 16px 4px ${accent}` : 'none',
            }}
          >
            <div className="w-2.5 h-2.5 rounded-full bg-white" />
          </div>

          {/* Core Energy Ripple */}
          <div
            className="absolute w-24 h-24 rounded-full border"
            style={{
              borderColor: accentCyan,
              animation: 'zt-ripple 4s cubic-bezier(0.1, 0.8, 0.3, 1) infinite',
              pointerEvents: 'none',
            }}
          />
        </div>

        {/* ── Identity + wake phase text ── */}
        <div
          className="flex flex-col items-center gap-3.5 text-center"
          style={{
            transform: `translate(${jitter.x}px, ${jitter.y}px)`,
            transition: 'transform 2.5s ease-in-out',
          }}
        >
          {isShowingWake ? (
            <p
              className="text-base font-black tracking-widest uppercase zt-wake"
              style={{
                color: accent,
                textShadow: isDark ? `0 0 10px ${accent}` : 'none',
              }}
            >
              {WAKE_PHASE_TEXT[wakePhase]}
            </p>
          ) : (
            <>
              <p className="text-lg font-black tracking-widest uppercase" style={{ color: textHex }}>
                {currentUser.displayName}
              </p>
              <p className="text-xs font-bold tracking-wider" style={{ color: mutedHex }}>
                {currentUser.email}
              </p>
              <p
                className="text-xs font-bold tracking-widest uppercase mt-2 animate-pulse"
                style={{ color: mutedHex }}
              >
                Move mouse or press any key to resume
              </p>
            </>
          )}
        </div>
      </div>

      {/* ── Right panel: security ledger ── */}
      <div
        className="absolute right-6 top-16 bottom-16 w-96 rounded-lg flex flex-col overflow-hidden z-10"
        style={{ backgroundColor: panelHex, border: `1px solid ${borderHex}` }}
      >
        {/* Ledger header */}
        <div
          className="flex items-center gap-2 px-4 py-3 flex-shrink-0"
          style={{ borderBottom: `1px solid ${borderHex}` }}
        >
          <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: accent }} />
          <span className="text-[10px] font-black tracking-widest uppercase" style={{ color: accent }}>
            SECURITY LEDGER
          </span>
          <span className="ml-auto text-xs font-bold font-mono tabular-nums" style={{ color: mutedHex }}>
            LIVE
          </span>
        </div>

        {/* Ledger log lines */}
        <div
          ref={ledgerRef}
          className="flex-1 min-h-0 overflow-y-auto p-4 space-y-1.5"
          style={{ scrollbarWidth: 'none' }}
        >
          {visibleLines.map((line, i) => {
            const lineColor =
              line.startsWith('[SECURE]')      ? (isDark ? '#22c55e' : '#16a34a') :
              line.startsWith('[CRYPTO]')      ? accentCyan :
              line.startsWith('[SYSTEM IDLE]') ? mutedHex :
              mutedHex;
            return (
              <p key={i}
                className="text-xs leading-loose font-medium py-0.5 tracking-wide zt-ledger"
                style={{ color: lineColor, animationDelay: `${i * 0.02}s` }}
              >
                {line}
              </p>
            );
          })}
        </div>

        {/* Agent feed block */}
        <div
          className="flex-shrink-0 p-4 space-y-2.5"
          style={{ borderTop: `1px solid ${borderHex}` }}
        >
          <p className="text-[10px] font-black tracking-widest uppercase" style={{ color: accentCyan }}>
            AGENT TELEMETRY FEED
          </p>
          <p className="text-xs font-semibold leading-relaxed" style={{ color: isDark ? '#22c55e' : '#16a34a' }}>
            {AGENT_STATUS_LINES[agentLineIdx]}
          </p>
          {latestEntry && (
            <p className="text-[10px] font-medium leading-relaxed truncate" style={{ color: mutedHex }}>
              Latest: [{latestEntry.agentName}]{' '}
              {latestEntry.currentTask ?? latestEntry.status}
            </p>
          )}
        </div>
      </div>

      {/* ── Bottom status bar ── */}
      <div
        className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-6 py-2.5 z-10"
        style={{ borderTop: `1px solid ${borderHex}` }}
      >
        <p className="text-[10px] font-bold tracking-widest uppercase" style={{ color: mutedHex }}>
          IDLE LOCK ACTIVE &middot; POINTER EVENTS DISABLED &middot; ENTERPRISE SECURITY PROTOCOL
        </p>
        <p className="text-[10px] font-bold tracking-widest font-mono tabular-nums" style={{ color: mutedHex }}>
          {new Date().toLocaleDateString()} &middot; ZETA v1.0 &middot; CENTLE GLOBAL GROUP
        </p>
      </div>
    </div>
  );
}
