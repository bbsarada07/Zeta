import { useState, useEffect } from 'react';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import TerminalLockscreen from './components/TerminalLockscreen';
import { useZetaStore } from './store/zetaStore';
import { initializeDatabase, loadDossiers } from './db/dbManager';


export const AuthStage = {
  UNAUTHENTICATED: 'UNAUTHENTICATED',
  INITIALIZING_HANDSHAKE: 'INITIALIZING_HANDSHAKE',
  SECURE_ISOLATION_LOAD: 'SECURE_ISOLATION_LOAD',
  AUTHENTICATED: 'AUTHENTICATED'
} as const;

export type AuthStageType = typeof AuthStage[keyof typeof AuthStage];

// Brand color maps for the isolation loader view matching form accents
const BRAND_HEX_COLORS: Record<string, string> = {
  emerald: '#22c55e',
  blue: '#3b82f6',
  amber: '#f59e0b',
  purple: '#a855f7',
  rose: '#ef4444',
  white: '#ffffff',
  default: '#27272a'
};

const getBrandColorFromEmail = (emailStr: string): string => {
  const emailLower = emailStr.toLowerCase().trim();
  if (emailLower.endsWith('@skilltank.com')) return BRAND_HEX_COLORS.emerald;
  if (emailLower.endsWith('@vriddhi.com')) return BRAND_HEX_COLORS.blue;
  if (emailLower.endsWith('@tobofu.com')) return BRAND_HEX_COLORS.amber;
  if (emailLower.endsWith('@promtal.com')) return BRAND_HEX_COLORS.purple;
  if (emailLower.endsWith('@maceco.com')) return BRAND_HEX_COLORS.rose;
  if (emailLower === 'admin@centle.com') return BRAND_HEX_COLORS.white;
  return BRAND_HEX_COLORS.default;
};

const getBrandTextClass = (emailStr: string): string => {
  const emailLower = emailStr.toLowerCase().trim();
  if (emailLower.endsWith('@skilltank.com')) return 'text-[#22c55e]';
  if (emailLower.endsWith('@vriddhi.com')) return 'text-[#3b82f6]';
  if (emailLower.endsWith('@tobofu.com')) return 'text-[#f59e0b]';
  if (emailLower.endsWith('@promtal.com')) return 'text-[#a855f7]';
  if (emailLower.endsWith('@maceco.com')) return 'text-[#ef4444]';
  return 'text-white';
};

