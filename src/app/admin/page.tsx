"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Shield,
  Lock,
  Unlock,
  Upload,
  Save,
  Plus,
  Trash2,
  ExternalLink,
  Check,
  AlertCircle,
  Loader2,
  User,
  Briefcase,
  Cpu,
  Mail,
  Key,
  ArrowLeft,
  Image as ImageIcon,
  Film,
  Sparkles,
  Smartphone,
  Star,
  Quote,
  Eye,
  Download,
  FileText,
  Clock,
  Sliders,
  CheckCircle2,
} from "lucide-react";
import {
  PortfolioData,
  Project,
  Skill,
  Service,
  Testimonial,
  ContactMessage,
} from "@/lib/portfolio";

export default function AdminPage() {
  const [pinInput, setPinInput] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authError, setAuthError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Active Tab
  const [activeTab, setActiveTab] = useState<
    "projects" | "profile" | "services" | "skills" | "testimonials" | "messages" | "security"
  >("projects");

  // Portfolio Data state
  const [data, setData] = useState<PortfolioData | null>(null);
  const [adminPin, setAdminPin] = useState("rajob2026");
  const [newPin, setNewPin] = useState("");
  const [avatarTimestamp, setAvatarTimestamp] = useState(Date.now());

  // Uploading states
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [uploadingThumb, setUploadingThumb] = useState(false);

  // Project Modal / Edit Form state
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [isProjectFormOpen, setIsProjectFormOpen] = useState(false);

  // New tag input
  const [tagInput, setTagInput] = useState("");

  // Check saved session PIN on mount
  useEffect(() => {
    const savedPin = sessionStorage.getItem("admin_pin");
    if (savedPin) {
      verifyPin(savedPin);
    } else {
      setLoading(false);
    }
  }, []);

  const showToast = (type: "success" | "error", text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const verifyPin = async (pinToTest: string) => {
    setLoading(true);
    setAuthError("");
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin: pinToTest }),
      });
      const result = await res.json();
      if (res.ok && result.authorized) {
        setIsAuthenticated(true);
        setAdminPin(pinToTest);
        sessionStorage.setItem("admin_pin", pinToTest);
        await loadData(pinToTest);
      } else {
        setAuthError(result.error || "ভুল পিন দিয়েছেন! আবার চেষ্টা করুন।");
        sessionStorage.removeItem("admin_pin");
      }
    } catch (err) {
      setAuthError("লগইন করতে সমস্যা হয়েছে।");
    } finally {
      setLoading(false);
    }
  };

  const loadData = async (pin?: string) => {
    try {
      const activePin = pin || adminPin || "rajob2026";
      const res = await fetch("/api/portfolio");
      const d = await res.json();

      // Fetch messages as well
      const msgRes = await fetch(`/api/messages?pin=${encodeURIComponent(activePin)}`);
      const msgData = await msgRes.json();

      setData({
        ...d,
        messages: msgData.messages || [],
      });
    } catch (err) {
      showToast("error", "ডাটা লোড করতে ব্যর্থ হয়েছে!");
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem("admin_pin");
    setIsAuthenticated(false);
    setAdminPin("");
    setPinInput("");
  };

  // Generic Save Handler to API
  const handleSave = async (updatedData: PortfolioData, pinToUse?: string) => {
    setSaving(true);
    try {
      const currentPin = pinToUse || adminPin || "rajob2026";
      const res = await fetch("/api/portfolio", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...updatedData,
          pin: currentPin,
          newPin: newPin.trim() ? newPin.trim() : undefined,
        }),
      });

      const result = await res.json();
      if (res.ok && result.success) {
        showToast("success", "সকল পরিবর্তন সফলভাবে সেভ হয়েছে!");
        if (newPin.trim()) {
          setAdminPin(newPin.trim());
          sessionStorage.setItem("admin_pin", newPin.trim());
          setNewPin("");
        }
        await loadData(newPin.trim() || currentPin);
      } else {
        showToast("error", result.error || "সেভ করা সম্ভব হয়নি!");
      }
    } catch (err) {
      showToast("error", "সার্ভার এরর! দয়া করে আবার চেষ্টা করুন।");
    } finally {
      setSaving(false);
    }
  };

  // Avatar Upload
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !data) return;

    setUploadingAvatar(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const result = await res.json();

      if (res.ok && result.url) {
        const updated = {
          ...data,
          profile: {
            ...data.profile,
            avatar: result.url,
          },
        };
        setData(updated);
        setAvatarTimestamp(Date.now());
        await handleSave(updated);
        showToast("success", "প্রোফাইল ছবি সফলভাবে আপডেট হয়েছে!");
      } else {
        showToast("error", result.error || "ছবি আপলোড ব্যর্থ হয়েছে!");
      }
    } catch (err) {
      showToast("error", "ছবি আপলোডে এরর দেখা দিয়েছে!");
    } finally {
      setUploadingAvatar(false);
    }
  };

  // Media (Video or Photo) Upload for Project
  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingProject) return;

    setUploadingMedia(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const result = await res.json();

      if (res.ok && result.url) {
        // Auto-populate Title if empty from filename
        const cleanName = file.name
          .replace(/\.[^/.]+$/, "")
          .replace(/[_-]/g, " ")
          .replace(/\b\w/g, (c) => c.toUpperCase());

        setEditingProject({
          ...editingProject,
          title: editingProject.title ? editingProject.title : cleanName,
          mediaUrl: result.url,
          mediaType: result.mediaType === "video" ? "video" : "image",
          thumbnail: editingProject.thumbnail || (result.mediaType === "image" ? result.url : ""),
        });
        showToast("success", "মিডিয়া ফাইল আপলোড হয়েছে! নিচে প্রিভিউ দেখুন এবং প্রজেক্ট সংরক্ষণ করুন।");
      } else {
        showToast("error", result.error || "মিডিয়া আপলোড ব্যর্থ হয়েছে!");
      }
    } catch (err) {
      showToast("error", "মিডিয়া আপলোডে এরর হয়েছে!");
    } finally {
      setUploadingMedia(false);
    }
  };

  // Thumbnail Upload for Project
  const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingProject) return;

    setUploadingThumb(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const result = await res.json();

      if (res.ok && result.url) {
        setEditingProject({
          ...editingProject,
          thumbnail: result.url,
        });
        showToast("success", "কভার থাম্বনেইল সফলভাবে আপলোড হয়েছে!");
      } else {
        showToast("error", result.error || "থাম্বনেইল আপলোড ব্যর্থ হয়েছে!");
      }
    } catch (err) {
      showToast("error", "থাম্বনেইল আপলোডে সমস্যা হয়েছে!");
    } finally {
      setUploadingThumb(false);
    }
  };

  // Project Management Functions
  const handleOpenAddProject = () => {
    setEditingProject({
      id: "proj-" + Date.now(),
      title: "",
      category: "Video Editing",
      mediaType: "video",
      mediaUrl: "",
      thumbnail: "",
      description: "",
      client: "",
      year: new Date().getFullYear().toString(),
      duration: "01:00",
      tags: ["Premiere Pro", "DaVinci Resolve"],
      featured: true,
    });
    setTagInput("");
    setIsProjectFormOpen(true);
  };

  const handleEditProject = (proj: Project) => {
    setEditingProject({ ...proj });
    setTagInput("");
    setIsProjectFormOpen(true);
  };

  const handleDeleteProject = async (id: string) => {
    if (!data) return;
    if (!confirm("আপনি কি নিশ্চিত এই প্রজেক্টটি ডিলিট করতে চান?")) return;

    const updatedProjects = data.projects.filter((p) => p.id !== id);
    const updated = { ...data, projects: updatedProjects };
    setData(updated);
    await handleSave(updated);
    showToast("success", "প্রজেক্টটি ডিলিট করা হয়েছে!");
  };

  const handleSaveProjectForm = async () => {
    if (!data || !editingProject) return;
    if (!editingProject.title.trim()) {
      showToast("error", "প্রজেক্টের একটি নাম বা টাইটেল দিন!");
      return;
    }
    if (!editingProject.mediaUrl) {
      showToast("error", "অনুগ্রহ করে কোনো ভিডিও/ফটো ফাইল আপলোড করুন অথবা লিংক দিন!");
      return;
    }

    let updatedProjects: Project[];
    const exists = data.projects.some((p) => p.id === editingProject.id);

    if (exists) {
      updatedProjects = data.projects.map((p) =>
        p.id === editingProject.id ? editingProject : p
      );
    } else {
      updatedProjects = [editingProject, ...data.projects];
    }

    const updated = { ...data, projects: updatedProjects };
    setData(updated);
    setIsProjectFormOpen(false);
    await handleSave(updated);
    showToast("success", "প্রজেক্ট সফলভাবে সেভ করা হয়েছে!");
  };

  const handleAddTag = () => {
    if (!editingProject || !tagInput.trim()) return;
    if (!editingProject.tags.includes(tagInput.trim())) {
      setEditingProject({
        ...editingProject,
        tags: [...editingProject.tags, tagInput.trim()],
      });
    }
    setTagInput("");
  };

  const handleRemoveTag = (tagToRemove: string) => {
    if (!editingProject) return;
    setEditingProject({
      ...editingProject,
      tags: editingProject.tags.filter((t) => t !== tagToRemove),
    });
  };

  // Delete message
  const handleDeleteMessage = async (id: string) => {
    if (!confirm("আপনি কি এই মেসেজটি মুছে ফেলতে চান?")) return;
    try {
      const res = await fetch("/api/messages", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin: adminPin, id }),
      });
      if (res.ok) {
        if (data) {
          setData({
            ...data,
            messages: data.messages.filter((m) => m.id !== id),
          });
        }
        showToast("success", "মেসেজটি ডিলিট করা হয়েছে!");
      }
    } catch (err) {
      showToast("error", "মেসেজ ডিলিট করতে সমস্যা হয়েছে।");
    }
  };

  // Export JSON Backup
  const handleExportBackup = () => {
    if (!data) return;
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `rajob-portfolio-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast("success", "ব্যাকআপ ফাইল ডাউনলোড হয়েছে!");
  };

  // Import JSON Backup
  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const parsed = JSON.parse(evt.target?.result as string);
        if (parsed.profile && parsed.projects) {
          setData(parsed);
          await handleSave(parsed);
          showToast("success", "ব্যাকআপ সফলভাবে রিস্টোর হয়েছে!");
        } else {
          showToast("error", "ভুল ফরম্যাটের ব্যাকআপ ফাইল!");
        }
      } catch (err) {
        showToast("error", "ফাইল রিড করতে সমস্যা হয়েছে!");
      }
    };
    reader.readAsText(file);
  };

  // Loading Screen
  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 text-amber-500 animate-spin mb-3" />
        <p className="text-stone-600 text-sm font-semibold">
          অ্যাডমিন স্টুডিও লোড হচ্ছে...
        </p>
      </div>
    );
  }

  // LOGIN SCREEN
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-3xl p-8 sm:p-10 border border-[#E8E4DA] shadow-xl text-center space-y-6">
          
          <div className="w-16 h-16 rounded-2xl bg-amber-400 text-stone-950 flex items-center justify-center mx-auto shadow-lg shadow-amber-400/20 border border-amber-300">
            <Lock className="w-8 h-8" />
          </div>

          <div>
            <h1 className="text-2xl font-black text-stone-900 tracking-tight">
              স্টুডিও অ্যাডমিন প্যানেল
            </h1>
            <p className="text-xs sm:text-sm text-stone-500 mt-1">
              Md Rajob Ali // Creative Content Desk
            </p>
          </div>

          {authError && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center justify-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{authError}</span>
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              verifyPin(pinInput);
            }}
            className="space-y-4"
          >
            <div className="text-left space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-stone-700">
                মাস্টার অ্যাডমিন পিন (Master PIN)
              </label>
              <input
                type="password"
                placeholder="পিন টাইপ করুন (default: rajob2026)"
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                autoFocus
                className="w-full px-4 py-3.5 rounded-xl bg-stone-50 border border-stone-200 text-stone-900 focus:outline-none focus:border-amber-500 focus:bg-white text-center text-lg tracking-widest font-mono transition-colors"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3.5 rounded-xl bg-amber-400 text-stone-950 font-black text-sm uppercase tracking-wider hover:bg-amber-300 transition-all shadow-md shadow-amber-400/20 cursor-pointer"
            >
              আনলক করুন (Unlock Studio)
            </button>
          </form>

          <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-xs text-stone-400">
            <Link
              href="/"
              className="hover:text-stone-900 transition-colors flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>মূল ওয়েবসাইটে ফিরে যান</span>
            </Link>
            <span>পাসকোড সুরক্ষিত 🔒</span>
          </div>

        </div>
      </div>
    );
  }

  // AUTHENTICATED ADMIN DASHBOARD
  return (
    <div className="min-h-screen bg-[#FAF8F5] text-stone-900 font-sans">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed top-5 right-5 z-50 px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 text-xs font-bold transition-all animate-in fade-in slide-in-from-top-4 ${
            toastMessage.type === "success"
              ? "bg-stone-900 text-amber-300 border border-amber-400/40"
              : "bg-rose-600 text-white"
          }`}
        >
          {toastMessage.type === "success" ? (
            <Check className="w-4 h-4 text-amber-400" />
          ) : (
            <AlertCircle className="w-4 h-4" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Top Admin Header */}
      <header className="bg-white border-b border-[#E8E4DA] sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-400 text-stone-950 font-black flex items-center justify-center text-sm shadow-sm border border-amber-300">
              RA
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-black text-stone-900 uppercase">
                  Studio Admin Center
                </h1>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase">
                  Live
                </span>
                {(data as any)?.firebaseConnected ? (
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 text-[10px] font-black uppercase flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                    <span>Firebase Cloud Active</span>
                  </span>
                ) : (
                  <span
                    className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-bold uppercase flex items-center gap-1"
                    title="Netlify-তে পার্মানেন্ট ডাটার জন্য Firebase কানেক্ট করতে পারবেন"
                  >
                    <span>💾 Local Mode (Firebase Ready)</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-stone-500">
                কন্টেন্ট, ভিডিও ও ফটো কন্ট্রোল প্যানেল
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              target="_blank"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-stone-100 hover:bg-amber-100 text-stone-700 hover:text-amber-900 font-bold text-xs transition-colors"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>লাইভ সাইট দেখুন</span>
            </Link>

            <button
              onClick={handleLogout}
              className="px-3.5 py-2 rounded-xl border border-stone-200 text-stone-600 hover:text-rose-600 hover:border-rose-200 text-xs font-bold transition-colors cursor-pointer"
            >
              লগআউট
            </button>
          </div>

        </div>

        {/* Tab Navigation */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-1 overflow-x-auto no-scrollbar border-t border-stone-100 pt-1">
          <button
            onClick={() => setActiveTab("projects")}
            className={`px-5 py-3 text-xs font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === "projects"
                ? "border-amber-500 text-amber-700 bg-amber-50/50"
                : "border-transparent text-stone-600 hover:text-stone-900"
            }`}
          >
            <Film className="w-4 h-4" />
            <span>প্রজেক্ট ও ভিডিও আপলোড ({data?.projects?.length || 0})</span>
          </button>

          <button
            onClick={() => setActiveTab("profile")}
            className={`px-5 py-3 text-xs font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === "profile"
                ? "border-amber-500 text-amber-700 bg-amber-50/50"
                : "border-transparent text-stone-600 hover:text-stone-900"
            }`}
          >
            <User className="w-4 h-4" />
            <span>প্রোফাইল ও ছবি</span>
          </button>

          <button
            onClick={() => setActiveTab("services")}
            className={`px-5 py-3 text-xs font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === "services"
                ? "border-amber-500 text-amber-700 bg-amber-50/50"
                : "border-transparent text-stone-600 hover:text-stone-900"
            }`}
          >
            <Briefcase className="w-4 h-4" />
            <span>সার্ভিসসমূহ ({data?.services?.length || 0})</span>
          </button>

          <button
            onClick={() => setActiveTab("skills")}
            className={`px-5 py-3 text-xs font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === "skills"
                ? "border-amber-500 text-amber-700 bg-amber-50/50"
                : "border-transparent text-stone-600 hover:text-stone-900"
            }`}
          >
            <Cpu className="w-4 h-4" />
            <span>টুলস্ট্যাক ও এআই</span>
          </button>

          <button
            onClick={() => setActiveTab("testimonials")}
            className={`px-5 py-3 text-xs font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === "testimonials"
                ? "border-amber-500 text-amber-700 bg-amber-50/50"
                : "border-transparent text-stone-600 hover:text-stone-900"
            }`}
          >
            <Quote className="w-4 h-4" />
            <span>রিভিউ ও প্রশংসাপত্র ({data?.testimonials?.length || 0})</span>
          </button>

          <button
            onClick={() => setActiveTab("messages")}
            className={`px-5 py-3 text-xs font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === "messages"
                ? "border-amber-500 text-amber-700 bg-amber-50/50"
                : "border-transparent text-stone-600 hover:text-stone-900"
            }`}
          >
            <Mail className="w-4 h-4" />
            <span>ইনবক্স মেসেজ ({data?.messages?.length || 0})</span>
          </button>

          <button
            onClick={() => setActiveTab("security")}
            className={`px-5 py-3 text-xs font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === "security"
                ? "border-amber-500 text-amber-700 bg-amber-50/50"
                : "border-transparent text-stone-600 hover:text-stone-900"
            }`}
          >
            <Key className="w-4 h-4" />
            <span>সিকিউরিটি ও ব্যাকআপ</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        
        {/* ===================== TAB 1: PROJECTS & MEDIA UPLOAD ===================== */}
        {activeTab === "projects" && data && (
          <div className="space-y-8">
            
            {/* Header with Add Button */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-[#E8E4DA] shadow-xs">
              <div>
                <h2 className="text-xl font-black text-stone-900">
                  প্রজেক্ট ও ভিডিও গ্যালারি
                </h2>
                <p className="text-xs text-stone-500 mt-1">
                  এখানে আপনি আপনার যেকোনো এডিট করা ভিডিও (MP4, WebM, MOV) বা গ্রাফিক্স ডিজাইন আপলোড ও ম্যানেজ করতে পারবেন।
                </p>
              </div>

              <button
                onClick={handleOpenAddProject}
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-amber-400 text-stone-950 font-black text-xs uppercase tracking-wider hover:bg-amber-300 transition-all shadow-md shadow-amber-400/20 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>+ নতুন ভিডিও বা প্রজেক্ট যোগ করুন</span>
              </button>
            </div>

            {/* Projects List Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {data.projects.map((project) => {
                const isVideo =
                  project.mediaType === "video" ||
                  project.mediaUrl?.endsWith(".mp4") ||
                  project.mediaUrl?.endsWith(".webm") ||
                  project.mediaUrl?.endsWith(".mov");

                return (
                  <div
                    key={project.id}
                    className="bg-white rounded-3xl overflow-hidden border border-[#E8E4DA] shadow-xs flex flex-col justify-between"
                  >
                    <div className="relative h-48 bg-stone-950 overflow-hidden">
                      {project.thumbnail ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={project.thumbnail}
                          alt={project.title}
                          className="w-full h-full object-cover"
                        />
                      ) : isVideo && project.mediaUrl ? (
                        <video
                          src={project.mediaUrl}
                          preload="metadata"
                          muted
                          playsInline
                          className="w-full h-full object-cover pointer-events-none"
                        />
                      ) : (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={project.mediaUrl || "https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=800"}
                          alt={project.title}
                          className="w-full h-full object-cover"
                        />
                      )}

                      <div className="absolute top-3 left-3 px-2.5 py-1 rounded-md bg-stone-950/80 text-amber-300 text-[10px] font-black uppercase">
                        {project.category}
                      </div>

                      {isVideo && (
                        <div className="absolute bottom-3 right-3 px-2 py-0.5 rounded-md bg-amber-400 text-stone-950 text-[10px] font-black flex items-center gap-1">
                          <Film className="w-3 h-3" />
                          <span>ভিডিও</span>
                        </div>
                      )}
                    </div>

                    <div className="p-5 flex-1 flex flex-col justify-between">
                      <div>
                        <h3 className="font-extrabold text-stone-900 text-base line-clamp-1">
                          {project.title}
                        </h3>
                        <p className="text-xs text-stone-500 line-clamp-2 mt-1">
                          {project.description}
                        </p>
                        <div className="flex flex-wrap gap-1 mt-3">
                          {project.tags?.map((t, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 rounded bg-stone-100 text-stone-600 text-[10px] font-semibold"
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="pt-4 mt-4 border-t border-stone-100 flex items-center justify-between">
                        <span className="text-[11px] font-bold text-stone-400">
                          {project.client || "Client"}
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEditProject(project)}
                            className="px-3 py-1.5 rounded-lg bg-amber-50 text-amber-900 hover:bg-amber-100 text-xs font-bold transition-colors cursor-pointer"
                          >
                            এডিট
                          </button>
                          <button
                            onClick={() => handleDeleteProject(project.id)}
                            className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            title="ডিলিট"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

          </div>
        )}

        {/* ===================== TAB 2: PROFILE & BIO ===================== */}
        {activeTab === "profile" && data && (
          <div className="max-w-4xl mx-auto bg-white rounded-3xl p-8 border border-[#E8E4DA] shadow-xs space-y-8">
            <div>
              <h2 className="text-xl font-black text-stone-900">
                প্রোফাইল ও বায়ো ইনফরমেশন
              </h2>
              <p className="text-xs text-stone-500 mt-0.5">
                আপনার নাম, ছবি, সোশ্যাল লিংক এবং পরিসংখ্যান আপডেট করুন।
              </p>
            </div>

            {/* Avatar Uploader Section */}
            <div className="flex flex-col sm:flex-row items-center gap-6 p-6 rounded-2xl bg-[#FAF8F5] border border-stone-200">
              <div className="relative w-28 h-28 rounded-2xl overflow-hidden bg-stone-200 border-2 border-amber-400 shadow-md">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={
                    data.profile.avatar
                      ? `${data.profile.avatar}?t=${avatarTimestamp}`
                      : "/uploads/placeholder.jpg"
                  }
                  alt={data.profile.name}
                  className="w-full h-full object-cover object-top"
                  onError={(e) => {
                    // Fallback to placeholder if not loaded yet
                    (e.target as HTMLImageElement).src =
                      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400";
                  }}
                />
              </div>

              <div className="space-y-2 text-center sm:text-left">
                <h4 className="font-bold text-stone-900 text-sm">
                  প্রোফাইল ছবি পরিবর্তন করুন
                </h4>
                <p className="text-xs text-stone-500 max-w-sm">
                  উচ্চ রেজুলেশনের যেকোনো ছবি (JPG, PNG, WebP) সিলেক্ট করুন। সাইজ অটো অপ্টিমাইজ হয়ে যাবে।
                </p>
                <label className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 text-xs font-black cursor-pointer transition-all shadow-xs">
                  <Upload className="w-4 h-4" />
                  <span>{uploadingAvatar ? "আপলোড হচ্ছে..." : "নতুন ছবি নির্বাচন করুন"}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    disabled={uploadingAvatar}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* Text Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-stone-700">
                  আপনার পূর্ণ নাম *
                </label>
                <input
                  type="text"
                  value={data.profile.name}
                  onChange={(e) =>
                    setData({
                      ...data,
                      profile: { ...data.profile, name: e.target.value },
                    })
                  }
                  className="w-full px-4 py-3 rounded-xl bg-stone-50 border border-stone-200 text-stone-900 focus:outline-none focus:border-amber-500 text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-stone-700">
                  প্রফেশনাল টাইটেল *
                </label>
                <input
                  type="text"
                  value={data.profile.title}
                  onChange={(e) =>
                    setData({
                      ...data,
                      profile: { ...data.profile, title: e.target.value },
                    })
                  }
                  className="w-full px-4 py-3 rounded-xl bg-stone-50 border border-stone-200 text-stone-900 focus:outline-none focus:border-amber-500 text-sm"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-stone-700">
                হিরো হেডলাইন / ট্যাগলাইন
              </label>
              <input
                type="text"
                value={data.profile.tagline || ""}
                onChange={(e) =>
                  setData({
                    ...data,
                    profile: { ...data.profile, tagline: e.target.value },
                  })
                }
                className="w-full px-4 py-3 rounded-xl bg-stone-50 border border-stone-200 text-stone-900 focus:outline-none focus:border-amber-500 text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-stone-700">
                বায়োগ্রাফি (About Me)
              </label>
              <textarea
                rows={4}
                value={data.profile.bio}
                onChange={(e) =>
                  setData({
                    ...data,
                    profile: { ...data.profile, bio: e.target.value },
                  })
                }
                className="w-full px-4 py-3 rounded-xl bg-stone-50 border border-stone-200 text-stone-900 focus:outline-none focus:border-amber-500 text-sm resize-none"
              />
            </div>

            {/* Contact Details */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-2">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-stone-700">
                  ইমেইল অ্যাড্রেস
                </label>
                <input
                  type="email"
                  value={data.profile.email}
                  onChange={(e) =>
                    setData({
                      ...data,
                      profile: { ...data.profile, email: e.target.value },
                    })
                  }
                  className="w-full px-4 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-stone-900 text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-stone-700">
                  ফোন / হোয়াটসঅ্যাপ
                </label>
                <input
                  type="text"
                  value={data.profile.phone}
                  onChange={(e) =>
                    setData({
                      ...data,
                      profile: { ...data.profile, phone: e.target.value, whatsapp: e.target.value },
                    })
                  }
                  className="w-full px-4 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-stone-900 text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-stone-700">
                  লোকেশন
                </label>
                <input
                  type="text"
                  value={data.profile.location}
                  onChange={(e) =>
                    setData({
                      ...data,
                      profile: { ...data.profile, location: e.target.value },
                    })
                  }
                  className="w-full px-4 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-stone-900 text-sm"
                />
              </div>
            </div>

            {/* Stats Editor */}
            <div className="pt-4 border-t border-stone-100">
              <h3 className="font-extrabold text-stone-900 text-sm mb-4">
                পরিসংখ্যান ও মেট্রিক্স (Stats Ticker)
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-stone-500 uppercase">অভিজ্ঞতা</label>
                  <input
                    type="text"
                    value={data.profile.stats?.experience || "5+ Years"}
                    onChange={(e) =>
                      setData({
                        ...data,
                        profile: {
                          ...data.profile,
                          stats: { ...data.profile.stats, experience: e.target.value },
                        },
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg bg-stone-50 border border-stone-200 text-stone-900 text-xs font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-stone-500 uppercase">মোট প্রজেক্ট</label>
                  <input
                    type="text"
                    value={data.profile.stats?.projects || "180+"}
                    onChange={(e) =>
                      setData({
                        ...data,
                        profile: {
                          ...data.profile,
                          stats: { ...data.profile.stats, projects: e.target.value },
                        },
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg bg-stone-50 border border-stone-200 text-stone-900 text-xs font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-stone-500 uppercase">ভিউস জেনারেট</label>
                  <input
                    type="text"
                    value={data.profile.stats?.views || "25M+"}
                    onChange={(e) =>
                      setData({
                        ...data,
                        profile: {
                          ...data.profile,
                          stats: { ...data.profile.stats, views: e.target.value },
                        },
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg bg-stone-50 border border-stone-200 text-stone-900 text-xs font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-stone-500 uppercase">ক্লায়েন্ট</label>
                  <input
                    type="text"
                    value={data.profile.stats?.clients || "45+"}
                    onChange={(e) =>
                      setData({
                        ...data,
                        profile: {
                          ...data.profile,
                          stats: { ...data.profile.stats, clients: e.target.value },
                        },
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg bg-stone-50 border border-stone-200 text-stone-900 text-xs font-bold"
                  />
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="pt-6 border-t border-stone-100 flex justify-end">
              <button
                onClick={() => handleSave(data)}
                disabled={saving}
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-stone-900 text-amber-300 font-extrabold text-sm uppercase tracking-wider hover:bg-stone-800 transition-all shadow-md disabled:opacity-50 cursor-pointer"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin text-amber-400" /> : <Save className="w-4 h-4" />}
                <span>সকল পরিবর্তন সেভ করুন</span>
              </button>
            </div>

          </div>
        )}

        {/* ===================== TAB 3: SERVICES ===================== */}
        {activeTab === "services" && data && (
          <div className="space-y-6">
            <div className="flex items-center justify-between bg-white p-6 rounded-3xl border border-[#E8E4DA]">
              <div>
                <h2 className="text-xl font-black text-stone-900">অফারকৃত সার্ভিসসমূহ</h2>
                <p className="text-xs text-stone-500 mt-0.5">ভিডিও এডিটিং, মোশন গ্রাফিক্স ও এআই সার্ভিস প্যাকেজ পরিচালনা করুন।</p>
              </div>
              <button
                onClick={() => {
                  const newSrv: Service = {
                    id: "srv-" + Date.now(),
                    title: "নতুন ক্রিয়েটিভ সার্ভিস",
                    category: "Video Editing",
                    description: "সার্ভিসের বিস্তারিত বিবরণ...",
                    deliverables: ["4K Delivery", "Sound Design"],
                    icon: "Sparkles",
                  };
                  const updated = { ...data, services: [...(data.services || []), newSrv] };
                  setData(updated);
                  handleSave(updated);
                }}
                className="px-4 py-2 rounded-xl bg-amber-400 text-stone-950 font-bold text-xs uppercase cursor-pointer hover:bg-amber-300"
              >
                + নতুন সার্ভিস
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {data.services?.map((srv, idx) => (
                <div key={srv.id || idx} className="bg-white p-6 rounded-3xl border border-[#E8E4DA] space-y-4">
                  <div className="flex justify-between items-start">
                    <input
                      type="text"
                      value={srv.title}
                      onChange={(e) => {
                        const updated = {
                          ...data,
                          services: data.services.map((s) =>
                            s.id === srv.id ? { ...s, title: e.target.value } : s
                          ),
                        };
                        setData(updated);
                      }}
                      className="font-black text-stone-900 text-lg w-full bg-transparent border-b border-transparent focus:border-amber-400 focus:outline-none"
                    />
                    <button
                      onClick={() => {
                        const updated = {
                          ...data,
                          services: data.services.filter((s) => s.id !== srv.id),
                        };
                        setData(updated);
                        handleSave(updated);
                      }}
                      className="text-stone-400 hover:text-rose-600 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <input
                    type="text"
                    value={srv.category}
                    onChange={(e) => {
                      const updated = {
                        ...data,
                        services: data.services.map((s) =>
                          s.id === srv.id ? { ...s, category: e.target.value } : s
                        ),
                      };
                      setData(updated);
                    }}
                    className="text-xs font-bold text-amber-700 uppercase bg-amber-50 px-2 py-1 rounded w-full border border-amber-200"
                  />

                  <textarea
                    rows={2}
                    value={srv.description}
                    onChange={(e) => {
                      const updated = {
                        ...data,
                        services: data.services.map((s) =>
                          s.id === srv.id ? { ...s, description: e.target.value } : s
                        ),
                      };
                      setData(updated);
                    }}
                    className="text-xs text-stone-600 w-full p-2 rounded-lg bg-stone-50 border border-stone-200"
                  />
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-4">
              <button
                onClick={() => handleSave(data)}
                disabled={saving}
                className="px-6 py-3 rounded-xl bg-stone-900 text-amber-300 font-bold text-xs uppercase cursor-pointer hover:bg-stone-800"
              >
                সার্ভিসসমূহ সেভ করুন
              </button>
            </div>
          </div>
        )}

        {/* ===================== TAB 4: SKILLS & TOOLSTACK ===================== */}
        {activeTab === "skills" && data && (
          <div className="space-y-6">
            <div className="flex items-center justify-between bg-white p-6 rounded-3xl border border-[#E8E4DA]">
              <div>
                <h2 className="text-xl font-black text-stone-900">টুলস্ট্যাক ও দক্ষতা</h2>
                <p className="text-xs text-stone-500 mt-0.5">Premiere Pro, DaVinci, Midjourney এবং অন্যান্য সফটওয়্যার দক্ষতা।</p>
              </div>
              <button
                onClick={() => {
                  const newSkill: Skill = {
                    name: "New Software / Tool",
                    category: "Video Editing",
                    level: "90%",
                  };
                  const updated = { ...data, skills: [...data.skills, newSkill] };
                  setData(updated);
                  handleSave(updated);
                }}
                className="px-4 py-2 rounded-xl bg-amber-400 text-stone-950 font-bold text-xs uppercase cursor-pointer hover:bg-amber-300"
              >
                + নতুন টুল
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {data.skills.map((skill, idx) => (
                <div key={idx} className="bg-white p-4 rounded-2xl border border-[#E8E4DA] space-y-2">
                  <div className="flex justify-between items-center">
                    <input
                      type="text"
                      value={skill.name}
                      onChange={(e) => {
                        const updatedSkills = [...data.skills];
                        updatedSkills[idx].name = e.target.value;
                        setData({ ...data, skills: updatedSkills });
                      }}
                      className="font-bold text-stone-900 text-sm bg-transparent border-b border-transparent focus:border-amber-400 focus:outline-none"
                    />
                    <button
                      onClick={() => {
                        const updated = {
                          ...data,
                          skills: data.skills.filter((_, i) => i !== idx),
                        };
                        setData(updated);
                        handleSave(updated);
                      }}
                      className="text-stone-400 hover:text-rose-600"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={skill.category}
                      onChange={(e) => {
                        const updatedSkills = [...data.skills];
                        updatedSkills[idx].category = e.target.value;
                        setData({ ...data, skills: updatedSkills });
                      }}
                      className="text-[11px] text-stone-500 bg-stone-50 px-2 py-0.5 rounded w-full border border-stone-200"
                    />
                    <input
                      type="text"
                      value={skill.level}
                      onChange={(e) => {
                        const updatedSkills = [...data.skills];
                        updatedSkills[idx].level = e.target.value;
                        setData({ ...data, skills: updatedSkills });
                      }}
                      className="text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded w-16 text-center border border-amber-200"
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-4">
              <button
                onClick={() => handleSave(data)}
                disabled={saving}
                className="px-6 py-3 rounded-xl bg-stone-900 text-amber-300 font-bold text-xs uppercase cursor-pointer hover:bg-stone-800"
              >
                টুলস্ট্যাক সেভ করুন
              </button>
            </div>
          </div>
        )}

        {/* ===================== TAB 5: TESTIMONIALS ===================== */}
        {activeTab === "testimonials" && data && (
          <div className="space-y-6">
            <div className="flex items-center justify-between bg-white p-6 rounded-3xl border border-[#E8E4DA]">
              <div>
                <h2 className="text-xl font-black text-stone-900">ক্লায়েন্ট রিভিউ ও ফিডব্যাক</h2>
                <p className="text-xs text-stone-500 mt-0.5">ক্লায়েন্ট ও ক্রিয়েটরদের প্রশংসাপত্র যোগ ও পরিচালনা করুন।</p>
              </div>
              <button
                onClick={() => {
                  const newT: Testimonial = {
                    id: "test-" + Date.now(),
                    clientName: "Client Name",
                    clientRole: "YouTuber / Director",
                    company: "Media Co.",
                    feedback: "Rajob did an amazing job with our video editing project!",
                    rating: 5,
                  };
                  const updated = { ...data, testimonials: [...(data.testimonials || []), newT] };
                  setData(updated);
                  handleSave(updated);
                }}
                className="px-4 py-2 rounded-xl bg-amber-400 text-stone-950 font-bold text-xs uppercase cursor-pointer hover:bg-amber-300"
              >
                + নতুন রিভিউ
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {data.testimonials?.map((t, idx) => (
                <div key={t.id || idx} className="bg-white p-6 rounded-3xl border border-[#E8E4DA] space-y-3">
                  <div className="flex justify-between items-start">
                    <input
                      type="text"
                      value={t.clientName}
                      onChange={(e) => {
                        const updated = {
                          ...data,
                          testimonials: data.testimonials.map((item) =>
                            item.id === t.id ? { ...item, clientName: e.target.value } : item
                          ),
                        };
                        setData(updated);
                      }}
                      className="font-bold text-stone-900 text-base bg-transparent border-b border-transparent focus:border-amber-400 focus:outline-none"
                    />
                    <button
                      onClick={() => {
                        const updated = {
                          ...data,
                          testimonials: data.testimonials.filter((item) => item.id !== t.id),
                        };
                        setData(updated);
                        handleSave(updated);
                      }}
                      className="text-stone-400 hover:text-rose-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={t.clientRole}
                      placeholder="Role"
                      onChange={(e) => {
                        const updated = {
                          ...data,
                          testimonials: data.testimonials.map((item) =>
                            item.id === t.id ? { ...item, clientRole: e.target.value } : item
                          ),
                        };
                        setData(updated);
                      }}
                      className="text-xs text-stone-600 bg-stone-50 p-2 rounded-lg border border-stone-200"
                    />
                    <input
                      type="text"
                      value={t.company}
                      placeholder="Company"
                      onChange={(e) => {
                        const updated = {
                          ...data,
                          testimonials: data.testimonials.map((item) =>
                            item.id === t.id ? { ...item, company: e.target.value } : item
                          ),
                        };
                        setData(updated);
                      }}
                      className="text-xs text-stone-600 bg-stone-50 p-2 rounded-lg border border-stone-200"
                    />
                  </div>

                  <textarea
                    rows={3}
                    value={t.feedback}
                    onChange={(e) => {
                      const updated = {
                        ...data,
                        testimonials: data.testimonials.map((item) =>
                          item.id === t.id ? { ...item, feedback: e.target.value } : item
                        ),
                      };
                      setData(updated);
                    }}
                    className="text-xs text-stone-700 w-full p-2.5 rounded-lg bg-stone-50 border border-stone-200 resize-none italic"
                  />
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-4">
              <button
                onClick={() => handleSave(data)}
                disabled={saving}
                className="px-6 py-3 rounded-xl bg-stone-900 text-amber-300 font-bold text-xs uppercase cursor-pointer hover:bg-stone-800"
              >
                রিভিউসমূহ সেভ করুন
              </button>
            </div>
          </div>
        )}

        {/* ===================== TAB 6: MESSAGES INBOX ===================== */}
        {activeTab === "messages" && data && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-[#E8E4DA]">
              <h2 className="text-xl font-black text-stone-900">
                ক্লায়েন্ট ইনকোয়ারি ও ইনবক্স
              </h2>
              <p className="text-xs text-stone-500 mt-0.5">
                ওয়েবসাইটের কন্টাক্ট ফর্ম থেকে পাঠানো মেসেজসমূহ এখানে প্রদর্শিত হচ্ছে।
              </p>
            </div>

            {data.messages && data.messages.length > 0 ? (
              <div className="space-y-4">
                {data.messages.map((msg) => (
                  <div
                    key={msg.id}
                    className="bg-white p-6 rounded-3xl border border-[#E8E4DA] shadow-xs space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 pb-3">
                      <div>
                        <h4 className="font-extrabold text-stone-900 text-base">
                          {msg.name}
                        </h4>
                        <a
                          href={`mailto:${msg.email}`}
                          className="text-xs text-amber-700 font-semibold hover:underline"
                        >
                          {msg.email}
                        </a>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-[11px] text-stone-400">
                          {new Date(msg.createdAt).toLocaleString("bn-BD")}
                        </span>
                        <button
                          onClick={() => handleDeleteMessage(msg.id)}
                          className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="ডিলিট"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <p className="text-sm text-stone-700 leading-relaxed whitespace-pre-wrap">
                      {msg.message}
                    </p>

                    <div className="pt-2 flex justify-end">
                      <a
                        href={`mailto:${msg.email}?subject=Re: Project Inquiry`}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-400 text-stone-950 font-bold text-xs hover:bg-amber-300"
                      >
                        <Mail className="w-3.5 h-3.5" />
                        <span>ইমেইলে উত্তর দিন</span>
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 bg-white rounded-3xl border border-stone-200">
                <Mail className="w-12 h-12 text-stone-300 mx-auto mb-2" />
                <h4 className="font-bold text-stone-800">কোন মেসেজ নেই</h4>
                <p className="text-xs text-stone-500 mt-1">কেউ মেসেজ পাঠালে এখানে দেখতে পাবেন।</p>
              </div>
            )}
          </div>
        )}

        {/* ===================== TAB 7: SECURITY & BACKUP ===================== */}
        {activeTab === "security" && data && (
          <div className="max-w-3xl mx-auto space-y-8">
            
            {/* Change PIN Box */}
            <div className="bg-white p-8 rounded-3xl border border-[#E8E4DA] shadow-xs space-y-6">
              <div>
                <h3 className="text-lg font-black text-stone-900">
                  অ্যাডমিন পাসকোড পরিবর্তন (Change PIN)
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  আপনার অ্যাডমিন প্যানেল সুরক্ষিত রাখতে একটি শক্তিশালী পিন সেট করুন।
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-stone-700">
                  নতুন পিন দিন
                </label>
                <input
                  type="password"
                  placeholder="নতুন পিন টাইপ করুন"
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-stone-50 border border-stone-200 text-stone-900 text-sm"
                />
              </div>

              <button
                onClick={() => handleSave(data)}
                disabled={!newPin.trim() || saving}
                className="px-6 py-3 rounded-xl bg-amber-400 text-stone-950 font-black text-xs uppercase tracking-wider hover:bg-amber-300 disabled:opacity-50 cursor-pointer"
              >
                পিন আপডেট করুন
              </button>
            </div>

            {/* Backup & Portability Box */}
            <div className="bg-white p-8 rounded-3xl border border-[#E8E4DA] shadow-xs space-y-6">
              <div>
                <h3 className="text-lg font-black text-stone-900">
                  সম্পূর্ণ ডাটা ব্যাকআপ ও রিস্টোর
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  আপনার আপলোড করা প্রজেক্ট, ভিডিও লিঙ্ক এবং প্রোফাইল ডাটা যাতে কখনো হারিয়ে না যায় সেজন্য ১-ক্লিক ব্যাকআপ ডাউনলোড করে রাখুন।
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 pt-2">
                <button
                  onClick={handleExportBackup}
                  className="flex-1 py-3.5 px-4 rounded-xl bg-stone-900 text-amber-300 font-extrabold text-xs uppercase tracking-wider hover:bg-stone-800 flex items-center justify-center gap-2 cursor-pointer shadow-md"
                >
                  <Download className="w-4 h-4 text-amber-400" />
                  <span>ব্যাকআপ ফাইল ডাউনলোড করুন (JSON)</span>
                </button>

                <label className="flex-1 py-3.5 px-4 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-950 font-extrabold text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer border border-amber-300">
                  <Upload className="w-4 h-4 text-amber-800" />
                  <span>ব্যাকআপ রিস্টোর করুন</span>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImportBackup}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* Firebase & Netlify Cloud Settings Card */}
            <div className="bg-white p-8 rounded-3xl border border-[#E8E4DA] shadow-xs space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-black text-stone-900 flex items-center gap-2">
                    <span>🔥 Firebase ক্লাউড ডাটাবেজ ও Netlify সেটআপ</span>
                  </h3>
                  <p className="text-xs text-stone-500 mt-0.5">
                    Netlify-তে ফ্রিতে ডিপ্লয় করার পর ক্লাউডে ডাটা এবং ভিডিও/ছবি পার্মানেন্ট সেভ রাখার জন্য Firebase যুক্ত করা হয়েছে।
                  </p>
                </div>
                {(data as any)?.firebaseConnected ? (
                  <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold">
                    কানেক্টেড ✅
                  </span>
                ) : (
                  <span className="px-3 py-1 rounded-full bg-stone-100 text-stone-700 border border-stone-300 text-xs font-bold">
                    রেডি (লোকাল মোড)
                  </span>
                )}
              </div>

              <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 text-xs text-stone-700 space-y-2">
                <p className="font-bold text-amber-900">
                  Firebase Environment Variables (Netlify ও .env.local-এর জন্য):
                </p>
                <div className="font-mono text-[11px] bg-white p-3 rounded-xl border border-amber-200 space-y-1 text-stone-800 select-all">
                  <div>NEXT_PUBLIC_FIREBASE_API_KEY</div>
                  <div>NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN</div>
                  <div>NEXT_PUBLIC_FIREBASE_PROJECT_ID</div>
                  <div>NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET</div>
                  <div>NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID</div>
                  <div>NEXT_PUBLIC_FIREBASE_APP_ID</div>
                </div>
                <p className="text-[11px] text-stone-500">
                  * Firebase Console থেকে একটি ফ্রি প্রজেক্ট খুলে এই ভ্যালুগুলো Netlify-র Environment Variables-এ বসালেই অটোমেটিক ক্লাউড মোড চালু হয়ে যাবে!
                </p>
              </div>
            </div>

          </div>
        )}

      </main>

      {/* ===================== ADD / EDIT PROJECT MODAL ===================== */}
      {isProjectFormOpen && editingProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-stone-950/80 backdrop-blur-sm animate-in fade-in overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-white rounded-3xl overflow-hidden border border-stone-300 shadow-2xl my-8">
            
            {/* Modal Header with Save Button right away */}
            <div className="p-6 bg-[#FAF8F5] border-b border-stone-200 flex items-center justify-between">
              <div>
                <span className="text-xs font-black uppercase tracking-wider text-amber-800">
                  Project Workspace
                </span>
                <h3 className="text-xl font-black text-stone-900 mt-0.5">
                  {editingProject.title ? "প্রজেক্ট সম্পাদনা" : "নতুন প্রজেক্ট বা ভিডিও যোগ করুন"}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSaveProjectForm}
                  disabled={saving}
                  className="px-4 py-2 rounded-xl bg-amber-400 text-stone-950 font-black text-xs uppercase hover:bg-amber-300 shadow-sm cursor-pointer"
                >
                  {saving ? "সেভ হচ্ছে..." : "সংরক্ষণ করুন"}
                </button>
                <button
                  onClick={() => setIsProjectFormOpen(false)}
                  className="p-2 rounded-xl text-stone-400 hover:text-stone-800 hover:bg-stone-200 cursor-pointer"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 sm:p-8 space-y-6 max-h-[75vh] overflow-y-auto">
              
              {/* Media Type Selection */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-stone-700">
                  মিডিয়া টাইপ (Media Type) *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setEditingProject({ ...editingProject, mediaType: "video" })}
                    className={`py-3 rounded-xl text-xs font-black flex items-center justify-center gap-2 border cursor-pointer ${
                      editingProject.mediaType === "video"
                        ? "bg-amber-400 text-stone-950 border-amber-500 shadow-xs"
                        : "bg-stone-50 text-stone-600 border-stone-200"
                    }`}
                  >
                    <Film className="w-4 h-4" />
                    <span>ভিডিও প্রজেক্ট (Video)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setEditingProject({ ...editingProject, mediaType: "image" })}
                    className={`py-3 rounded-xl text-xs font-black flex items-center justify-center gap-2 border cursor-pointer ${
                      editingProject.mediaType === "image"
                        ? "bg-amber-400 text-stone-950 border-amber-500 shadow-xs"
                        : "bg-stone-50 text-stone-600 border-stone-200"
                    }`}
                  >
                    <ImageIcon className="w-4 h-4" />
                    <span>গ্রাফিক্স / ফটো (Image)</span>
                  </button>
                </div>
              </div>

              {/* MEDIA FILE UPLOAD (Prominent on top) */}
              <div className="p-5 rounded-2xl bg-[#FAF8F5] border border-amber-300/80 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase text-stone-800 flex items-center gap-1.5">
                    <Upload className="w-4 h-4 text-amber-700" />
                    <span>
                      {editingProject.mediaType === "video"
                        ? "ভিডিও ফাইল সিলেক্ট করুন"
                        : "ফটো ফাইল সিলেক্ট করুন"}
                    </span>
                  </span>
                  <span className="text-[11px] text-amber-700 font-bold">
                    সরাসরি ফাইল আপলোড অথবা লিঙ্ক দিন
                  </span>
                </div>

                {/* Upload Button */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <label className="flex-1 py-4 px-5 rounded-2xl bg-amber-400 hover:bg-amber-300 text-stone-950 text-xs font-black flex items-center justify-center gap-2 cursor-pointer transition-all shadow-md shadow-amber-400/25">
                    {uploadingMedia ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>ফাইল আপলোড হচ্ছে... অনুগ্রহ করে অপেক্ষা করুন</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4" />
                        <span>
                          {editingProject.mediaType === "video"
                            ? "ভিডিও ফাইল আপলোড করুন (MP4 / MOV)"
                            : "ছবি আপলোড করুন (JPG / PNG / WEBP)"}
                        </span>
                      </>
                    )}
                    <input
                      type="file"
                      accept={
                        editingProject.mediaType === "video"
                          ? "video/mp4,video/webm,video/quicktime"
                          : "image/*"
                      }
                      onChange={handleMediaUpload}
                      disabled={uploadingMedia}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* Direct Link Alternative */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-stone-500">
                    অথবা সরাসরি লিঙ্ক দিন (URL / YouTube / Vimeo / Google Drive / MP4 Link)
                  </label>
                  <input
                    type="text"
                    placeholder="https://..."
                    value={editingProject.mediaUrl}
                    onChange={(e) =>
                      setEditingProject({ ...editingProject, mediaUrl: e.target.value })
                    }
                    className="w-full px-3 py-2.5 rounded-xl bg-white border border-stone-200 text-xs text-stone-800"
                  />
                </div>

                {/* Media Preview Box */}
                {editingProject.mediaUrl && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>মিডিয়া সফলভাবে যুক্ত হয়েছে! প্রিভিউ নিচে দেওয়া হলো:</span>
                    </div>

                    <div className="rounded-xl overflow-hidden bg-black max-h-56 flex items-center justify-center">
                      {editingProject.mediaType === "video" ? (
                        <video
                          src={editingProject.mediaUrl}
                          controls
                          className="max-h-56 w-full object-contain"
                        />
                      ) : (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={editingProject.mediaUrl}
                          alt="Preview"
                          className="max-h-56 w-full object-contain"
                        />
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Title & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-stone-700">
                    প্রজেক্টের নাম (Title) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Commercial Brand Ad"
                    value={editingProject.title}
                    onChange={(e) =>
                      setEditingProject({ ...editingProject, title: e.target.value })
                    }
                    className="w-full px-4 py-3 rounded-xl bg-stone-50 border border-stone-200 text-stone-900 text-sm focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-stone-700">
                    ক্যাটাগরি (Category) *
                  </label>
                  <select
                    value={editingProject.category}
                    onChange={(e) =>
                      setEditingProject({ ...editingProject, category: e.target.value })
                    }
                    className="w-full px-4 py-3 rounded-xl bg-stone-50 border border-stone-200 text-stone-900 text-sm focus:outline-none focus:border-amber-500"
                  >
                    <option value="Video Editing">Video Editing (সিনেমাটিক / লং-ফর্ম)</option>
                    <option value="Shorts & Reels">Shorts & Reels (ভাইরাল রিলস)</option>
                    <option value="Graphics Design">Graphics Design (পোস্টার / থাম্বনেইল)</option>
                    <option value="AI Creative Art">AI Creative Art (মিডজার্নি ও এআই আর্ট)</option>
                    <option value="Motion Graphics">Motion Graphics (অ্যানিমেশন ও লোগো)</option>
                    <option value="Branding">Branding & Identity</option>
                  </select>
                </div>
              </div>

              {/* COVER / THUMBNAIL (Optional for video) */}
              <div className="p-5 rounded-2xl bg-[#FAF8F5] border border-stone-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase text-stone-800">
                    কভার ছবি (ঐচ্ছিক — ভিডিওর জন্য স্বয়ংক্রিয় ফ্রেম প্রদর্শিত হবে)
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  {editingProject.thumbnail && (
                    <div className="w-20 h-14 rounded-lg overflow-hidden bg-stone-200 shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={editingProject.thumbnail}
                        alt="Thumb"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <label className="px-4 py-2 rounded-xl bg-white border border-stone-300 text-stone-800 hover:bg-stone-50 text-xs font-bold cursor-pointer">
                    <span>{uploadingThumb ? "আপলোড হচ্ছে..." : "কাস্টম থাম্বনেইল নির্বাচন করুন"}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleThumbnailUpload}
                      disabled={uploadingThumb}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-stone-700">
                  প্রজেক্টের বিবরণ (Description)
                </label>
                <textarea
                  rows={3}
                  placeholder="এই প্রজেক্টে আপনি কি কি কাজ করেছেন তা সংক্ষেপে লিখুন..."
                  value={editingProject.description}
                  onChange={(e) =>
                    setEditingProject({ ...editingProject, description: e.target.value })
                  }
                  className="w-full px-4 py-3 rounded-xl bg-stone-50 border border-stone-200 text-stone-900 text-sm resize-none"
                />
              </div>

              {/* Client & Duration */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-stone-700">
                    ক্লায়েন্ট বা ব্র্যান্ডের নাম
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. YouTube Creator / Nike"
                    value={editingProject.client || ""}
                    onChange={(e) =>
                      setEditingProject({ ...editingProject, client: e.target.value })
                    }
                    className="w-full px-4 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-stone-900 text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-stone-700">
                    ভিডিও ডিউরেশন (ঐচ্ছিক)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 01:24"
                    value={editingProject.duration || ""}
                    onChange={(e) =>
                      setEditingProject({ ...editingProject, duration: e.target.value })
                    }
                    className="w-full px-4 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-stone-900 text-sm"
                  />
                </div>
              </div>

              {/* Tags (Software used) */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-stone-700 block">
                  সফটওয়্যার ট্যাগ (Software / Tools Used)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g. Premiere Pro, DaVinci, Midjourney"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddTag();
                      }
                    }}
                    className="flex-1 px-4 py-2 rounded-xl bg-stone-50 border border-stone-200 text-sm"
                  />
                  <button
                    type="button"
                    onClick={handleAddTag}
                    className="px-4 py-2 rounded-xl bg-stone-900 text-amber-300 font-bold text-xs"
                  >
                    + ট্যাগ যোগ
                  </button>
                </div>

                <div className="flex flex-wrap gap-1.5 pt-1">
                  {editingProject.tags?.map((tag, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-50 text-amber-900 border border-amber-200 text-xs font-bold"
                    >
                      <span>{tag}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="text-amber-700 hover:text-rose-600"
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="p-6 bg-[#FAF8F5] border-t border-stone-200 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsProjectFormOpen(false)}
                className="px-5 py-2.5 rounded-xl border border-stone-300 text-stone-700 font-bold text-xs cursor-pointer"
              >
                বাতিল
              </button>
              <button
                type="button"
                onClick={handleSaveProjectForm}
                disabled={saving}
                className="px-7 py-3 rounded-xl bg-amber-400 text-stone-950 font-black text-xs uppercase hover:bg-amber-300 shadow-md cursor-pointer flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>সংরক্ষণ হচ্ছে...</span>
                  </>
                ) : (
                  <span>প্রজেক্ট সংরক্ষণ করুন</span>
                )}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
