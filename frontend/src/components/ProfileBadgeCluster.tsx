import { Shield, ShieldCheck, Users, Award, Star, Zap, Terminal, Code, Cpu, Activity, Lightbulb, Compass, Medal, Sparkles, BookOpen, Bug, Rocket, Globe } from "lucide-react";

export function ProfileBadgeCluster({ profile, isAnalyzed, overallScore }: { profile: any, isAnalyzed: boolean, overallScore: number }) {
  // 1. Position / Role Badge
  const role = profile.user.role || 'USER';
  const type = profile.user.staff_type;
  
  const roleConfigs: Record<string, any> = {
    'ADMIN': { label: 'Master Admin', icon: <ShieldCheck className="w-4 h-4" />, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
    'STAFF': { label: type || 'Verified Staff', icon: <Shield className="w-4 h-4" />, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
    'MODERATOR': { label: 'Moderator', icon: <Zap className="w-4 h-4" />, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
    'PR': { label: 'Public Relations', icon: <Users className="w-4 h-4" />, color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
    'MANAGER': { label: 'Community Manager', icon: <Star className="w-4 h-4" />, color: 'text-indigo-400', bg: 'bg-indigo-500/10', border: 'border-indigo-500/20' },
    'SENIOR_DEV': { label: 'Senior Developer', icon: <Award className="w-4 h-4" />, color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20' },
    'USER': { label: 'Verified User', icon: <CheckIcon />, color: 'text-zinc-400', bg: 'bg-white/5', border: 'border-white/10' }
  };
  const roleConfig = (type && roleConfigs[type]) || (role && roleConfigs[role]) || roleConfigs['USER'];

  // 2. Coding Style / Archetype Badge
  const archetypeConfigs: Record<string, any> = {
    'The Architect': { icon: <Cpu className="w-4 h-4" />, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
    'The Hacker': { icon: <Terminal className="w-4 h-4" />, color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20' },
    'The Perfectionist': { icon: <Sparkles className="w-4 h-4" />, color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
    'The Debugger': { icon: <Bug className="w-4 h-4" />, color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20' },
    'The Polyglot': { icon: <Globe className="w-4 h-4" />, color: 'text-pink-400', bg: 'bg-pink-500/10', border: 'border-pink-500/20' },
    'The Pragmatist': { icon: <Rocket className="w-4 h-4" />, color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20' },
    'The Scientist': { icon: <Activity className="w-4 h-4" />, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
    'The Mentor': { icon: <BookOpen className="w-4 h-4" />, color: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/20' },
  };
  
  let archetypeConfig = archetypeConfigs[profile.type];
  if (!isAnalyzed || !archetypeConfig) {
    archetypeConfig = { 
      label: 'Genesis Initiate', 
      icon: <Compass className="w-4 h-4" />, 
      color: 'text-emerald-300', 
      bg: 'bg-emerald-500/10', 
      border: 'border-emerald-500/20',
      glow: 'shadow-[0_0_15px_rgba(16,185,129,0.15)]'
    };
  } else {
    archetypeConfig = { ...archetypeConfig, label: profile.type };
  }

  // 3. Experience / Rank Badge based on score
  let rankConfig: any = { label: 'Novice', icon: <Star className="w-4 h-4" />, color: 'text-zinc-400', bg: 'bg-zinc-500/10', border: 'border-zinc-500/20' };
  
  if (isAnalyzed) {
    if (overallScore >= 85) {
      rankConfig = { label: 'Grandmaster', icon: <Award className="w-4 h-4" />, color: 'text-amber-300', bg: 'bg-amber-500/10', border: 'border-amber-500/20', glow: 'shadow-[0_0_15px_rgba(251,191,36,0.15)]' };
    } else if (overallScore >= 75) {
      rankConfig = { label: 'Expert', icon: <Medal className="w-4 h-4" />, color: 'text-indigo-400', bg: 'bg-indigo-500/10', border: 'border-indigo-500/20' };
    } else if (overallScore >= 60) {
      rankConfig = { label: 'Specialist', icon: <Zap className="w-4 h-4" />, color: 'text-sky-400', bg: 'bg-sky-500/10', border: 'border-sky-500/20' };
    } else if (overallScore >= 40) {
      rankConfig = { label: 'Apprentice', icon: <Lightbulb className="w-4 h-4" />, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' };
    } else {
      rankConfig = { label: 'Initiate', icon: <Compass className="w-4 h-4" />, color: 'text-zinc-400', bg: 'bg-zinc-500/10', border: 'border-zinc-500/20' };
    }
  }

  return (
    <div className="grid grid-cols-3 gap-2 w-full">
      {/* Coding Style Badge */}
      <div className={`flex flex-col items-center justify-center p-3 rounded-2xl border ${archetypeConfig.bg} ${archetypeConfig.border} ${archetypeConfig.color} ${archetypeConfig.glow || ''} backdrop-blur-md transition-all hover:bg-white/[0.05]`}>
        <div className="mb-1.5 opacity-80">{archetypeConfig.icon}</div>
        <span className="text-[9px] font-black uppercase tracking-widest text-center leading-tight">{archetypeConfig.label}</span>
        <span className="text-[8px] text-zinc-500 mt-1 uppercase font-mono tracking-widest">Style</span>
      </div>

      {/* Experience Rank Badge */}
      <div className={`flex flex-col items-center justify-center p-3 rounded-2xl border ${rankConfig.bg} ${rankConfig.border} ${rankConfig.color} ${rankConfig.glow || ''} backdrop-blur-md transition-all hover:bg-white/[0.05]`}>
        <div className="mb-1.5 opacity-80">{rankConfig.icon}</div>
        <span className="text-[9px] font-black uppercase tracking-widest text-center leading-tight">{rankConfig.label}</span>
        <span className="text-[8px] text-zinc-500 mt-1 uppercase font-mono tracking-widest">Rank</span>
      </div>

      {/* Position / Role Badge */}
      <div className={`flex flex-col items-center justify-center p-3 rounded-2xl border ${roleConfig.bg} ${roleConfig.border} ${roleConfig.color} backdrop-blur-md transition-all hover:bg-white/[0.05]`}>
        <div className="mb-1.5 opacity-80">{roleConfig.icon}</div>
        <span className="text-[9px] font-black uppercase tracking-widest text-center leading-tight">{roleConfig.label}</span>
        <span className="text-[8px] text-zinc-500 mt-1 uppercase font-mono tracking-widest">Role</span>
      </div>
    </div>
  );
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
