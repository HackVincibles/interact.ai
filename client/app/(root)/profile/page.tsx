"use client";

import { useState, useEffect } from "react";
import { getCurrentUser } from "@/lib/actions/auth.action";
import { 
  updateProfile, updateAvatar, updateResume, deleteResume,
  requestDeleteOTP, confirmDeleteAccount, deleteAvatar 
} from "@/lib/actions/user.action";
import { forgotPassword, verifyOTP, resetPassword } from "@/lib/actions/auth.action";
import { 
  User, Mail, Phone, Github, Linkedin, Twitter, 
  Edit3, Save, X, Camera, Lock, ExternalLink, Loader2,
  Plus, FileText, Download, Upload, Cpu, CheckCircle2,
  Eye, EyeOff, Trash2, Eye as ViewIcon, AlertTriangle,
  RefreshCcw, UserCircle2, MoreVertical, Globe
} from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isUploadingResume, setIsUploadingResume] = useState(false);
  const [isDeletingResume, setIsDeletingResume] = useState(false);
  const [isDeletingAvatar, setIsDeletingAvatar] = useState(false);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [showAvatarMenu, setShowAvatarMenu] = useState(false);
  
  // OTP Reset States
  const [resetStep, setResetStep] = useState<"none" | "otp" | "password">("none");
  const [isResetLoading, setIsResetLoading] = useState(false);
  const [otpValue, setOtpValue] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Deletion States
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [deleteStep, setDeleteStep] = useState<"none" | "otp">("none");
  const [deleteOtp, setDeleteOtp] = useState("");
  
  const [formData, setFormData] = useState({
    name: "",
    age: "",
    bio: "",
    phone: "",
    github: "",
    linkedin: "",
    twitter: "",
    skills: [] as string[]
  });

  const [newSkill, setNewSkill] = useState("");

  const dummyAvatar = user ? `https://api.dicebear.com/7.x/initials/svg?seed=${user.name}&backgroundColor=6366f1,4f46e5,4338ca&fontSize=40&fontWeight=700` : null;

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    setIsLoading(true);
    try {
      const userData = await getCurrentUser();
      if (userData) {
        setUser(userData);
        setFormData({
          name: userData.name || "",
          age: userData.age || "",
          bio: userData.bio || "",
          phone: userData.phone || "",
          github: userData.github || "",
          linkedin: userData.linkedin || "",
          twitter: userData.twitter || "",
          skills: userData.skills || []
        });
      }
    } catch (error) {
      console.error("Load user failed", error);
    }
    setIsLoading(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    setIsSaving(true);
    const result = await updateProfile(formData);
    if (result.success) {
      setUser(result.user);
      setIsEditing(false);
      toast.success("Profile updated");
    } else {
      toast.error(result.message);
    }
    setIsSaving(false);
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setIsUploading(true);
      setShowAvatarMenu(false);
      const file = e.target.files[0];
      const formData = new FormData();
      formData.append("avatar", file);
      
      try {
        const result = await updateAvatar(formData);
        if (result.success) {
          setUser(result.user);
          toast.success("Avatar updated");
        } else {
          toast.error(result.message);
        }
      } catch (err) {
        toast.error("Upload failed");
      } finally {
        setIsUploading(false);
      }
    }
  };

  const handleDeleteAvatar = async () => {
    if (!confirm("Remove profile picture?")) return;
    setIsDeletingAvatar(true);
    setShowAvatarMenu(false);
    try {
      const result = await deleteAvatar();
      if (result.success) {
        setUser(result.user);
        toast.success("Avatar removed");
      } else {
        toast.error(result.message);
      }
    } catch (err) {
      toast.error("Delete failed");
    } finally {
      setIsDeletingAvatar(false);
    }
  };

  const handleResumeChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setIsUploadingResume(true);
      const file = e.target.files[0];
      const formData = new FormData();
      formData.append("resume", file);
      
      try {
        const result = await updateResume(formData);
        if (result.success) {
          setUser(result.user);
          toast.success("Resume uploaded");
        } else {
          toast.error(result.message);
        }
      } catch (err) {
        toast.error("Resume upload failed");
      } finally {
        setIsUploadingResume(false);
      }
    }
  };

  const handleDeleteResume = async () => {
    if (!confirm("Delete resume?")) return;
    setIsDeletingResume(true);
    try {
      const result = await deleteResume();
      if (result.success) {
        setUser(result.user);
        toast.success("Resume deleted");
      } else {
        toast.error(result.message);
      }
    } catch (err) {
      toast.error("Resume deletion failed");
    } finally {
      setIsDeletingResume(false);
    }
  };

  const handleAddSkill = () => {
    if (newSkill.trim() && !formData.skills.includes(newSkill.trim())) {
      setFormData({ ...formData, skills: [...formData.skills, newSkill.trim()] });
      setNewSkill("");
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setFormData({ ...formData, skills: formData.skills.filter(s => s !== skillToRemove) });
  };

  // --- Password Reset ---
  const handleStartReset = async () => {
    setIsResetLoading(true);
    const result = await forgotPassword(user.email);
    if (result.success) { setResetStep("otp"); toast.success("OTP sent"); } else { toast.error(result.message); }
    setIsResetLoading(false);
  };

  const handleVerifyOTP = async () => {
    setIsResetLoading(true);
    const result = await verifyOTP(user.email, otpValue);
    if (result.success) { setResetStep("password"); toast.success("Verified"); } else { toast.error(result.message); }
    setIsResetLoading(false);
  };

  const handleFinalReset = async () => {
    if (newPassword !== confirmPassword) { toast.error("Passwords mismatch"); return; }
    setIsResetLoading(true);
    const result = await resetPassword({ email: user.email, otp: otpValue, password: newPassword });
    if (result.success) { setResetStep("none"); toast.success("Success"); } else { toast.error(result.message); }
    setIsResetLoading(false);
  };

  // --- Account Deletion ---
  const handleStartDelete = async () => {
    setIsDeletingAccount(true);
    try {
      const result = await requestDeleteOTP();
      if (result.success) { setDeleteStep("otp"); toast.success("Security code sent"); } else { toast.error(result.message || "Email service error."); }
    } catch (err) { toast.error("Request failed"); }
    finally { setIsDeletingAccount(false); }
  };

  const handleConfirmDelete = async () => {
    setIsDeletingAccount(true);
    try {
      const result = await confirmDeleteAccount(deleteOtp);
      if (result.success) { toast.success("Account deleted"); setTimeout(() => window.location.href = "/", 2000); } else { toast.error(result.message); }
    } catch (err) { toast.error("Confirmation failed"); }
    finally { setIsDeletingAccount(false); }
  };

  if (isLoading) return <div className="flex items-center justify-center min-h-screen"><Loader2 className="w-8 h-8 animate-spin text-purple-600" /></div>;

  return (
    <div className="max-w-4xl mx-auto px-6 pb-6 space-y-8 relative">
      {/* Avatar Preview Modal */}
      {showAvatarModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-2xl p-4 animate-fadeIn" onClick={() => setShowAvatarModal(false)}>
          <div className="relative max-w-2xl w-full flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setShowAvatarModal(false)} className="absolute -top-12 right-0 p-3 bg-dark-100 hover:bg-destructive-100 text-white rounded-full transition-all shadow-xl group"> <X className="w-6 h-6 group-hover:scale-110" /> </button>
            <div className="w-full aspect-square relative rounded-3xl overflow-hidden border-4 border-dark-200 shadow-2xl bg-dark-100">
              <Image src={user?.avatar || dummyAvatar!} alt="Profile Preview" fill className="object-cover" unoptimized />
            </div>
          </div>
        </div>
      )}

      {/* Security Modals */}
      {(resetStep !== "none" || deleteStep !== "none") && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="bg-dark-100 border border-dark-200 rounded-3xl p-8 max-w-md w-full shadow-2xl space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold text-light-100 flex items-center gap-2">
                {deleteStep !== "none" ? <><AlertTriangle className="w-5 h-5 text-destructive-100" /> Confirm Deletion</> : resetStep === "otp" ? "Verify OTP" : "Set New Password"}
              </h3>
              <button onClick={() => { setResetStep("none"); setDeleteStep("none"); }} className="p-2 hover:bg-dark-200 rounded-lg"><X className="w-5 h-5 text-light-400" /></button>
            </div>
            {deleteStep === "otp" && ( <div className="space-y-4"> <p className="text-destructive-100/80 text-sm">Enter code sent to <b>{user.email}</b>.</p> <input type="text" maxLength={6} value={deleteOtp} onChange={(e) => setDeleteOtp(e.target.value)} className="w-full bg-dark-200 border border-dark-200 rounded-xl px-4 py-4 text-center text-2xl font-bold text-destructive-100 focus:outline-none" placeholder="000000" /> <button onClick={handleConfirmDelete} disabled={isDeletingAccount || deleteOtp.length !== 6} className="w-full py-4 bg-destructive-100 text-white rounded-xl font-bold flex items-center justify-center gap-2" > {isDeletingAccount ? <Loader2 className="w-5 h-5 animate-spin" /> : <Trash2 className="w-5 h-5" />} Delete Permanently </button> </div> )}
            {resetStep === "otp" && ( <div className="space-y-4"> <p className="text-light-400 text-sm">Enter code.</p> <input type="text" maxLength={6} value={otpValue} onChange={(e) => setOtpValue(e.target.value)} className="w-full bg-dark-200 border border-dark-200 rounded-xl px-4 py-4 text-center text-2xl font-bold" /> <button onClick={handleVerifyOTP} disabled={isResetLoading || otpValue.length !== 6} className="w-full py-4 bg-purple-600 text-white rounded-xl font-bold" > Verify </button> </div> )}
            {resetStep === "password" && ( <div className="space-y-4"> <p className="text-light-400 text-sm">Set password.</p> <div className="space-y-4"> <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full bg-dark-200 px-4 py-3 rounded-xl" placeholder="New Password" /> <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full bg-dark-200 px-4 py-3 rounded-xl" placeholder="Confirm" /> </div> <button onClick={handleFinalReset} disabled={isResetLoading} className="w-full py-4 bg-success-100 text-white rounded-xl font-bold" > Update </button> </div> )}
          </div>
        </div>
      )}

      {/* Floating Avatar Header */}
      <div className="relative -mt-0">
        <div className="w-full h-48 bg-gradient-to-r from-purple-600/30 via-blue-600/20 to-purple-600/30 rounded-t-3xl border-x border-t border-dark-200 relative overflow-hidden" />

        <div className="bg-dark-100 border-x border-b border-dark-200 rounded-b-3xl p-8 shadow-xl relative">
          <div className="flex flex-col md:flex-row items-center md:items-end gap-6 -mt-24">
            <div className="relative group">
              <div className="w-40 h-40 rounded-full overflow-hidden border-8 border-dark-100 shadow-2xl relative bg-dark-200 flex items-center justify-center cursor-pointer" onClick={() => setShowAvatarMenu(!showAvatarMenu)} >
                <Image src={user?.avatar || dummyAvatar!} alt={user?.name} fill className="object-cover" />
                {(isUploading || isDeletingAvatar) && <div className="absolute inset-0 bg-black/60 flex items-center justify-center"> <Loader2 className="w-8 h-8 animate-spin text-white" /> </div>}
              </div>
              {showAvatarMenu && (
                <div className="absolute top-0 -right-48 w-44 bg-dark-100 border border-dark-200 rounded-2xl shadow-2xl p-2 z-50 animate-fadeIn">
                  <div className="flex flex-col gap-1">
                    <button onClick={() => { setShowAvatarModal(true); setShowAvatarMenu(false); }} className="flex items-center gap-3 w-full px-4 py-3 hover:bg-dark-200 rounded-xl text-sm font-bold text-light-100"> <Eye className="w-4 h-4 text-purple-600" /> View Image </button>
                    <label className="flex items-center gap-3 w-full px-4 py-3 hover:bg-dark-200 rounded-xl text-sm font-bold text-light-100 cursor-pointer"> <Camera className="w-4 h-4 text-success-100" /> Replace <input type="file" className="hidden" onChange={handleAvatarChange} accept="image/*" /> </label>
                    {user?.avatar && <button onClick={handleDeleteAvatar} className="flex items-center gap-3 w-full px-4 py-3 hover:bg-destructive-100/10 hover:text-destructive-100 rounded-xl text-sm font-bold text-light-400"> <Trash2 className="w-4 h-4" /> Remove </button>}
                  </div>
                </div>
              )}
              <button onClick={() => setShowAvatarMenu(!showAvatarMenu)} className="absolute bottom-1 right-1 p-2.5 bg-purple-600 rounded-full shadow-xl border-4 border-dark-100 hover:scale-110 transition-transform"> <MoreVertical className="w-4 h-4 text-white" /> </button>
            </div>
            <div className="flex-1 text-center md:text-left space-y-2 pb-2">
              <h1 className="text-3xl font-extrabold text-light-100 tracking-tight">{user?.name}</h1>
              <p className="text-light-400 font-medium flex items-center justify-center md:justify-start gap-2"> <Mail className="w-4 h-4 text-purple-600" /> {user?.email} </p>
            </div>
            <div className="pb-2">
              <button onClick={() => isEditing ? handleSave() : setIsEditing(true)} disabled={isSaving} className={`px-8 py-3 rounded-2xl font-bold transition-all shadow-lg ${isEditing ? "bg-success-100 text-white" : "bg-purple-600 text-white"}`} >
                {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : (isEditing ? <Save className="w-5 h-5" /> : <Edit3 className="w-5 h-5" />)}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-6">
          <div className="bg-dark-100 rounded-3xl border border-dark-200 p-8 space-y-6">
            <h3 className="text-xl font-bold text-light-100 flex items-center gap-2"> <User className="w-5 h-5 text-purple-600" /> Bio </h3>
            {isEditing ? <textarea name="bio" value={formData.bio} onChange={handleInputChange} className="w-full bg-dark-200 border border-dark-200 rounded-xl p-4 text-light-100 min-h-[150px] focus:outline-none" /> : <p className="text-light-400 leading-relaxed italic"> {user?.bio || "No bio added."} </p>}
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-1"><p className="text-xs text-light-400 uppercase font-bold tracking-wider">Full Name</p>{isEditing ? <input name="name" value={formData.name} onChange={handleInputChange} className="w-full bg-dark-200 border border-dark-200 rounded-lg px-3 py-2 text-light-100" /> : <p className="text-light-100 font-medium">{user?.name}</p>}</div>
              <div className="space-y-1"><p className="text-xs text-light-400 uppercase font-bold tracking-wider">Age</p>{isEditing ? <input name="age" type="number" value={formData.age} onChange={handleInputChange} className="w-full bg-dark-200 border border-dark-200 rounded-lg px-3 py-2 text-light-100" /> : <p className="text-light-100 font-medium">{user?.age || "N/A"}</p>}</div>
            </div>
          </div>
          <div className="bg-dark-100 rounded-3xl border border-dark-200 p-8 space-y-6">
            <h3 className="text-xl font-bold text-light-100 flex items-center gap-2"> <Cpu className="w-5 h-5 text-purple-600" /> Skills </h3>
            {isEditing && <div className="flex gap-2"> <input value={newSkill} onChange={(e) => setNewSkill(e.target.value)} onKeyPress={(e) => e.key === "Enter" && handleAddSkill()} className="flex-1 bg-dark-200 border border-dark-200 rounded-xl px-4 py-2" /> <button onClick={handleAddSkill} className="p-2 bg-purple-600 rounded-xl"><Plus className="w-5 h-5" /></button> </div>}
            <div className="flex flex-wrap gap-3"> {formData.skills.map((skill) => ( <div key={skill} className="px-4 py-2 bg-dark-200 border border-dark-200 rounded-full text-light-100 text-sm flex items-center gap-2"> {skill} {isEditing && <X className="w-3 h-3 cursor-pointer" onClick={() => handleRemoveSkill(skill)} />} </div> ))} </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-dark-100 rounded-3xl border border-dark-200 p-8 space-y-6">
            <h3 className="text-xl font-bold text-light-100 flex items-center gap-2"> <FileText className="w-5 h-5 text-purple-600" /> Resume </h3>
            {isUploadingResume || isDeletingResume ? <Loader2 className="w-8 h-8 animate-spin text-purple-600 mx-auto" /> : user?.resume ? (
              <div className="space-y-4">
                <div className="p-4 bg-dark-200 rounded-2xl border border-dark-200 flex flex-col gap-4">
                  <p className="text-sm font-bold text-light-100 truncate">{user.resumeName || "Resume.pdf"}</p>
                  <div className="grid grid-cols-2 gap-2">
                    <a href={user.resume} target="_blank" className="flex items-center justify-center gap-2 py-2 bg-dark-100 rounded-xl text-xs font-bold text-light-100"><ViewIcon className="w-3.5 h-3.5" /> View</a>
                    <button onClick={handleDeleteResume} className="flex items-center justify-center gap-2 py-2 bg-destructive-100/10 text-destructive-100 rounded-xl text-xs font-bold"><Trash2 className="w-3.5 h-3.5" /> Delete</button>
                  </div>
                </div>
              </div>
            ) : (
              <label className="w-full flex flex-col items-center py-10 bg-dark-200 border-2 border-dashed border-dark-300 rounded-3xl cursor-pointer"> <Upload className="w-8 h-8 text-light-400" /> <input type="file" className="hidden" onChange={handleResumeChange} accept=".pdf" /> </label>
            )}
          </div>
          <div className="bg-dark-100 rounded-3xl border border-dark-200 p-8 space-y-6">
            <h3 className="text-xl font-bold text-light-100 flex items-center gap-2"> <Globe className="w-5 h-5 text-purple-600" /> Socials </h3>
            <div className="flex flex-col gap-4">
              {isEditing ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 bg-dark-200 p-3 rounded-xl border border-dark-200">
                    <Github className="w-5 h-5 text-light-100" />
                    <input name="github" value={formData.github} onChange={handleInputChange} placeholder="GitHub URL" className="bg-transparent flex-1 text-sm focus:outline-none" />
                  </div>
                  <div className="flex items-center gap-3 bg-dark-200 p-3 rounded-xl border border-dark-200">
                    <Linkedin className="w-5 h-5 text-blue-500" />
                    <input name="linkedin" value={formData.linkedin} onChange={handleInputChange} placeholder="LinkedIn URL" className="bg-transparent flex-1 text-sm focus:outline-none" />
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-4">
                  {user?.github && (
                    <a 
                      href={user.github} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="p-4 bg-dark-200 rounded-2xl hover:bg-dark-300 transition-all border border-dark-200 group hover:scale-105 active:scale-95"
                      title="GitHub Profile"
                    >
                      <Github className="w-6 h-6 text-light-100 group-hover:text-purple-600 transition-colors" />
                    </a>
                  )}
                  {user?.linkedin && (
                    <a 
                      href={user.linkedin} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="p-4 bg-dark-200 rounded-2xl hover:bg-dark-300 transition-all border border-dark-200 group hover:scale-105 active:scale-95"
                      title="LinkedIn Profile"
                    >
                      <Linkedin className="w-6 h-6 text-blue-500 group-hover:text-blue-400 transition-colors" />
                    </a>
                  )}
                  {!user?.github && !user?.linkedin && <p className="text-sm text-light-400 italic">No social links added.</p>}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 pb-12">
        <div className="bg-dark-100 rounded-3xl border border-dark-200 p-8 flex flex-col justify-between h-48">
          <h3 className="text-xl font-bold text-light-100 flex items-center gap-2"> <Lock className="w-5 h-5 text-purple-600" /> Security </h3>
          <button onClick={handleStartReset} disabled={isResetLoading} className="w-full py-4 bg-dark-200 border border-dark-200 rounded-xl font-bold text-light-100 hover:bg-dark-300 transition-all" > Reset Password </button>
        </div>
        <div className="bg-destructive-100/5 rounded-3xl border border-destructive-100/20 p-8 flex flex-col justify-between h-48 relative overflow-hidden">
          <div className="space-y-2">
            <h3 className="text-xl font-bold text-destructive-100 flex items-center gap-2"> <AlertTriangle className="w-5 h-5" /> Danger Zone </h3>
            <p className="text-xs text-destructive-100/80 font-bold uppercase tracking-widest animate-pulse">Warning: This action is permanent!</p>
          </div>
          <button onClick={handleStartDelete} disabled={isDeletingAccount} className="w-full py-4 bg-destructive-100 hover:bg-destructive-100/80 text-white rounded-xl font-bold shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95" >
            {isDeletingAccount ? <Loader2 className="w-5 h-5 animate-spin" /> : <Trash2 className="w-5 h-5" />}
            {isDeletingAccount ? "Requesting..." : "Delete Account"}
          </button>
        </div>
      </div>
    </div>
  );
}
