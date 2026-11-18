"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import {
  User,
  Mail,
  Lock,
  Camera,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Building,
  Briefcase,
  MapPin,
  Globe,
  Clock,
  Phone,
  Tag,
  ExternalLink,
  Shield,
  Eye,
  EyeOff,
  Sparkles,
  Save,
  Plus,
  X,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/providers/AuthProvider";
import { useUserStore } from "@/store/userStore";
import { useAuthenticatedApi } from "@/lib/useAuthenticatedApi";

export default function ProfilePage() {
  const api = useAuthenticatedApi();
  const { user, changePassword, refreshDbUser } = useAuth();
  const { dbUser, setDbUser } = useUserStore();

  const [activeTab, setActiveTab] = useState<"profile" | "security">("profile");

  // Profile Form State
  const [formData, setFormData] = useState({
    name: "",
    company: "",
    designation: "",
    country: "",
    state: "",
    city: "",
    phone: "",
    preferredLanguage: "English",
    timezone: "UTC+05:30 (IST)",
    accountType: "INDIVIDUAL" as "INDIVIDUAL" | "ORGANIZATION",
    bio: "",
    professionalTitle: "",
    skills: [] as string[],
    specialization: "",
    experienceLevel: "Senior",
    experienceYears: 0,
    portfolioUrl: "",
    githubUrl: "",
    linkedinUrl: "",
    availability: "Full-time",
  });

  const [skillInput, setSkillInput] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Avatar Upload State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);

  // Password Change State
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  useEffect(() => {
    if (dbUser) {
      setFormData({
        name: dbUser.name || "",
        company: dbUser.company || "",
        designation: dbUser.designation || "",
        country: dbUser.country || "",
        state: dbUser.state || "",
        city: dbUser.city || "",
        phone: dbUser.phone || "",
        preferredLanguage: dbUser.preferredLanguage || "English",
        timezone: dbUser.timezone || "UTC+05:30 (IST)",
        accountType: (dbUser.accountType as any) || "INDIVIDUAL",
        bio: dbUser.bio || "",
        professionalTitle: dbUser.professionalTitle || "",
        skills: Array.isArray(dbUser.skills) ? dbUser.skills : [],
        specialization: dbUser.specialization || "",
        experienceLevel: dbUser.experienceLevel || "Senior",
        experienceYears: dbUser.experienceYears || 0,
        portfolioUrl: dbUser.portfolioUrl || "",
        githubUrl: dbUser.githubUrl || "",
        linkedinUrl: dbUser.linkedinUrl || "",
        availability: dbUser.availability || "Full-time",
      });
      setAvatarPreview(dbUser.avatarUrl || null);
    }
  }, [dbUser]);

  // Profile completion calculation
  const calculateCompletion = () => {
    if (!dbUser) return 0;
    const role = dbUser.role;
    let fieldsToCheck: (keyof typeof formData)[] = [];

    if (role === "CLIENT") {
      fieldsToCheck = [
        "name",
        "company",
        "designation",
        "country",
        "city",
        "phone",
        "bio",
      ];
    } else if (role === "FREELANCER") {
      fieldsToCheck = [
        "name",
        "professionalTitle",
        "bio",
        "specialization",
        "portfolioUrl",
        "country",
        "city",
        "phone",
      ];
    } else {
      fieldsToCheck = ["name", "designation", "bio", "phone"];
    }

    let filled = 0;
    if (avatarPreview || dbUser.avatarUrl) filled++;
    const total = fieldsToCheck.length + 1; // +1 for avatar

    for (const key of fieldsToCheck) {
      const val = formData[key];
      if (typeof val === "string" && val.trim().length > 0) filled++;
      else if (Array.isArray(val) && val.length > 0) filled++;
      else if (typeof val === "number" && val > 0) filled++;
    }

    return Math.round((filled / total) * 100);
  };

  const completionPercent = calculateCompletion();

  // Avatar Selection & ImgBB Upload
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate type
    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
    if (!validTypes.includes(file.type)) {
      setAvatarError("Please select a JPEG, PNG, or WebP image file.");
      return;
    }

    // Validate size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setAvatarError("Image file size exceeds the 5 MB limit.");
      return;
    }

    setAvatarError(null);

    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      setAvatarPreview(base64);

      // Upload immediately through backend ImgBB endpoint
      setUploadingAvatar(true);
      try {
        const { data } = await api.post("/auth/profile-image", { image: base64 });
        if (data.success && data.data?.avatarUrl) {
          setAvatarPreview(data.data.avatarUrl);
          if (data.data.user) {
            setDbUser(data.data.user);
          }
          await refreshDbUser();
        }
      } catch (err: any) {
        console.error(err);
        setAvatarError(err.response?.data?.error || "Failed to upload image. Please try again.");
      } finally {
        setUploadingAvatar(false);
      }
    };
    reader.readAsDataURL(file);
  };

  // Add / Remove Skills
  const handleAddSkill = (e: React.KeyboardEvent | React.MouseEvent) => {
    if ("key" in e && e.key !== "Enter") return;
    e.preventDefault();
    const trimmed = skillInput.trim();
    if (trimmed && !formData.skills.includes(trimmed)) {
      setFormData((prev) => ({ ...prev, skills: [...prev.skills, trimmed] }));
      setSkillInput("");
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      skills: prev.skills.filter((s) => s !== skillToRemove),
    }));
  };

  // Save Profile Form
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileError(null);
    setProfileSuccess(false);

    try {
      const { data } = await api.put("/auth/profile", formData);
      if (data.success) {
        setDbUser(data.data);
        setProfileSuccess(true);
        setTimeout(() => setProfileSuccess(false), 4000);
      }
    } catch (err: any) {
      console.error(err);
      setProfileError(err.response?.data?.error || "Failed to save profile changes.");
    } finally {
      setSavingProfile(false);
    }
  };

  // Change Password Form
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword) {
      setPasswordError("Please enter your current password.");
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError("New password must be at least 6 characters long.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match.");
      return;
    }

    setChangingPassword(true);
    setPasswordError(null);
    setPasswordSuccess(false);

    try {
      await changePassword(currentPassword, newPassword);
      setPasswordSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setPasswordSuccess(false), 5000);
    } catch (err: any) {
      console.error(err);
      let msg = "Failed to update password.";
      if (err.code === "auth/wrong-password" || err.code === "auth/invalid-credential") {
        msg = "The current password you entered is incorrect.";
      } else if (err.message) {
        msg = err.message;
      }
      setPasswordError(msg);
    } finally {
      setChangingPassword(false);
    }
  };

  const role = dbUser?.role || "CLIENT";
  const isAdmin = role === "ADMIN";
  const isFreelancer = role === "FREELANCER";
  const isClient = role === "CLIENT";

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-16">
      {/* Top Banner & Header */}
      <div className="glass-elevated border border-border rounded-2xl p-6 sm:p-8 relative overflow-hidden shadow-sm">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          {/* Avatar Upload Area */}
          <div className="relative group">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden bg-accent-primary/10 border-2 border-accent-primary/30 flex items-center justify-center text-accent-primary font-bold text-2xl shadow-md">
              {avatarPreview ? (
                <Image
                  src={avatarPreview}
                  alt={formData.name || "User Avatar"}
                  width={112}
                  height={112}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span>{formData.name ? formData.name.slice(0, 2).toUpperCase() : "U"}</span>
              )}
            </div>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingAvatar}
              className="absolute inset-0 rounded-2xl bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-xs font-medium cursor-pointer"
            >
              {uploadingAvatar ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <>
                  <Camera className="w-6 h-6 mb-1" />
                  <span>Change</span>
                </>
              )}
            </button>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleAvatarChange}
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
            />
          </div>

          {/* User Quick Info & Profile Strength */}
          <div className="flex-1 text-center sm:text-left space-y-2">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
              <h1 className="font-display font-bold text-2xl sm:text-3xl text-text-primary">
                {formData.name || dbUser?.name || "Your Profile"}
              </h1>
              <span
                className={`text-xs font-mono font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                  isAdmin
                    ? "bg-accent-danger/10 text-accent-danger border-accent-danger/20"
                    : isClient
                    ? "bg-accent-primary/10 text-accent-primary border-accent-primary/20"
                    : "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                }`}
              >
                {role}
              </span>
            </div>

            <p className="text-sm text-text-secondary">
              {dbUser?.email} {formData.city ? `• ${formData.city}, ${formData.country}` : ""}
            </p>

            {/* Profile Completion Indicator */}
            <div className="pt-2 max-w-sm">
              <div className="flex items-center justify-between text-xs font-medium mb-1.5">
                <span className="text-text-secondary flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-accent-primary" /> Profile Completion
                </span>
                <span className="font-mono text-accent-primary">{completionPercent}%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-border">
                <div
                  className="bg-accent-primary h-full rounded-full transition-all duration-500"
                  style={{ width: `${completionPercent}%` }}
                />
              </div>
            </div>

            {avatarError && (
              <p className="text-xs text-accent-danger mt-1.5">{avatarError}</p>
            )}
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-2 mt-8 border-t border-border pt-4">
          <button
            onClick={() => setActiveTab("profile")}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${
              activeTab === "profile"
                ? "bg-accent-primary text-white shadow-xs"
                : "text-text-secondary hover:text-text-primary hover:bg-slate-100"
            }`}
          >
            <User className="w-4 h-4" />
            <span>Profile Details</span>
          </button>
          <button
            onClick={() => setActiveTab("security")}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${
              activeTab === "security"
                ? "bg-accent-primary text-white shadow-xs"
                : "text-text-secondary hover:text-text-primary hover:bg-slate-100"
            }`}
          >
            <Lock className="w-4 h-4" />
            <span>Security & Password</span>
          </button>
        </div>
      </div>

      {/* Tab 1: Profile Details Form */}
      {activeTab === "profile" && (
        <form onSubmit={handleSaveProfile} className="space-y-6">
          {profileSuccess && (
            <div className="p-4 rounded-xl bg-accent-success/10 border border-accent-success/20 text-accent-success flex items-center gap-2.5 text-sm animate-in fade-in">
              <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
              <span>Profile details updated successfully!</span>
            </div>
          )}

          {profileError && (
            <div className="p-4 rounded-xl bg-accent-danger/10 border border-accent-danger/20 text-accent-danger flex items-center gap-2.5 text-sm animate-in fade-in">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{profileError}</span>
            </div>
          )}

          {/* BASIC INFORMATION */}
          <Card className="glass-elevated border-border p-6 rounded-2xl space-y-4">
            <h2 className="font-display font-bold text-lg text-text-primary flex items-center gap-2">
              <User className="w-5 h-5 text-accent-primary" />
              <span>General Information</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
                  Full Name / Display Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-bg-primary border border-border rounded-lg px-3.5 py-2.5 text-sm text-text-primary focus:border-accent-primary focus:outline-none"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
                  Contact Phone
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-text-secondary absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+91 98765 43210"
                    className="w-full bg-bg-primary border border-border rounded-lg pl-9 pr-3.5 py-2.5 text-sm text-text-primary focus:border-accent-primary focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Role specific: Client details */}
            {isClient && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-border mt-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
                    Account Classification
                  </label>
                  <select
                    value={formData.accountType}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        accountType: e.target.value as "INDIVIDUAL" | "ORGANIZATION",
                      })
                    }
                    className="w-full bg-bg-primary border border-border rounded-lg px-3.5 py-2.5 text-sm text-text-primary focus:border-accent-primary focus:outline-none"
                  >
                    <option value="INDIVIDUAL">Individual Client</option>
                    <option value="ORGANIZATION">Organization / Business</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
                    Company / Organization
                  </label>
                  <div className="relative">
                    <Building className="w-4 h-4 text-text-secondary absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={formData.company}
                      onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                      placeholder="Acme Innovations"
                      className="w-full bg-bg-primary border border-border rounded-lg pl-9 pr-3.5 py-2.5 text-sm text-text-primary focus:border-accent-primary focus:outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
                    Your Designation
                  </label>
                  <input
                    type="text"
                    value={formData.designation}
                    onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                    placeholder="Product Lead / Founder"
                    className="w-full bg-bg-primary border border-border rounded-lg px-3.5 py-2.5 text-sm text-text-primary focus:border-accent-primary focus:outline-none"
                  />
                </div>
              </div>
            )}

            {/* Role specific: Admin designation */}
            {isAdmin && (
              <div className="space-y-1.5 pt-2 border-t border-border mt-4">
                <label className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
                  Administrative Designation
                </label>
                <input
                  type="text"
                  value={formData.designation}
                  onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                  placeholder="Platform Overseer / Senior Arbitrator"
                  className="w-full bg-bg-primary border border-border rounded-lg px-3.5 py-2.5 text-sm text-text-primary focus:border-accent-primary focus:outline-none"
                />
              </div>
            )}
          </Card>

          {/* FREELANCER PROFESSIONAL PROFILE */}
          {isFreelancer && (
            <Card className="glass-elevated border-border p-6 rounded-2xl space-y-4">
              <h2 className="font-display font-bold text-lg text-text-primary flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-accent-primary" />
                <span>Professional Qualifications</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
                    Professional Title *
                  </label>
                  <input
                    type="text"
                    value={formData.professionalTitle}
                    onChange={(e) =>
                      setFormData({ ...formData, professionalTitle: e.target.value })
                    }
                    placeholder="Senior Full-Stack & Smart Contract Engineer"
                    className="w-full bg-bg-primary border border-border rounded-lg px-3.5 py-2.5 text-sm text-text-primary focus:border-accent-primary focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
                    Core Specialization
                  </label>
                  <input
                    type="text"
                    value={formData.specialization}
                    onChange={(e) =>
                      setFormData({ ...formData, specialization: e.target.value })
                    }
                    placeholder="Next.js, Node.js, Web3 Escrow, AI Integration"
                    className="w-full bg-bg-primary border border-border rounded-lg px-3.5 py-2.5 text-sm text-text-primary focus:border-accent-primary focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
                    Experience Level
                  </label>
                  <select
                    value={formData.experienceLevel}
                    onChange={(e) =>
                      setFormData({ ...formData, experienceLevel: e.target.value })
                    }
                    className="w-full bg-bg-primary border border-border rounded-lg px-3.5 py-2.5 text-sm text-text-primary focus:border-accent-primary focus:outline-none"
                  >
                    <option value="Junior">Junior (1-2 years)</option>
                    <option value="Intermediate">Intermediate (3-4 years)</option>
                    <option value="Senior">Senior (5+ years)</option>
                    <option value="Expert">Lead / Expert (8+ years)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
                    Years of Experience
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={50}
                    value={formData.experienceYears}
                    onChange={(e) =>
                      setFormData({ ...formData, experienceYears: Number(e.target.value) || 0 })
                    }
                    className="w-full bg-bg-primary border border-border rounded-lg px-3.5 py-2.5 text-sm text-text-primary focus:border-accent-primary focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
                    Availability Status
                  </label>
                  <select
                    value={formData.availability}
                    onChange={(e) => setFormData({ ...formData, availability: e.target.value })}
                    className="w-full bg-bg-primary border border-border rounded-lg px-3.5 py-2.5 text-sm text-text-primary focus:border-accent-primary focus:outline-none"
                  >
                    <option value="Full-time">Available Full-time (40h/week)</option>
                    <option value="Part-time">Available Part-time (20h/week)</option>
                    <option value="Contract">Open for Specific Projects</option>
                    <option value="Busy">Currently Occupied</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
                    Portfolio / Website URL
                  </label>
                  <div className="relative">
                    <ExternalLink className="w-4 h-4 text-text-secondary absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="url"
                      value={formData.portfolioUrl}
                      onChange={(e) => setFormData({ ...formData, portfolioUrl: e.target.value })}
                      placeholder="https://yourportfolio.dev"
                      className="w-full bg-bg-primary border border-border rounded-lg pl-9 pr-3.5 py-2.5 text-sm text-text-primary focus:border-accent-primary focus:outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
                    GitHub URL
                  </label>
                  <input
                    type="url"
                    value={formData.githubUrl}
                    onChange={(e) => setFormData({ ...formData, githubUrl: e.target.value })}
                    placeholder="https://github.com/username"
                    className="w-full bg-bg-primary border border-border rounded-lg px-3.5 py-2.5 text-sm text-text-primary focus:border-accent-primary focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
                    LinkedIn URL
                  </label>
                  <input
                    type="url"
                    value={formData.linkedinUrl}
                    onChange={(e) => setFormData({ ...formData, linkedinUrl: e.target.value })}
                    placeholder="https://linkedin.com/in/username"
                    className="w-full bg-bg-primary border border-border rounded-lg px-3.5 py-2.5 text-sm text-text-primary focus:border-accent-primary focus:outline-none"
                  />
                </div>
              </div>

              {/* Skills Tags */}
              <div className="space-y-2 pt-2 border-t border-border mt-4">
                <label className="text-xs font-semibold uppercase tracking-wider text-text-secondary flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5" /> Skills & Technical Tags
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyDown={handleAddSkill}
                    placeholder="Type a skill and press Enter (e.g. React, TypeScript, Solidity)"
                    className="flex-1 bg-bg-primary border border-border rounded-lg px-3.5 py-2 text-sm text-text-primary focus:border-accent-primary focus:outline-none"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleAddSkill}
                    className="border-border text-sm"
                  >
                    <Plus className="w-4 h-4 mr-1" /> Add
                  </Button>
                </div>

                <div className="flex flex-wrap gap-2 pt-2">
                  {formData.skills.map((skill) => (
                    <span
                      key={skill}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent-primary/10 text-accent-primary border border-accent-primary/20 text-xs font-medium"
                    >
                      {skill}
                      <button
                        type="button"
                        onClick={() => handleRemoveSkill(skill)}
                        className="hover:text-accent-danger transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                  {formData.skills.length === 0 && (
                    <span className="text-xs text-text-secondary italic">
                      No skills added yet. Add skills to stand out in contract awards.
                    </span>
                  )}
                </div>
              </div>
            </Card>
          )}

          {/* LOCATION & LOCALIZATION */}
          <Card className="glass-elevated border-border p-6 rounded-2xl space-y-4">
            <h2 className="font-display font-bold text-lg text-text-primary flex items-center gap-2">
              <MapPin className="w-5 h-5 text-accent-primary" />
              <span>Location & Preferences</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
                  Country
                </label>
                <input
                  type="text"
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  placeholder="India"
                  className="w-full bg-bg-primary border border-border rounded-lg px-3.5 py-2.5 text-sm text-text-primary focus:border-accent-primary focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
                  State / Province
                </label>
                <input
                  type="text"
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  placeholder="Maharashtra / Odisha / Karnataka"
                  className="w-full bg-bg-primary border border-border rounded-lg px-3.5 py-2.5 text-sm text-text-primary focus:border-accent-primary focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
                  City
                </label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder="Mumbai / Bengaluru"
                  className="w-full bg-bg-primary border border-border rounded-lg px-3.5 py-2.5 text-sm text-text-primary focus:border-accent-primary focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-text-secondary flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-text-secondary" /> Preferred Language
                </label>
                <input
                  type="text"
                  value={formData.preferredLanguage}
                  onChange={(e) =>
                    setFormData({ ...formData, preferredLanguage: e.target.value })
                  }
                  placeholder="English"
                  className="w-full bg-bg-primary border border-border rounded-lg px-3.5 py-2.5 text-sm text-text-primary focus:border-accent-primary focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-text-secondary flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-text-secondary" /> Time Zone
                </label>
                <input
                  type="text"
                  value={formData.timezone}
                  onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                  placeholder="UTC+05:30 (IST)"
                  className="w-full bg-bg-primary border border-border rounded-lg px-3.5 py-2.5 text-sm text-text-primary focus:border-accent-primary focus:outline-none"
                />
              </div>
            </div>
          </Card>

          {/* BIO / ABOUT */}
          <Card className="glass-elevated border-border p-6 rounded-2xl space-y-4">
            <h2 className="font-display font-bold text-lg text-text-primary">
              Professional Summary / Bio
            </h2>
            <div className="space-y-1.5">
              <textarea
                rows={4}
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                placeholder="Share a concise description of your background, experience, or mission..."
                className="w-full bg-bg-primary border border-border rounded-lg p-3.5 text-sm text-text-primary focus:border-accent-primary focus:outline-none resize-y"
              />
            </div>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end pt-2">
            <Button
              type="submit"
              disabled={savingProfile}
              className="px-6 py-5 bg-accent-primary hover:bg-accent-primary/90 text-white font-medium shadow-md flex items-center gap-2"
            >
              {savingProfile ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>{savingProfile ? "Saving Changes..." : "Save Profile Details"}</span>
            </Button>
          </div>
        </form>
      )}

      {/* Tab 2: Security & Change Password */}
      {activeTab === "security" && (
        <Card className="glass-elevated border-border p-6 sm:p-8 rounded-2xl space-y-6">
          <div>
            <h2 className="font-display font-bold text-xl text-text-primary flex items-center gap-2">
              <Shield className="w-5 h-5 text-accent-primary" />
              <span>Change Account Password</span>
            </h2>
            <p className="text-sm text-text-secondary mt-1">
              Ensure your account uses a secure password of at least 6 characters. Passwords are never stored on platform servers.
            </p>
          </div>

          {passwordSuccess && (
            <div className="p-4 rounded-xl bg-accent-success/10 border border-accent-success/20 text-accent-success flex items-center gap-2.5 text-sm animate-in fade-in">
              <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
              <span>Your password has been changed successfully.</span>
            </div>
          )}

          {passwordError && (
            <div className="p-4 rounded-xl bg-accent-danger/10 border border-accent-danger/20 text-accent-danger flex items-center gap-2.5 text-sm animate-in fade-in">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{passwordError}</span>
            </div>
          )}

          <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
                Current Password *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-text-secondary absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showCurrentPassword ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-bg-primary border border-border rounded-lg pl-9 pr-10 py-2.5 text-sm text-text-primary focus:border-accent-primary focus:outline-none"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary p-1"
                >
                  {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
                New Password *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-text-secondary absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full bg-bg-primary border border-border rounded-lg pl-9 pr-10 py-2.5 text-sm text-text-primary focus:border-accent-primary focus:outline-none"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary p-1"
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
                Confirm New Password *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-text-secondary absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  className="w-full bg-bg-primary border border-border rounded-lg pl-9 pr-10 py-2.5 text-sm text-text-primary focus:border-accent-primary focus:outline-none"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary p-1"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                disabled={changingPassword}
                className="bg-accent-primary hover:bg-accent-primary/90 text-white font-medium py-5 px-6 shadow-sm"
              >
                {changingPassword ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                <span>Update Password</span>
              </Button>
            </div>
          </form>
        </Card>
      )}
    </div>
  );
}

