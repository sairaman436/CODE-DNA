import { Shield, ShieldCheck, ShieldAlert, Users, Award, Star, Zap } from "lucide-react";

export function RoleBadge({ role, type }: { role: string, type?: string }) {
  const configs: any = {
    'ADMIN': { 
      label: 'Master Admin', 
      icon: <ShieldCheck className="w-3 h-3" />, 
      color: 'text-emerald-400', 
      bg: 'bg-emerald-500/10', 
      border: 'border-emerald-500/20' 
    },
    'STAFF': { 
      label: type || 'Verified Staff', 
      icon: <Shield className="w-3 h-3" />, 
      color: 'text-blue-400', 
      bg: 'bg-blue-500/10', 
      border: 'border-blue-500/20' 
    },
    'MODERATOR': { 
      label: 'Moderator', 
      icon: <Zap className="w-3 h-3" />, 
      color: 'text-amber-400', 
      bg: 'bg-amber-500/10', 
      border: 'border-amber-500/20' 
    },
    'PR': { 
      label: 'Public Relations', 
      icon: <Users className="w-3 h-3" />, 
      color: 'text-purple-400', 
      bg: 'bg-purple-500/10', 
      border: 'border-purple-500/20' 
    },
    'MANAGER': { 
      label: 'Community Manager', 
      icon: <Star className="w-3 h-3" />, 
      color: 'text-indigo-400', 
      bg: 'bg-indigo-500/10', 
      border: 'border-indigo-500/20' 
    },
    'SENIOR_DEV': { 
      label: 'Senior Developer', 
      icon: <Award className="w-3 h-3" />, 
      color: 'text-orange-400', 
      bg: 'bg-orange-500/10', 
      border: 'border-orange-500/20' 
    },
    'USER': { 
      label: 'Verified User', 
      icon: <CheckIcon />, 
      color: 'text-zinc-400', 
      bg: 'bg-white/5', 
      border: 'border-white/10' 
    }
  };

  const config = configs[type] || configs[role] || configs['USER'];

  return (
    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border ${config.bg} ${config.border} ${config.color} shadow-sm`}>
      {config.icon}
      <span className="text-[10px] font-black uppercase tracking-wider">{config.label}</span>
    </div>
  );
}

function CheckIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