export default function App() {
  const currentUser = useZetaStore((s) => s.currentUser);
  const loginFn = useZetaStore((s) => s.login);
  const addThoughtLedgerEntry = useZetaStore((s) => s.addThoughtLedgerEntry);
  const themeProfile = useZetaStore((s) => s.themeProfile);
  const sessionLocked = useZetaStore((s) => s.sessionLocked);

  // Hook to synchronize root HTML/body theme classes with themeProfile state
  useEffect(() => {
    if (typeof document !== 'undefined') {
      const root = document.documentElement;
      const body = document.body;
      if (themeProfile === 'ALABASTER') {
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
  }, [themeProfile]);

  const [authStage, setAuthStage] = useState<AuthStageType>('UNAUTHENTICATED');
  const [activeCredentials, setActiveCredentials] = useState<{ email: string; pass: string } | null>(null);

  // Status telemetry subtext logs
  const [telemetryText, setTelemetryText] = useState('');

  // Boot the AES-GCM encrypted DB engine once on mount.
  // Decrypts the sealed localStorage blob (or runs cold-start seed).
  // After resolution, patch the Zustand store with the fully hydrated dossiers.
  useEffect(() => {
    initializeDatabase().then(() => {
      const dossiers = loadDossiers();
      useZetaStore.setState((state) => ({ ...state, internDossiers: dossiers }));
    }).catch(console.error);
  }, []);


  // Handle synchronization of store logout -> snaps back to UNAUTHENTICATED
  useEffect(() => {
    if (!currentUser) {
      setAuthStage('UNAUTHENTICATED');
      setActiveCredentials(null);
    }
  }, [currentUser]);

  // Handle staggered clearance subtext during isolation screen load
  useEffect(() => {
    if (authStage === 'SECURE_ISOLATION_LOAD') {
      setTelemetryText('[SECURITY STATUS: CLEARANCE VERIFIED]');
      
      const t1 = setTimeout(() => {
        setTelemetryText('[INJECTING WORKSPACE MODULES...]');
      }, 600);
      
      const t2 = setTimeout(() => {
        setTelemetryText('[SYNCHRONIZING CENTRAL STATE ENGINE...]');
      }, 1200);

      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
      };
    }
  }, [authStage]);

  const handleHandshakeStart = () => {
    setAuthStage('INITIALIZING_HANDSHAKE');
  };

  const handleHandshakeComplete = (email: string, pass: string) => {
    setActiveCredentials({ email, pass });
    setAuthStage('SECURE_ISOLATION_LOAD');

    // Hold screen for exactly 2.0 seconds cinematic clearance depth
    setTimeout(async () => {
      const isSuccess = await loginFn(email, pass);
      if (isSuccess) {
        setAuthStage('AUTHENTICATED');
      } else {
        setAuthStage('UNAUTHENTICATED');
      }
    }, 2000);
  };

  const handleSecurityAlert = (email: string) => {
    // Log security failure alerts to store thought ledger
    addThoughtLedgerEntry({
      agentName: 'SecurityAlert',
      status: 'action_executed',
      thoughtProcess: `[SECURITY_ALERT] Authentication failure vector identified. Unauthorized access attempt for user context: ${email}.`
    });
  };

  const currentBrandColor = activeCredentials ? getBrandColorFromEmail(activeCredentials.email) : '#27272a';
  const currentBrandTextClass = activeCredentials ? getBrandTextClass(activeCredentials.email) : 'text-zinc-500';

  // Inactivity telemetry & anti-tamper lockout detection
  const [isTerminalIdle, setIsTerminalIdle] = useState(false);
  const lockSession = useZetaStore((s) => s.lockSession);

  useEffect(() => {
    if (!sessionLocked) {
      setIsTerminalIdle(false);
    }
  }, [sessionLocked]);

  useEffect(() => {
    if (authStage !== 'AUTHENTICATED') return;

    let timerId: ReturnType<typeof setTimeout>;

    const resetTimer = () => {
      if (sessionLocked || isTerminalIdle) return;
      clearTimeout(timerId);
      
      // Hardcoded explicit 10-second conditional shortcut trigger for testing (normally 300,000ms / 5 minutes)
      const IDLE_TIMEOUT_MS = 10000;

      timerId = setTimeout(() => {
        setIsTerminalIdle(true);
        lockSession();
      }, IDLE_TIMEOUT_MS);
    };

    const handleUserActivity = () => {
      resetTimer();
    };

    window.addEventListener('mousemove', handleUserActivity, { passive: true });
    window.addEventListener('mousedown', handleUserActivity, { passive: true });
    window.addEventListener('keydown', handleUserActivity, { passive: true });
    window.addEventListener('touchstart', handleUserActivity, { passive: true });

    resetTimer();

    return () => {
      clearTimeout(timerId);
      window.removeEventListener('mousemove', handleUserActivity);
      window.removeEventListener('mousedown', handleUserActivity);
      window.removeEventListener('keydown', handleUserActivity);
      window.removeEventListener('touchstart', handleUserActivity);
    };
  }, [authStage, sessionLocked, isTerminalIdle, lockSession]);

  const isLockedOrIdle = sessionLocked || isTerminalIdle;

  return (
    <div className="relative w-screen h-screen bg-black overflow-hidden select-none">
      
      {/* Stage: Authenticated Dashboard */}
      {authStage === 'AUTHENTICATED' && (
        <div
          className={`h-full w-full transition-all duration-300 ${
            isLockedOrIdle ? 'pointer-events-none select-none filter blur-md opacity-30' : ''
          }`}
          onKeyDownCapture={(e) => {
            if (isLockedOrIdle) {
              e.preventDefault();
              e.stopPropagation();
            }
          }}
          onClickCapture={(e) => {
            if (isLockedOrIdle) {
              e.preventDefault();
              e.stopPropagation();
            }
          }}
          onMouseDownCapture={(e) => {
            if (isLockedOrIdle) {
              e.preventDefault();
              e.stopPropagation();
            }
          }}
        >
          <Dashboard />
        </div>
      )}

      {/* Stage: Session Locked Screen */}
      {isLockedOrIdle && authStage === 'AUTHENTICATED' && <TerminalLockscreen />}

      {/* Stage: Unauthenticated / Handshake Connection */}
      {(authStage === 'UNAUTHENTICATED' || authStage === 'INITIALIZING_HANDSHAKE') && (
        <Login
          onHandshakeStart={handleHandshakeStart}
          onHandshakeComplete={handleHandshakeComplete}
          onSecurityAlert={handleSecurityAlert}
        />
      )}

      {/* Stage: Cinematic Counter-Rotating status loader curtain overlay */}
      {authStage === 'SECURE_ISOLATION_LOAD' && (
        <div className="fixed inset-0 z-50 flex flex-col justify-center items-center bg-[#000000] font-mono transition-opacity duration-500">
          
          <div className="relative w-48 h-48 flex justify-center items-center mb-10">
            
            {/* SVG concentric status ring gauge counter rotation */}
            <svg className="w-full h-full" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
              {/* Outer ring clockwise */}
              <circle
                cx="50"
                cy="50"
                r="42"
                fill="none"
                stroke={currentBrandColor}
                strokeWidth="2"
                strokeDasharray="45 15 25 15"
                className="animate-spin-clockwise"
                style={{ transformOrigin: 'center' }}
              />
              {/* Inner ring counter-clockwise */}
              <circle
                cx="50"
                cy="50"
                r="32"
                fill="none"
                stroke={currentBrandColor}
                strokeWidth="1.2"
                strokeDasharray="15 10 30 10"
                className="animate-spin-counter-clockwise"
                style={{ transformOrigin: 'center' }}
              />
              {/* Central node center */}
              <circle
                cx="50"
                cy="50"
                r="5"
                fill={currentBrandColor}
                opacity={0.8}
                style={{ filter: `drop-shadow(0 0 6px ${currentBrandColor})` }}
              />
            </svg>
            
            {/* Central lock display */}
            <div className="absolute text-[8px] font-bold tracking-widest uppercase" style={{ color: currentBrandColor }}>
              Z-LOCK
            </div>
          </div>

          {/* Staggered clearance subtext */}
          <div className={`text-[10px] font-bold tracking-wider font-mono h-4 min-w-[280px] text-center ${currentBrandTextClass}`}>
            {telemetryText}
          </div>
          <div className="text-[8px] text-zinc-500 mt-2 tracking-widest uppercase">
            ESTABLISHING ENCRYPTED SESSION ISOLATION
          </div>
        </div>
      )}

      {/* Inline styles for custom concentric animations */}
      <style>{`
        @keyframes spinClockwise {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes spinCounterClockwise {
          from { transform: rotate(0deg); }
          to { transform: rotate(-360deg); }
        }
        .animate-spin-clockwise {
          animation: spinClockwise 4.5s linear infinite;
        }
        .animate-spin-counter-clockwise {
          animation: spinCounterClockwise 3s linear infinite;
        }
      `}</style>
    </div>
  );
}
