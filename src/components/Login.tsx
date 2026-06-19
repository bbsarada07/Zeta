import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Mail, Lock, AlertCircle } from 'lucide-react';

// Preset credentials for the QuickAccess panel
const DEMO_ACCOUNTS = [
  { label: 'Admin', email: 'admin@centle.com', pass: 'Zeta_Admin_2026!', color: 'border-zinc-800 text-zinc-300 hover:border-zinc-500' },
  { label: 'Skill Tank', email: 'rep@skilltank.com', pass: 'SkillTank_Zeta_2026', color: 'border-emerald-950 text-emerald-400 hover:border-emerald-500' },
  { label: 'Vriddhi', email: 'rep@vriddhi.com', pass: 'Vriddhi_Zeta_2026', color: 'border-blue-950 text-blue-400 hover:border-blue-500' },
  { label: 'Tobofu', email: 'rep@tobofu.com', pass: 'Tobofu_Zeta_2026', color: 'border-amber-950 text-amber-400 hover:border-amber-500' },
  { label: 'Promtal', email: 'rep@promtal.com', pass: 'Promtal_Zeta_2026', color: 'border-purple-950 text-purple-400 hover:border-purple-500' },
  { label: 'Maceco', email: 'rep@maceco.com', pass: 'Maceco_Zeta_2026', color: 'border-red-950 text-red-400 hover:border-red-500' }
];

// Accent color palettes for total interface color shifting
interface BrandPalette {
  accent: string;
  text: string;
  border: string;
  borderGlow: string;
  badgeBg: string;
  textGlow: string;
  svgGlow: string;
  bg: string;
}

const BRAND_COLORS: Record<string, BrandPalette> = {
  emerald: {
    accent: '#22c55e',
    text: 'text-[#22c55e]',
    border: 'border-[#22c55e]/40',
    borderGlow: 'focus:border-[#22c55e] focus:shadow-[0_0_15px_rgba(34,197,94,0.25)]',
    badgeBg: 'bg-emerald-950/20 border-emerald-900/40 text-[#22c55e]',
    textGlow: 'shadow-[#22c55e]/20',
    svgGlow: 'rgba(34,197,94,0.4)',
    bg: 'bg-[#22c55e]'
  },
  blue: {
    accent: '#3b82f6',
    text: 'text-[#3b82f6]',
    border: 'border-[#3b82f6]/40',
    borderGlow: 'focus:border-[#3b82f6] focus:shadow-[0_0_15px_rgba(59,130,246,0.25)]',
    badgeBg: 'bg-blue-950/20 border-blue-900/40 text-[#3b82f6]',
    textGlow: 'shadow-[#3b82f6]/20',
    svgGlow: 'rgba(59,130,246,0.4)',
    bg: 'bg-[#3b82f6]'
  },
  amber: {
    accent: '#f59e0b',
    text: 'text-[#f59e0b]',
    border: 'border-[#f59e0b]/40',
    borderGlow: 'focus:border-[#f59e0b] focus:shadow-[0_0_15px_rgba(245,158,11,0.25)]',
    badgeBg: 'bg-amber-950/20 border-amber-900/40 text-[#f59e0b]',
    textGlow: 'shadow-[#f59e0b]/20',
    svgGlow: 'rgba(245,158,11,0.4)',
    bg: 'bg-[#f59e0b]'
  },
  purple: {
    accent: '#a855f7',
    text: 'text-[#a855f7]',
    border: 'border-[#a855f7]/40',
    borderGlow: 'focus:border-[#a855f7] focus:shadow-[0_0_15px_rgba(168,85,247,0.25)]',
    badgeBg: 'bg-purple-950/20 border-purple-900/40 text-[#a855f7]',
    textGlow: 'shadow-[#a855f7]/20',
    svgGlow: 'rgba(168,85,247,0.4)',
    bg: 'bg-[#a855f7]'
  },
  rose: {
    accent: '#ef4444',
    text: 'text-[#ef4444]',
    border: 'border-[#ef4444]/40',
    borderGlow: 'focus:border-[#ef4444] focus:shadow-[0_0_15px_rgba(239,68,68,0.25)]',
    badgeBg: 'bg-red-950/20 border-red-900/40 text-[#ef4444]',
    textGlow: 'shadow-[#ef4444]/20',
    svgGlow: 'rgba(239,68,68,0.4)',
    bg: 'bg-[#ef4444]'
  },
  white: {
    accent: '#ffffff',
    text: 'text-zinc-100',
    border: 'border-zinc-700',
    borderGlow: 'focus:border-zinc-100 focus:shadow-[0_0_15px_rgba(255,255,255,0.2)]',
    badgeBg: 'bg-zinc-900/40 border-zinc-800 text-zinc-100',
    textGlow: 'shadow-white/10',
    svgGlow: 'rgba(255,255,255,0.4)',
    bg: 'bg-white'
  },
  default: {
    accent: '#27272a',
    text: 'text-zinc-500',
    border: 'border-zinc-800',
    borderGlow: 'focus:border-zinc-500 focus:shadow-[0_0_15px_rgba(113,113,122,0.15)]',
    badgeBg: 'bg-zinc-950 border-zinc-800 text-zinc-500',
    textGlow: 'shadow-transparent',
    svgGlow: 'rgba(39,39,42,0.2)',
    bg: 'bg-zinc-800'
  }
};

