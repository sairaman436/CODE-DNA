"use client";

import { useSession } from "next-auth/react";
import { Shield, Edit3, Trash2, Check, X, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

interface User {
  id: string;
  display_name?: string | null;
  username: string;
  role?: string;
  staff_type?: string | null;
  email?: string | null;
}

export function AdminControls({ targetUser, onUpdate }: { targetUser: User, onUpdate?: () => void }) {
  const { data: session } = useSession();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editData, setEditData] = useState({
    display_name: targetUser.display_name || "",
    role: targetUser.role || "USER",
    staff_type: targetUser.staff_type || "",
    email: targetUser.email || ""
  });

  // Sync state when targetUser changes (important for Next.js client-side navigation)
  useEffect(() => {
    setEditData({
      display_name: targetUser.display_name || "",
      role: targetUser.role || "USER",
      staff_type: targetUser.staff_type || "",
      email: targetUser.email || ""
    });
  }, [targetUser]);

  if (session?.role !== 'ADMIN') return null;

  const handleUpdate = async () => {
    if (!targetUser.id) {
      alert("Error: Target user ID is missing. Try refreshing the page.");
      return;
    }

    setLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
      
      // Don't send empty email to avoid overwriting existing data
      const updatePayload: Partial<User> = { ...editData };
      if (!updatePayload.email) delete updatePayload.email;
      if (updatePayload.role !== 'STAFF') updatePayload.staff_type = undefined;

      const res = await fetch(`${apiUrl}/api/admin/users/${targetUser.id}`, {
        method: "PATCH",
        headers: { 
          "Content-Type": "application/json",
          "x-user-id": session?.user?.id || "" 
        },
        body: JSON.stringify(updatePayload),
      });

      if (res.ok) {
        setIsEditing(false);
        if (onUpdate) onUpdate();
      } else {
        const error = await res.json();
        alert(`Update failed: ${error.error || "Unknown error"}`);
      }
    } catch (err) {
      alert("Network error occurred while updating user.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] w-full max-w-2xl px-6">
      <motion.div 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-emerald-500/10 backdrop-blur-2xl border border-emerald-500/30 rounded-3xl p-4 shadow-[0_0_50px_rgba(16,185,129,0.15)] flex items-center justify-between"
      >
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500 text-black flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-[11px] font-black uppercase tracking-widest text-emerald-500">Master Administrative Override</h4>
            <p className="text-[13px] font-bold text-white">Target: {targetUser.display_name || targetUser.username}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!isEditing ? (
            <>
              <Button 
                onClick={() => setIsEditing(true)}
                variant="ghost" 
                className="h-10 px-4 rounded-xl text-emerald-400 hover:text-white hover:bg-emerald-500/20 border border-emerald-500/20"
              >
                <Edit3 className="w-4 h-4 mr-2" /> Edit Profile
              </Button>
              <Button 
                variant="ghost" 
                className="h-10 w-10 rounded-xl text-rose-500 hover:bg-rose-500/10 border border-rose-500/20"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Input 
                value={editData.display_name} 
                onChange={(e) => setEditData({...editData, display_name: e.target.value})}
                placeholder="Name" 
                className="h-9 w-32 bg-white/5 border-emerald-500/30 text-xs rounded-lg"
              />
              <select 
                value={editData.role}
                onChange={(e) => setEditData({...editData, role: e.target.value})}
                className="h-9 bg-white/5 border border-emerald-500/30 text-[11px] rounded-lg px-2 text-white outline-none"
              >
                <option value="USER" className="bg-[#050505]">USER</option>
                <option value="ADMIN" className="bg-[#050505]">ADMIN</option>
                <option value="STAFF" className="bg-[#050505]">STAFF</option>
              </select>
              {editData.role === 'STAFF' && (
                <select 
                  value={editData.staff_type}
                  onChange={(e) => setEditData({...editData, staff_type: e.target.value})}
                  className="h-9 bg-white/5 border border-emerald-500/30 text-[11px] rounded-lg px-2 text-white outline-none"
                >
                  <option value="" className="bg-[#050505]">SELECT TYPE</option>
                  <option value="MANAGER" className="bg-[#050505]">MANAGER</option>
                  <option value="PR" className="bg-[#050505]">PR</option>
                  <option value="SENIOR_DEV" className="bg-[#050505]">SENIOR DEV</option>
                  <option value="MODERATOR" className="bg-[#050505]">MODERATOR</option>
                </select>
              )}
              <Button 
                onClick={handleUpdate}
                disabled={loading}
                className="h-9 w-9 p-0 bg-emerald-500 text-black hover:bg-emerald-400 rounded-lg"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              </Button>
              <Button 
                onClick={() => setIsEditing(false)}
                className="h-9 w-9 p-0 bg-white/5 text-white hover:bg-white/10 rounded-lg border border-white/10"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
