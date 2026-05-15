"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";
import { 
  Shield, Users, Activity, Settings, Search, 
  MoreVertical, Edit3, Trash2, ShieldCheck, 
  Eye, Filter, ArrowRight, Loader2, Lock, ShieldAlert,
  RefreshCcw, X
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SilkBackground } from "@/components/SilkBackground";
import { DynamicBackground } from "@/components/DynamicBackground";
import { RoleBadge } from "@/components/RoleBadge";

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [users, setUsers] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"users" | "logs" | "audit">("users");
  const [logFilter, setLogFilter] = useState("ALL");
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [masterKey, setMasterKey] = useState("");
  const [unlockError, setUnlockError] = useState("");
  const [editingUser, setEditingUser] = useState<any>(null);
  const [observingUser, setObservingUser] = useState<any>(null);
  const [editFormData, setEditFormData] = useState({
    display_name: "",
    role: "USER",
    staff_type: ""
  });

  const logCategories = ["ALL", "LOGIN", "REGISTER", "PROFILE_EDIT", "REANALYZE", "ADMIN_LOGIN", "USER_UPDATE", "USER_DELETE"];

  const handleUnlock = () => {
    // Master Key check (should ideally be a backend call, but we'll use the admin password as the key for now)
    if (masterKey === "sairamanladi2007@gmail.com") {
      setIsUnlocked(true);
      fetchAdminData();
    } else {
      setUnlockError("Invalid Master Key. Access Denied.");
    }
  };

  const handleEdit = (user: any) => {
    setEditingUser(user);
    setEditFormData({
      display_name: user.display_name || "",
      role: user.role || "USER",
      staff_type: user.staff_type || ""
    });
  };

  const handleDeepObserve = (user: any) => {
    setObservingUser(user);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to REVOKE the identity of ${name}? This action is irreversible.`)) return;
    setLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
      const res = await fetch(`${apiUrl}/api/admin/users/${id}`, {
        method: "DELETE",
        headers: { 
          "Content-Type": "application/json",
          "x-user-id": (session?.user as any)?.id || "" 
        },
      });

      if (res.ok) {
        setUsers(users.filter(u => u.id !== id));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!editingUser) return;
    setLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
      const res = await fetch(`${apiUrl}/api/admin/users/${editingUser.id}`, {
        method: "PATCH",
        headers: { 
          "Content-Type": "application/json",
          "x-user-id": (session?.user as any)?.id || "" 
        },
        body: JSON.stringify(editFormData),
      });

      if (res.ok) {
        setUsers(users.map(u => u.id === editingUser.id ? { ...u, ...editFormData } : u));
        setEditingUser(null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
    if (status === "authenticated") {
      fetchAdminData();
      
      // Auto-refresh every 30 seconds for real-time observation
      const interval = setInterval(fetchAdminData, 30000);
      return () => clearInterval(interval);
    }
  }, [status, router, (session?.user as any)?.id]);

  async function fetchAdminData() {
    setLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
      const headers = { 
        "Content-Type": "application/json",
        "x-user-id": (session?.user as any)?.id || "" 
      };

      const [uRes, lRes] = await Promise.all([
        fetch(`${apiUrl}/api/admin/users`, { headers }),
        fetch(`${apiUrl}/api/admin/logs`, { headers })
      ]);

      if (uRes.ok && lRes.ok) {
        setUsers(await uRes.json());
        setLogs(await lRes.json());
      } else {
        // If 403, redirect away
        if (uRes.status === 403) router.push("/");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
      </div>
    );
  }

  if (!isUnlocked) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center relative overflow-hidden">
        <DynamicBackground />
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="z-20 w-full max-w-md p-10 bg-white/[0.02] border border-white/[0.08] backdrop-blur-3xl rounded-[40px] text-center shadow-2xl"
        >
          <div className="w-20 h-20 rounded-[32px] bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-8 shadow-[0_0_40px_rgba(16,185,129,0.1)]">
            <Lock className="w-8 h-8 text-emerald-500" />
          </div>
          <h2 className="text-3xl font-black text-white mb-2 uppercase tracking-tighter">Master Key Required</h2>
          <p className="text-[12px] text-zinc-500 font-bold uppercase tracking-[0.2em] mb-10">Secondary Verification Level 04</p>
          
          <div className="space-y-4">
            <div className="relative">
              <Input 
                type="password"
                placeholder="Enter Master Key..." 
                value={masterKey}
                onChange={(e) => setMasterKey(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleUnlock()}
                className="h-14 bg-white/[0.03] border-white/[0.08] rounded-2xl text-center font-mono tracking-[0.5em] text-emerald-500 placeholder:tracking-normal placeholder:text-zinc-700"
              />
            </div>
            {unlockError && <p className="text-[10px] font-black uppercase text-rose-500 tracking-widest animate-pulse">{unlockError}</p>}
            <Button 
              onClick={handleUnlock}
              className="w-full h-14 bg-emerald-500 text-black hover:bg-emerald-400 font-black uppercase tracking-widest rounded-2xl shadow-[0_0_30px_rgba(16,185,129,0.2)] transition-all active:scale-95"
            >
              Verify Identity
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-emerald-500/30 font-sans relative overflow-hidden">
      <SilkBackground color="#050505" />
      <DynamicBackground />

      {/* Header */}
      <header className="relative z-20 pt-10 px-10 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.1)]">
            <Shield className="w-6 h-6 text-emerald-500" />
          </div>
          <div>
            <h1 className="text-2xl font-black uppercase tracking-tight text-zinc-100">Master Control</h1>
            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.2em]">Deep Activity Observation Engine</p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="hidden md:flex bg-white/[0.03] border border-white/[0.08] rounded-2xl p-1 px-4 items-center gap-4">
            <TabButton active={activeTab === "users"} onClick={() => setActiveTab("users")} icon={<Users className="w-4 h-4" />} label="Users" />
            <TabButton active={activeTab === "logs"} onClick={() => setActiveTab("logs")} icon={<Activity className="w-4 h-4" />} label="Activity" />
            <TabButton active={activeTab === "audit"} onClick={() => setActiveTab("audit")} icon={<ShieldAlert className="w-4 h-4" />} label="Audit" />
          </div>
          <div className="h-10 w-px bg-white/10 mx-2" />
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-[11px] font-black uppercase text-zinc-100">{session?.user?.name}</p>
              <p className="text-[9px] font-bold uppercase text-emerald-500 tracking-widest">Master Admin</p>
            </div>
            <img src={session?.user?.image || ""} className="w-10 h-10 rounded-full border border-emerald-500/20" />
          </div>
        </div>
      </header>

      <main className="relative z-20 p-10">
        <div className="max-w-7xl mx-auto">
          <AnimatePresence mode="wait">
            {activeTab === "users" ? (
              <motion.div
                key="users"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
                  <StatCard icon={<ShieldCheck className="w-5 h-5 text-emerald-500" />} label="Total DNA Records" value={users.length} color="emerald" />
                  <StatCard icon={<Activity className="w-5 h-5 text-blue-500" />} label="Active Sessions" value={users.filter(u => u.email_verified).length} color="blue" />
                  <StatCard icon={<Search className="w-5 h-5 text-purple-500" />} label="New Genesis (24h)" value="0" color="purple" />
                  <StatCard icon={<Lock className="w-5 h-5 text-rose-500" />} label="Security Alerts" value="0" color="rose" />
                </div>

                <div className="bg-white/[0.02] border border-white/[0.06] backdrop-blur-3xl rounded-[32px] overflow-hidden shadow-2xl">
                  <div className="p-8 border-b border-white/[0.05] flex items-center justify-between bg-white/[0.01]">
                    <h3 className="text-xl font-black uppercase tracking-tight flex items-center gap-3">
                      <Users className="w-6 h-6 text-emerald-500" /> Identity Registry
                    </h3>
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
                        <input 
                          type="text" 
                          placeholder="Search Registry..." 
                          className="bg-white/5 border border-white/10 rounded-2xl pl-12 pr-6 py-2.5 text-sm outline-none focus:border-emerald-500/50 transition-all w-72"
                        />
                      </div>
                      <Button variant="outline" className="rounded-2xl border-white/10 text-zinc-400 gap-2 font-bold text-[11px] uppercase tracking-widest">
                        <Filter className="w-4 h-4" /> Filter
                      </Button>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="text-[10px] uppercase tracking-[0.2em] font-black text-zinc-600 border-b border-white/[0.03]">
                          <th className="p-6 px-10">Identity</th>
                          <th className="p-6 text-center">Status</th>
                          <th className="p-6 text-center">Technical Link</th>
                          <th className="p-6">Created At</th>
                          <th className="p-6 text-right px-10">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/[0.03]">
                        {users.map((u) => (
                          <tr key={u.id} className="group hover:bg-white/[0.01] transition-all">
                            <td className="p-6 px-10">
                              <Link href={u.codedna_username ? `/u/${u.codedna_username}` : "#"} className="flex items-center gap-4 group/id">
                                <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-[12px] font-black text-emerald-500 uppercase group-hover/id:border-emerald-500/50 transition-all">
                                  {u.display_name?.charAt(0) || u.email.charAt(0)}
                                </div>
                                <div>
                                  <div className="flex items-center gap-2 mb-0.5">
                                    <p className="text-sm font-black text-zinc-100 group-hover/id:text-emerald-400 transition-colors">{u.display_name || 'Anonymous'}</p>
                                    <RoleBadge role={u.role} type={u.staff_type} />
                                  </div>
                                  <p className="text-[11px] text-zinc-500 font-medium">{u.email}</p>
                                </div>
                              </Link>
                            </td>
                            <td className="p-6">
                              <div className="flex justify-center">
                                <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border ${
                                  u.email_verified 
                                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' 
                                    : 'bg-zinc-500/10 border-zinc-500/20 text-zinc-500'
                                }`}>
                                  • {u.email_verified ? 'Verified' : 'Pending'}
                                </span>
                              </div>
                            </td>
                            <td className="p-6 text-center">
                              <span className="text-[10px] font-black uppercase tracking-[0.15em] text-zinc-600">
                                {u.github_id ? `GH:${u.github_id}` : 'Unlinked'}
                              </span>
                            </td>
                            <td className="p-6 text-zinc-500 text-[11px] font-medium">
                              {new Date(u.created_at).toLocaleDateString()}
                            </td>
                            <td className="p-6 text-right px-10">
                              <div className="flex items-center justify-end gap-2">
                                <AdminAction 
                                  icon={<Edit3 className="w-4 h-4" />} 
                                  label="Edit" 
                                  onClick={() => handleEdit(u)}
                                />
                                <AdminAction 
                                  icon={<Eye className="w-4 h-4" />} 
                                  label="Deep Observe" 
                                  onClick={() => handleDeepObserve(u)}
                                />
                                <AdminAction 
                                  icon={<Trash2 className="w-4 h-4" />} 
                                  label="Revoke" 
                                  color="rose" 
                                  onClick={() => handleDelete(u.id, u.display_name || u.email)}
                                  disabled={u.role === 'ADMIN'}
                                />
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            ) : activeTab === "logs" ? (
              <motion.div
                key="logs"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-white/[0.02] border border-white/[0.06] backdrop-blur-3xl rounded-[32px] p-8 shadow-2xl"
              >
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-xl font-black uppercase tracking-tight flex items-center gap-3">
                    <Activity className="w-6 h-6 text-emerald-500" /> Deep Observation Stream
                  </h3>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">Filter Sequence:</span>
                    <select 
                      value={logFilter}
                      onChange={(e) => setLogFilter(e.target.value)}
                      className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-[11px] font-black uppercase tracking-widest text-zinc-300 outline-none hover:bg-white/10 transition-all"
                    >
                      {logCategories.map(cat => (
                        <option key={cat} value={cat} className="bg-[#050505]">{cat}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-4">
                  {logs
                    .filter(l => logFilter === "ALL" || l.action === logFilter)
                    .map((log) => (
                    <div key={log.id} className="group p-4 rounded-2xl bg-white/[0.02] border border-white/[0.05] hover:border-emerald-500/30 transition-all flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                          <ActivityIcon action={log.action} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-black text-emerald-500 uppercase tracking-widest">{log.action}</span>
                            <span className="text-[10px] text-zinc-700">•</span>
                            <span className="text-[11px] font-bold text-zinc-300">{log.user?.display_name || 'System'}</span>
                          </div>
                          <p className="text-[12px] text-zinc-500 mt-0.5">{log.details}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">
                          {new Date(log.created_at).toLocaleTimeString()}
                        </p>
                        <p className="text-[9px] text-zinc-800 font-medium">
                          {new Date(log.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="audit"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-rose-500/[0.02] border border-rose-500/10 backdrop-blur-3xl rounded-[32px] p-8 shadow-2xl"
              >
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-xl font-black uppercase tracking-tight flex items-center gap-3">
                    <ShieldAlert className="w-6 h-6 text-rose-500" /> High-Security Audit Stream
                  </h3>
                  <div className="bg-rose-500/10 border border-rose-500/20 px-4 py-1.5 rounded-xl">
                    <span className="text-[10px] font-black uppercase text-rose-500 tracking-[0.2em]">Administrative Override Log</span>
                  </div>
                </div>

                <div className="space-y-4">
                  {logs
                    .filter(l => ["ADMIN_EDIT_USER", "USER_UPDATE", "USER_DELETE", "ADMIN_LOGIN"].includes(l.action))
                    .map((log) => (
                    <div key={log.id} className="group p-5 rounded-2xl bg-white/[0.01] border border-white/[0.04] hover:border-rose-500/30 transition-all flex items-center justify-between">
                      <div className="flex items-center gap-5">
                        <div className="w-12 h-12 rounded-xl bg-rose-500/5 flex items-center justify-center border border-rose-500/10">
                          <Shield className="w-5 h-5 text-rose-500" />
                        </div>
                        <div>
                          <div className="flex items-center gap-3 mb-1">
                            <span className="text-[11px] font-black text-rose-500 uppercase tracking-widest bg-rose-500/10 px-2 py-0.5 rounded-md">{log.action}</span>
                            <span className="text-[11px] font-black text-zinc-100 uppercase tracking-tight">By {log.user?.display_name || 'System Admin'}</span>
                          </div>
                          <p className="text-[12px] text-zinc-400 font-medium">{log.details}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] text-rose-400 font-black uppercase tracking-widest">
                          {new Date(log.created_at).toLocaleTimeString()}
                        </p>
                        <p className="text-[9px] text-zinc-700 font-bold">
                          {new Date(log.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                  {logs.filter(l => ["ADMIN_EDIT_USER", "USER_UPDATE", "USER_DELETE"].includes(l.action)).length === 0 && (
                    <div className="py-20 text-center">
                      <p className="text-[11px] text-zinc-600 font-black uppercase tracking-[0.3em]">No Administrative Interventions Recorded</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Edit Modal Overlay */}
          <AnimatePresence>
            {editingUser && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setEditingUser(null)}
                  className="absolute inset-0 bg-black/60 backdrop-blur-md"
                />
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 20 }}
                  className="relative z-10 w-full max-w-lg bg-[#0c0c0c] border border-white/10 rounded-[40px] p-10 shadow-2xl overflow-hidden"
                >
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-emerald-500 to-transparent" />
                  
                  <div className="flex items-center gap-4 mb-8">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                      <Edit3 className="w-6 h-6 text-emerald-500" />
                    </div>
                    <div>
                      <h3 className="text-xl font-black uppercase tracking-tight text-white">Override Identity</h3>
                      <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.2em]">{editingUser.email}</p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">Display Name</label>
                      <Input 
                        value={editFormData.display_name}
                        onChange={(e) => setEditFormData({...editFormData, display_name: e.target.value})}
                        className="h-12 bg-white/5 border-white/10 rounded-2xl focus:border-emerald-500/50 transition-all"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">Core Role</label>
                        <select 
                          value={editFormData.role}
                          onChange={(e) => setEditFormData({...editFormData, role: e.target.value})}
                          className="w-full h-12 bg-white/5 border border-white/10 rounded-2xl px-4 text-sm text-white outline-none focus:border-emerald-500/50 transition-all appearance-none"
                        >
                          <option value="USER" className="bg-[#0c0c0c]">USER</option>
                          <option value="STAFF" className="bg-[#0c0c0c]">STAFF</option>
                          <option value="ADMIN" className="bg-[#0c0c0c]">ADMIN</option>
                        </select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">Classification</label>
                        <select 
                          disabled={editFormData.role !== 'STAFF'}
                          value={editFormData.staff_type}
                          onChange={(e) => setEditFormData({...editFormData, staff_type: e.target.value})}
                          className="w-full h-12 bg-white/5 border border-white/10 rounded-2xl px-4 text-sm text-white outline-none focus:border-emerald-500/50 transition-all appearance-none disabled:opacity-20"
                        >
                          <option value="" className="bg-[#0c0c0c]">NOT ASSIGNED</option>
                          <option value="MANAGER" className="bg-[#0c0c0c]">MANAGER</option>
                          <option value="PR" className="bg-[#0c0c0c]">PR</option>
                          <option value="SENIOR_DEV" className="bg-[#0c0c0c]">SENIOR DEV</option>
                          <option value="MODERATOR" className="bg-[#0c0c0c]">MODERATOR</option>
                        </select>
                      </div>
                    </div>

                    <div className="pt-6 flex gap-3">
                      <Button 
                        onClick={handleUpdate}
                        disabled={loading}
                        className="flex-1 h-14 bg-emerald-500 text-black hover:bg-emerald-400 font-black uppercase tracking-widest rounded-2xl transition-all"
                      >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Authorize Changes"}
                      </Button>
                      <Button 
                        onClick={() => setEditingUser(null)}
                        variant="outline"
                        className="h-14 px-8 border-white/10 text-zinc-500 hover:text-white hover:bg-white/5 font-black uppercase tracking-widest rounded-2xl transition-all"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* Deep Observe Modal Overlay */}
          <AnimatePresence>
            {observingUser && (
              <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setObservingUser(null)}
                  className="absolute inset-0 bg-black/80 backdrop-blur-xl"
                />
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95, y: 30 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 30 }}
                  className="relative z-10 w-full max-w-4xl bg-[#0c0c0c] border border-white/10 rounded-[40px] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
                >
                  <div className="p-10 border-b border-white/5 flex items-center justify-between bg-white/[0.01]">
                    <div className="flex items-center gap-6">
                      <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                        <Eye className="w-8 h-8 text-emerald-500" />
                      </div>
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="text-2xl font-black uppercase tracking-tight text-white">{observingUser.display_name || 'Anonymous'}</h3>
                          <span className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-[9px] font-black uppercase tracking-widest text-zinc-500">{observingUser.role}</span>
                        </div>
                        <p className="text-[11px] text-zinc-500 font-bold uppercase tracking-[0.2em]">{observingUser.email}</p>
                      </div>
                    </div>
                    <Button 
                      onClick={() => setObservingUser(null)}
                      className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 text-zinc-500 hover:text-white"
                    >
                      <X className="w-5 h-5" />
                    </Button>
                  </div>

                  <div className="flex-1 overflow-y-auto p-10 custom-scrollbar">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                      <div className="bg-white/[0.02] border border-white/[0.05] p-6 rounded-3xl">
                        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600 mb-4">DNA Fingerprint</p>
                        {observingUser.fingerprints?.[0] ? (
                          <div className="space-y-4">
                            <StatBar label="Readability" value={observingUser.fingerprints[0].readability_score || 0} />
                            <StatBar label="Complexity" value={observingUser.fingerprints[0].complexity_score || 0} />
                            <StatBar label="Documentation" value={observingUser.fingerprints[0].documentation_score || 0} />
                            <StatBar label="Test Mindset" value={observingUser.fingerprints[0].test_mindset_score || 0} />
                          </div>
                        ) : (
                          <p className="text-[11px] text-zinc-700 italic font-medium">No DNA sequence recorded yet.</p>
                        )}
                      </div>
                      <div className="md:col-span-2 bg-white/[0.02] border border-white/[0.05] p-6 rounded-3xl">
                        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600 mb-4">Deep Observation Stream (Recent)</p>
                        <div className="space-y-3">
                          {observingUser.activity_logs?.map((l: any) => (
                            <div key={l.id} className="p-3 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between">
                              <div>
                                <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">{l.action}</span>
                                <p className="text-[11px] text-zinc-400 mt-0.5">{l.details}</p>
                              </div>
                              <span className="text-[9px] font-bold text-zinc-700 uppercase">{new Date(l.created_at).toLocaleDateString()}</span>
                            </div>
                          ))}
                          {!observingUser.activity_logs?.length && <p className="text-[11px] text-zinc-700 italic font-medium">No recent activity detected.</p>}
                        </div>
                      </div>
                    </div>

                    <div className="bg-white/[0.02] border border-white/[0.05] p-8 rounded-[32px]">
                      <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-emerald-500 mb-6">Technical Metadata</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-10">
                        <MetaItem label="Technical Link" value={observingUser.github_id ? "GITHUB_VERIFIED" : "UNLINKED"} />
                        <MetaItem label="Failed Attempts" value={observingUser.failed_attempts || "0"} />
                        <MetaItem label="Lockout State" value={observingUser.lockout_until ? "LOCKED" : "STABLE"} />
                        <MetaItem label="Genesis Date" value={new Date(observingUser.created_at).toLocaleDateString()} />
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

function StatBar({ label, value }: { label: string, value: number }) {
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-zinc-400">
        <span>{label}</span>
        <span>{value}%</span>
      </div>
      <div className="h-1 bg-white/5 rounded-full overflow-hidden">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          className="h-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"
        />
      </div>
    </div>
  );
}

function MetaItem({ label, value }: { label: string, value: string }) {
  return (
    <div>
      <p className="text-[9px] font-black uppercase tracking-widest text-zinc-600 mb-1">{label}</p>
      <p className="text-[12px] font-black text-zinc-100">{value}</p>
    </div>
  );
}



function TabButton({ active, onClick, icon, label }: any) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all
        ${active ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20' : 'text-zinc-500 hover:text-white'}
      `}
    >
      {icon} {label}
    </button>
  );
}

function StatCard({ label, value, icon, color }: any) {
  const colors: any = {
    emerald: "text-emerald-500 bg-emerald-500/5 border-emerald-500/10",
    blue: "text-blue-500 bg-blue-500/5 border-blue-500/10",
    purple: "text-purple-500 bg-purple-500/5 border-purple-500/10",
    rose: "text-rose-500 bg-rose-500/5 border-rose-500/10",
  };

  return (
    <div className={`p-6 rounded-[32px] border backdrop-blur-xl transition-all hover:scale-[1.02] ${colors[color]}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
          {icon}
        </div>
        <ArrowRight className="w-4 h-4 opacity-30" />
      </div>
      <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 mb-1">{label}</p>
      <p className="text-3xl font-black tracking-tight">{value}</p>
    </div>
  );
}

function AdminAction({ icon, label, color = "zinc", onClick, disabled }: any) {
  return (
    <button 
      onClick={onClick}
      disabled={disabled}
      className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all border disabled:opacity-20 disabled:cursor-not-allowed
        ${color === "rose" ? "border-rose-500/20 text-rose-500 hover:bg-rose-500/10" : "border-white/5 text-zinc-500 hover:text-white hover:bg-white/10"}
      `}
    >
      {icon}
    </button>
  );
}

function GitIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
  );
}

function ActivityIcon({ action }: { action: string }) {
  if (action.includes('REGISTER')) return <Users className="w-4 h-4 text-emerald-500" />;
  if (action.includes('LOGIN')) return <ShieldCheck className="w-4 h-4 text-blue-500" />;
  if (action.includes('EDIT')) return <Edit3 className="w-4 h-4 text-purple-500" />;
  return <Activity className="w-4 h-4 text-zinc-500" />;
}