interface Node3D {
  id: string;
  label: string;
  x: number;
  y: number;
  z: number;
  r: number;
  type: string;
  targetRole?: string;
  email?: string;
}

const BASE_NODES: Node3D[] = [
  { id: 'orchestrator', label: 'Identity Hub', x: 0, y: 0, z: 0, r: 16, type: 'core' },
  { id: 'sales', label: 'SalesAgent', x: -110, y: -90, z: -40, r: 10, type: 'agent', targetRole: 'rep@skilltank.com' },
  { id: 'ops', label: 'OpsAgent', x: 110, y: -90, z: -40, r: 10, type: 'agent', targetRole: 'rep@vriddhi.com' },
  { id: 'strategy', label: 'StrategyAgent', x: 0, y: 135, z: -60, r: 10, type: 'agent', targetRole: 'global' },
  { id: 't_st', label: 'Skill Tank Systems', x: -160, y: 30, z: 70, r: 8, type: 'tenant', email: 'rep@skilltank.com' },
  { id: 't_v', label: 'Vriddhi Logistics', x: 160, y: 30, z: 70, r: 8, type: 'tenant', email: 'rep@vriddhi.com' },
  { id: 't_t', label: 'Tobofu Agri Group', x: -70, y: -160, z: 30, r: 8, type: 'tenant', email: 'rep@tobofu.com' },
  { id: 't_p', label: 'Promtal Media', x: 70, y: -160, z: 30, r: 8, type: 'tenant', email: 'rep@promtal.com' },
  { id: 't_m', label: 'Maceco Heavy Ind.', x: 110, y: 90, z: -90, r: 8, type: 'tenant', email: 'rep@maceco.com' },
  { id: 't_admin', label: 'Centle Master', x: -110, y: 90, z: -90, r: 8, type: 'tenant', email: 'admin@centle.com' }
];

const BASE_PATHS = [
  { id: 'path_st', from: 't_st', to: 'orchestrator' },
  { id: 'path_v', from: 't_v', to: 'orchestrator' },
  { id: 'path_t', from: 't_t', to: 'orchestrator' },
  { id: 'path_p', from: 't_p', to: 'orchestrator' },
  { id: 'path_m', from: 't_m', to: 'orchestrator' },
  { id: 'path_admin', from: 't_admin', to: 'orchestrator' },
  { id: 'path_sales', from: 'orchestrator', to: 'sales' },
  { id: 'path_ops', from: 'orchestrator', to: 'ops' },
  { id: 'path_strategy', from: 'orchestrator', to: 'strategy' }
];

const project = (node: Node3D, theta: number, phi: number, width: number, height: number) => {
  const cosT = Math.cos(theta);
  const sinT = Math.sin(theta);
  const cosP = Math.cos(phi);
  const sinP = Math.sin(phi);

  const x1 = node.x * cosT - node.z * sinT;
  const z1 = node.x * sinT + node.z * cosT;
  const y1 = node.y;

  const x2 = x1;
  const y2 = y1 * cosP - z1 * sinP;
  const z2 = y1 * sinP + z1 * cosP;

  const d = 350;
  const factor = d / (d + z2);

  const screenX = width / 2 + x2 * factor;
  const screenY = height / 2 + y2 * factor;

  return {
    ...node,
    screenX,
    screenY,
    z2,
    factor,
    renderedR: node.r * Math.max(0.4, Math.min(1.8, factor)),
    opacity: 0.15 + 0.85 * ((200 - z2) / 400)
  };
};

interface LoginProps {
  onHandshakeStart: () => void;
  onHandshakeComplete: (email: string, pass: string) => void;
  onSecurityAlert: (email: string) => void;
}

export default function Login({ onHandshakeStart, onHandshakeComplete, onSecurityAlert }: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Connection process variables
  const [authState, setAuthState] = useState<'idle' | 'running'>('idle');
  const [consoleLogs, setConsoleLogs] = useState<string[]>([]);
  const [isTraversing, setIsTraversing] = useState(false);

  // Monospace title scramble text
  const [headerText, setHeaderText] = useState('ZETA SYSTEMS // SECURE GATEWAY');

  // Interactive Node Hover tracking
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  // Focus state for email input
  const [isEmailFocused, setIsEmailFocused] = useState(false);

  // Orbital drift angles for 3D layout
  const [angles, setAngles] = useState({ theta: 0, phi: 0 });

  // Cryptographic subtitle state
  const [cryptoSub, setCryptoSub] = useState('CU8D@A RRON6Z // 8B#4#W L4F9&XE');
  const cryptoAnimFrame = useRef<number | null>(null);
  const mountAnimated = useRef(false);

  // List of active typing pulse nodes
  const [pulses, setPulses] = useState<{ id: string; pathId: string; key: number }[]>([]);

  // Fetch brand context dynamically based on email
  const tenantName = useMemo(() => {
    const emailLower = email.toLowerCase().trim();
    if (emailLower.endsWith('@skilltank.com')) return 'Skill Tank Systems';
    if (emailLower.endsWith('@vriddhi.com')) return 'Vriddhi Logistics';
    if (emailLower.endsWith('@tobofu.com')) return 'Tobofu Agri Group';
    if (emailLower.endsWith('@promtal.com')) return 'Promtal Media';
    if (emailLower.endsWith('@maceco.com')) return 'Maceco Heavy Ind.';
    if (emailLower === 'admin@centle.com') return 'Centle Master';
    return null;
  }, [email]);

  const brandTheme = useMemo(() => {
    const emailLower = email.toLowerCase().trim();
    if (emailLower.endsWith('@skilltank.com')) return BRAND_COLORS.emerald;
    if (emailLower.endsWith('@vriddhi.com')) return BRAND_COLORS.blue;
    if (emailLower.endsWith('@tobofu.com')) return BRAND_COLORS.amber;
    if (emailLower.endsWith('@promtal.com')) return BRAND_COLORS.purple;
    if (emailLower.endsWith('@maceco.com')) return BRAND_COLORS.rose;
    if (emailLower === 'admin@centle.com') return BRAND_COLORS.white;
    return BRAND_COLORS.default;
  }, [email]);

  // Handle scientific heading scramble animation on context transition (exactly 400ms)
  useEffect(() => {
    const targetText = tenantName
      ? `${tenantName.toUpperCase()} // SECURE GATEWAY`
      : 'ZETA SYSTEMS // SECURE GATEWAY';

    let isMounted = true;
    const startTime = Date.now();
    const duration = 400; // Scramble runs for exactly 400ms
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&@+=$';

    const scramble = () => {
      const elapsed = Date.now() - startTime;
      if (elapsed >= duration) {
        if (isMounted) setHeaderText(targetText);
        return;
      }

      const progress = elapsed / duration;
      const scrambled = targetText
        .split('')
        .map((char, index) => {
          if (char === ' ' || char === '/') return char;
          if (index / targetText.length < progress) return targetText[index];
          return chars[Math.floor(Math.random() * chars.length)];
        })
        .join('');

      if (isMounted) {
        setHeaderText(scrambled);
        requestAnimationFrame(scramble);
      }
    };

    requestAnimationFrame(scramble);

    return () => {
      isMounted = false;
    };
  }, [tenantName]);

  // Idle ambient orbital drift loop (requestAnimationFrame)
  useEffect(() => {
    let animId: number;
    const startTime = Date.now();
    const animate = () => {
      const elapsed = (Date.now() - startTime) / 1000;
      const theta = elapsed * 0.12;
      const phi = Math.sin(elapsed * 0.2) * 0.15;
      setAngles({ theta, phi });
      animId = requestAnimationFrame(animate);
    };
    animId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animId);
  }, []);

  // Real-time keystroke listeners to trigger traveling particles along paths
  const lastLengths = useRef({ email: 0, password: 0 });

  useEffect(() => {
    const prevEmail = lastLengths.current.email;
    const prevPass = lastLengths.current.password;
    const currEmail = email.length;
    const currPass = password.length;
    lastLengths.current = { email: currEmail, password: currPass };

    if (currEmail !== prevEmail || currPass !== prevPass) {
      const perimeterPaths = ['path_st', 'path_v', 'path_t', 'path_p', 'path_m', 'path_admin'];
      const newPulses = perimeterPaths.map(pathId => ({
        id: `${pathId}-${Date.now()}-${Math.random()}`,
        pathId,
        key: Math.random()
      }));

      setPulses(prev => [...prev, ...newPulses].slice(-30));

      const timer = setTimeout(() => {
        const pulseIds = newPulses.map(p => p.id);
        setPulses(prev => prev.filter(p => !pulseIds.includes(p.id)));
      }, 600);

      return () => clearTimeout(timer);
    }
  }, [email, password]);

  // Initial mount text scrambling and letter-by-letter resolution
  useEffect(() => {
    if (mountAnimated.current) return;
    mountAnimated.current = true;

    const startTime = Date.now();
    const scrambleDuration = 1800;
    const targetText = "SECURE COGNITIVE GATEWAY // SYSTEM ACTIVE";
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&@+=$';

    const tick = () => {
      const elapsed = Date.now() - startTime;

      if (elapsed < scrambleDuration) {
        const scrambled = targetText.split('').map(char => {
          if (char === ' ' || char === '/') return char;
          return chars[Math.floor(Math.random() * chars.length)];
        }).join('');
        setCryptoSub(scrambled);
        cryptoAnimFrame.current = requestAnimationFrame(tick);
      } else {
        const resolveElapsed = elapsed - scrambleDuration;
        const resolveDuration = 800;
        const progress = Math.min(1, resolveElapsed / resolveDuration);
        const charsResolved = Math.floor(progress * targetText.length);

        const currentText = targetText.split('').map((char, idx) => {
          if (idx < charsResolved) return char;
          if (char === ' ' || char === '/') return char;
          return chars[Math.floor(Math.random() * chars.length)];
        }).join('');

        setCryptoSub(currentText);

        if (progress < 1) {
          cryptoAnimFrame.current = requestAnimationFrame(tick);
        } else {
          setCryptoSub(targetText);
          cryptoAnimFrame.current = null;
        }
      }
    };

    cryptoAnimFrame.current = requestAnimationFrame(tick);

    return () => {
      mountAnimated.current = false;
      if (cryptoAnimFrame.current !== null) {
        cancelAnimationFrame(cryptoAnimFrame.current);
      }
    };
  }, []);

  // Quick-access micro-glitch sequence (600ms)
  const triggerGlitch = () => {
    if (cryptoAnimFrame.current !== null) {
      cancelAnimationFrame(cryptoAnimFrame.current);
    }

    const startTime = Date.now();
    const glitchDuration = 600;
    const targetText = "SECURE COGNITIVE GATEWAY // SYSTEM ACTIVE";
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&@+=$';

    const tick = () => {
      const elapsed = Date.now() - startTime;
      if (elapsed < glitchDuration) {
        const currentText = targetText.split('').map(char => {
          if (char === ' ' || char === '/') return char;
          return Math.random() < 0.4 
            ? chars[Math.floor(Math.random() * chars.length)] 
            : char;
        }).join('');
        setCryptoSub(currentText);
        cryptoAnimFrame.current = requestAnimationFrame(tick);
      } else {
        setCryptoSub(targetText);
        cryptoAnimFrame.current = null;
      }
    };
    cryptoAnimFrame.current = requestAnimationFrame(tick);
  };

  // Projected SVG positions based on angles
  const projectedNodes = useMemo(() => {
    return BASE_NODES.map(node => project(node, angles.theta, angles.phi, 600, 600));
  }, [angles]);

  const nodesMap = useMemo(() => {
    const map: Record<string, typeof projectedNodes[0]> = {};
    projectedNodes.forEach(n => {
      map[n.id] = n;
    });
    return map;
  }, [projectedNodes]);

  const sortedNodes = useMemo(() => {
    return [...projectedNodes].sort((a, b) => b.z2 - a.z2);
  }, [projectedNodes]);

  const getPathD = (path: typeof BASE_PATHS[0]) => {
    const fromNode = nodesMap[path.from];
    const toNode = nodesMap[path.to];
    if (!fromNode || !toNode) return '';
    return `M ${fromNode.screenX.toFixed(1)},${fromNode.screenY.toFixed(1)} L ${toNode.screenX.toFixed(1)},${toNode.screenY.toFixed(1)}`;
  };

  // Determine active vector nodes depending on context
  const activeElements = useMemo(() => {
    const active: Record<string, boolean> = {};
    if (!email) return active;

    const emailLower = email.toLowerCase().trim();
    active['orchestrator'] = true;
    active['strategy'] = true; // Strategy runs globally

    if (emailLower.endsWith('@skilltank.com')) {
      active['t_st'] = true;
      active['path_st'] = true;
      active['sales'] = true;
      active['path_sales'] = true;
    } else if (emailLower.endsWith('@vriddhi.com')) {
      active['t_v'] = true;
      active['path_v'] = true;
      active['ops'] = true;
      active['path_ops'] = true;
    } else if (emailLower.endsWith('@tobofu.com')) {
      active['t_t'] = true;
      active['path_t'] = true;
    } else if (emailLower.endsWith('@promtal.com')) {
      active['t_p'] = true;
      active['path_p'] = true;
    } else if (emailLower.endsWith('@maceco.com')) {
      active['t_m'] = true;
      active['path_m'] = true;
    } else if (emailLower === 'admin@centle.com') {
      active['t_admin'] = true;
      active['path_admin'] = true;
      active['sales'] = true;
      active['ops'] = true;
      active['path_sales'] = true;
      active['path_ops'] = true;
      active['path_strategy'] = true;
    }

    return active;
  }, [email]);

  // Autofill keyboard typing animation
  const handleAutofill = (targetEmail: string, targetPass: string) => {
    if (isTyping || authState !== 'idle') return;
    setErrorMsg(null);
    setIsTyping(true);
    setIsTraversing(true);

    triggerGlitch();

    let eIdx = 0;
    let pIdx = 0;

    setEmail('');
    setPassword('');

    const emailInterval = setInterval(() => {
      if (eIdx < targetEmail.length) {
        setEmail(targetEmail.substring(0, eIdx + 1));
        eIdx++;
      } else {
        clearInterval(emailInterval);
        const passInterval = setInterval(() => {
          if (pIdx < targetPass.length) {
            setPassword(targetPass.substring(0, pIdx + 1));
            pIdx++;
          } else {
            clearInterval(passInterval);
            setIsTyping(false);
            setTimeout(() => setIsTraversing(false), 900);
          }
        }, 20);
      }
    }, 15);
  };

  // Submit establishing connection
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isTyping || authState !== 'idle') return;
    setErrorMsg(null);

    // Hardcoded credentials match
    const creds: Record<string, string> = {
      'admin@centle.com': 'Zeta_Admin_2026!',
      'rep@skilltank.com': 'SkillTank_Zeta_2026',
      'rep@vriddhi.com': 'Vriddhi_Zeta_2026',
      'rep@tobofu.com': 'Tobofu_Zeta_2026',
      'rep@promtal.com': 'Promtal_Zeta_2026',
      'rep@maceco.com': 'Maceco_Zeta_2026'
    };

    const currentEmail = email.toLowerCase().trim();
    const correctPass = creds[currentEmail];

    if (!correctPass || correctPass !== password) {
      setErrorMsg('[SECURITY_ALERT] Invalid security parameters. Access Denied.');
      onSecurityAlert(email);
      return;
    }

    // Handshake logs connection sequence
    setAuthState('running');
    setIsTraversing(true);
    onHandshakeStart();

    setConsoleLogs(['> INITIALIZING SECURE SSH TUNNEL (RSA-4096)...']);

    const logs = [
      { t: 250, msg: '> INITIALIZING SECURE SSH TUNNEL (RSA-4096)... [OK]' },
      { t: 500, msg: '> EXCHANGING DIFFIE-HELLMAN CRYPTOGRAPHIC KEYS... [OK]' },
      { t: 750, msg: `> BROADCASTING IDENTITY MATCH FOR USER: ${currentEmail.toUpperCase()}... [OK]` },
      { t: 1000, msg: `> ESTABLISHING MULTI-TENANT CONTEXT LOCK: ${(tenantName || 'Global Centle').toUpperCase()}... [OK]` },
      { t: 1250, msg: '> NODE HANDSHAKE COMPLETE. REDIRECTING SECURE CONSOLE MASTER PORT...' }
    ];

    logs.forEach((item) => {
      setTimeout(() => {
        setConsoleLogs((prev) => [...prev, item.msg]);
      }, item.t);
    });

    setTimeout(() => {
      setIsTraversing(false);
      onHandshakeComplete(email, password);
    }, 1500);
  };

  return (
    <div className="relative flex h-screen w-screen bg-black overflow-hidden font-sans select-none">
      
      {/* Background canvas subtle dot matrix grid overlay */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-20 z-0" 
        style={{
          backgroundImage: 'radial-gradient(#27272a 1px, transparent 1px)',
          backgroundSize: '20px 20px'
        }}
      />

      {/* Left Panel: SVG network topology representation (60% Width) */}
      <div className="relative z-10 w-[60vw] h-full hidden md:flex flex-col justify-center items-center bg-black p-8">
        <div className="w-[520px] h-[520px] relative">
          <svg className="w-full h-full" viewBox="0 0 600 600" xmlns="http://www.w3.org/2000/svg" style={{ willChange: 'transform' }}>
            <defs>
              <filter id="node-blur" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="2" />
              </filter>
            </defs>
            
            {/* Background connection pipelines */}
            {BASE_PATHS.map((path) => {
              const isHovered = hoveredNode && (path.from === hoveredNode || path.to === hoveredNode);
              const isActive = activeElements[path.id];
              const d = getPathD(path);
              return (
                <path
                  id={path.id}
                  key={path.id}
                  d={d}
                  fill="none"
                  stroke={isHovered || isActive ? brandTheme.accent : '#18181b'}
                  strokeWidth={isHovered || isActive ? 2.5 : 1}
                  className="transition-colors duration-300"
                  style={{
                    filter: (isHovered || isActive) ? `drop-shadow(0 0 5px ${brandTheme.accent})` : 'none',
                    willChange: 'transform, opacity'
                  }}
                />
              );
            })}

            {/* Glowing active streaming flow path */}
            {BASE_PATHS.map((path) => {
              const isActive = activeElements[path.id];
              const d = getPathD(path);
              return (
                <path
                  key={`flow-${path.id}`}
                  d={d}
                  fill="none"
                  stroke={brandTheme.accent}
                  strokeWidth={1.5}
                  opacity={isActive ? 0.45 : 0.05}
                  className="transition-all duration-500"
                  strokeDasharray="6 14"
                  style={{
                    animation: 'pathFlowAnimation 2s linear infinite',
                    filter: `drop-shadow(0 0 3px ${brandTheme.accent})`,
                    willChange: 'transform, opacity'
                  }}
                />
              );
            })}

            {/* High-speed Quantum Node Traversal light streams */}
            {isTraversing && (
              <>
                {BASE_PATHS.map((path) => {
                  const isActive = activeElements[path.id];
                  if (!isActive) return null;
                  return (
                    <circle 
                      key={`traverse-${path.id}`} 
                      r="4" 
                      fill={brandTheme.accent} 
                      style={{ 
                        filter: `drop-shadow(0 0 8px ${brandTheme.accent})`,
                        willChange: 'transform, opacity'
                      }}
                    >
                      <animateMotion dur="0.6s" repeatCount="indefinite">
                        <mpath href={`#${path.id}`} />
                      </animateMotion>
                    </circle>
                  );
                })}
              </>
            )}

            {/* Traveling particle pulses from typing keystrokes */}
            {pulses.map((pulse) => (
              <circle
                key={pulse.id}
                r="3.5"
                fill={brandTheme.accent}
                style={{
                  filter: `drop-shadow(0 0 6px ${brandTheme.accent})`,
                  willChange: 'transform, opacity'
                }}
              >
                <animateMotion dur="0.6s" repeatCount="1" fill="remove">
                  <mpath href={`#${pulse.pathId}`} />
                </animateMotion>
              </circle>
            ))}

            {/* Node Vertices rendering */}
            {sortedNodes.map((node) => {
              const isHovered = hoveredNode === node.id;
              const isActive = activeElements[node.id];
              const isIdentityHub = node.id === 'orchestrator';
              const accentColor = (isIdentityHub && isEmailFocused)
                ? '#22c55e'
                : (isActive || isHovered ? brandTheme.accent : '#27272a');
              const isNodeInactiveBackground = !isActive && !isHovered && !(isIdentityHub && isEmailFocused);
              const opacity = (isActive || isHovered || (isIdentityHub && isEmailFocused)) ? 1 : node.opacity;

              return (
                <g 
                  key={node.id} 
                  className="cursor-pointer"
                  onMouseEnter={() => setHoveredNode(node.id)}
                  onMouseLeave={() => setHoveredNode(null)}
                  style={{
                    opacity,
                    willChange: 'transform, opacity'
                  }}
                >
                  {/* Ripple pulse ring */}
                  <circle
                    cx={node.screenX}
                    cy={node.screenY}
                    r={node.renderedR + (isHovered || (isIdentityHub && isEmailFocused) ? 12 : 8)}
                    fill="none"
                    stroke={accentColor}
                    strokeWidth={1}
                    className="transition-all duration-300 animate-pulse"
                    opacity={isHovered || (isIdentityHub && isEmailFocused) ? 0.35 : 0.12}
                    style={{
                      willChange: 'transform, opacity'
                    }}
                  />
                  {/* Glow circle fill */}
                  <circle
                    cx={node.screenX}
                    cy={node.screenY}
                    r={node.renderedR}
                    fill={isActive || isHovered || (isIdentityHub && isEmailFocused) ? accentColor : '#09090b'}
                    stroke={accentColor}
                    strokeWidth={1.5}
                    className="transition-all duration-300"
                    style={{
                      filter: isNodeInactiveBackground ? 'url(#node-blur)' : `drop-shadow(0 0 8px ${accentColor})`,
                      willChange: 'transform, opacity'
                    }}
                  />
                  {/* Dynamic label tracking */}
                  <text
                    x={node.screenX}
                    y={node.screenY + node.renderedR + 16}
                    textAnchor="middle"
                    className="text-[8px] font-mono tracking-widest uppercase transition-colors duration-300"
                    style={{
                      fill: (isActive || isHovered || (isIdentityHub && isEmailFocused)) ? (isIdentityHub && isEmailFocused ? '#22c55e' : brandTheme.accent) : '#71717a',
                      willChange: 'transform, opacity'
                    }}
                  >
                    {node.label}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Dynamic status stream readout overlay */}
        <div className="absolute bottom-10 left-10 flex flex-col font-mono text-[9px] text-zinc-500 gap-1 select-none">
          <p className="flex items-center gap-1.5">
            <span className={`w-1.5 h-1.5 rounded-full ${email ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-700'}`} />
            STATUS: SECURE_STANDBY
          </p>
          <p>ACTIVE ROLE: {tenantName ? tenantName.toUpperCase() : 'NO_CONTEXT'}</p>
        </div>
      </div>

      {/* Right Panel: Gateway Command Center (40% Width) */}
      <div className="relative z-10 w-full md:w-[40vw] h-full flex flex-col justify-center bg-[#09090b] border-l border-[#27272a] px-8 md:px-12 py-10 shadow-[0_0_80px_rgba(0,0,0,0.9)]">
        
        {/* Subtle Ambient Accent Border Glow */}
        <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-zinc-800 to-transparent" />
        
        <div className="w-full max-w-[360px] mx-auto flex flex-col h-full justify-between">
          
          {/* Top title area with explicit bounding height & width for layout stability */}
          <div className="pt-6">
            <div className="flex items-center gap-2 mb-2 min-h-[12px]">
              <div className={`w-2 h-2 rounded-full ${brandTheme.accent !== '#27272a' ? brandTheme.bg : 'bg-zinc-700'} animate-pulse`} />
              <span className={`text-[8px] font-mono tracking-widest uppercase ${brandTheme.text}`}>
                System Security Clearance Required
              </span>
            </div>
            {/* Frozen Layout Bounding Box for Scramble heading to prevent shifts */}
            <div className="h-16 w-full flex items-center justify-start overflow-hidden">
              <h2 className={`text-xs font-bold tracking-[0.15em] uppercase font-mono leading-relaxed transition-colors duration-300 w-full break-words select-text ${brandTheme.text}`}>
                {headerText}
              </h2>
            </div>
            <p className="text-[9px] text-zinc-500 mt-0.5 uppercase tracking-wider font-mono min-h-[14px]">
              {cryptoSub}
            </p>
          </div>

          {/* Form control card */}
          <div className="my-auto py-4 space-y-5">
            <form onSubmit={handleSubmit} className="space-y-4">
              
              <div className="space-y-1.5">
                <label className="text-[9px] font-bold text-zinc-400 tracking-wider uppercase font-mono">
                  Identity Email Node
                </label>
                <div className="relative">
                  <span className={`absolute left-3.5 top-3.5 transition-colors duration-300 ${brandTheme.text}`}>
                    <Mail size={13} />
                  </span>
                  <input
                    type="email"
                    value={email}
                    disabled={authState !== 'idle'}
                    onChange={(e) => setEmail(e.target.value)}
                    onFocus={() => setIsEmailFocused(true)}
                    onBlur={() => setIsEmailFocused(false)}
                    placeholder="admin@centle.com"
                    className={`w-full bg-black border border-[#27272a] rounded-md pl-10 pr-4 py-3 text-xs text-zinc-200 placeholder-zinc-700 transition-all duration-300 font-mono shadow-inner shadow-black/80 ${brandTheme.borderGlow}`}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-bold text-zinc-400 tracking-wider uppercase font-mono">
                  Access Security Matrix Key
                </label>
                <div className="relative">
                  <span className={`absolute left-3.5 top-3.5 transition-colors duration-300 ${brandTheme.text}`}>
                    <Lock size={13} />
                  </span>
                  <input
                    type="password"
                    value={password}
                    disabled={authState !== 'idle'}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••••••"
                    className={`w-full bg-black border border-[#27272a] rounded-md pl-10 pr-4 py-3 text-xs text-zinc-200 placeholder-zinc-700 transition-all duration-300 font-mono shadow-inner shadow-black/80 ${brandTheme.borderGlow}`}
                  />
                </div>
              </div>

              {/* Error messages banner */}
              {errorMsg && (
                <div className="flex items-start gap-2 bg-rose-950/15 border border-rose-900/30 text-rose-400 p-3 rounded-md text-[10px] leading-relaxed font-mono animate-shake">
                  <AlertCircle size={12} className="flex-shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Multi-Tenant Domain Active badge */}
              <div className="min-h-[22px] flex items-center justify-start transition-all duration-300">
                {tenantName && (
                  <div className={`animate-fade-in text-[9px] font-mono font-bold px-3 py-1 rounded flex items-center gap-1.5 ${brandTheme.badgeBg}`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${brandTheme.bg} animate-pulse`} />
                    <span>Context: {tenantName}</span>
                  </div>
                )}
              </div>

              {/* Connection Submit Trigger */}
              <button
                type="submit"
                disabled={authState !== 'idle' || isTyping}
                className={`w-full py-3 rounded-md text-[10px] font-bold uppercase tracking-widest transition-all duration-300 font-mono flex justify-center items-center border ${
                  authState === 'idle'
                    ? 'bg-zinc-100 hover:bg-zinc-200 text-black border-transparent shadow-[0_0_15px_rgba(255,255,255,0.05)]'
                    : 'bg-black text-zinc-500 border-zinc-800 cursor-not-allowed'
                }`}
              >
                {authState === 'idle' ? 'Establish Connection' : 'Handshake initialized...'}
              </button>
            </form>

            {/* Connection Ticker Terminal console logs */}
            {authState !== 'idle' && (
              <div className="bg-black border border-zinc-800 rounded-md p-3.5 font-mono text-[9px] text-[#22c55e] space-y-1.5 shadow-inner select-text h-[120px] overflow-y-auto">
                {consoleLogs.map((log, index) => (
                  <div key={index} className="animate-fade-in leading-relaxed">
                    {log}
                  </div>
                ))}
                <span className="inline-block w-1.5 h-3 bg-[#22c55e] animate-pulse ml-0.5" />
              </div>
            )}
          </div>

          {/* QuickAccess Chips Panel */}
          <div className="pb-4">
            <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest text-center mb-3 font-mono">
              QuickAccess demo keys
            </p>
            <div className="grid grid-cols-3 gap-2">
              {DEMO_ACCOUNTS.map((acc) => (
                <button
                  key={acc.label}
                  type="button"
                  disabled={isTyping || authState !== 'idle'}
                  onClick={() => handleAutofill(acc.email, acc.pass)}
                  className={`text-[9px] py-1.5 px-2 border rounded font-semibold transition-all duration-150 truncate ${acc.color} bg-black/40`}
                >
                  {acc.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* SVG flow pulse animations style */}
      <style>{`
        @keyframes pathFlowAnimation {
          to {
            stroke-dashoffset: -40;
          }
        }
        .animate-fade-in {
          animation: fadeIn 0.2s ease-out forwards;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(2px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-shake {
          animation: shake 0.3s ease-in-out;
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-4px); }
          75% { transform: translateX(4px); }
        }
      `}</style>
    </div>
  );
}
