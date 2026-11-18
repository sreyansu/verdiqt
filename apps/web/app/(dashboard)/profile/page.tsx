"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
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
  Save,
  Plus,
  Trash2,
  Edit2,
  GraduationCap,
  Award,
  FolderGit2,
  Sliders,
  FileCheck2,
  ArrowRight,
  Upload,
  Calendar,
  Layers,
  ChevronRight,
  Info,
  X,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/providers/AuthProvider";
import {
  useUserStore,
  Language,
  Employment,
  Education,
  Certification,
  PortfolioItem,
  FreelancerWorkPreferences,
  ClientOrganization,
  ClientHiringPreferences,
  ContractExpectations,
  PrivacySettings,
} from "@/store/userStore";
import { useAuthenticatedApi } from "@/lib/useAuthenticatedApi";

export default function ProfilePage() {
  const api = useAuthenticatedApi();
  const { user, changePassword, refreshDbUser } = useAuth();
  const { dbUser, setDbUser } = useUserStore();

  const role = dbUser?.role || "CLIENT";
  const isFreelancer = role === "FREELANCER";
  const isClient = role === "CLIENT";
  const isAdmin = role === "ADMIN";

  // Active Tab state
  const [activeTab, setActiveTab] = useState<string>("personal");

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    displayName: "",
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
    languages: [] as Language[],

    // Freelancer
    professionalTitle: "",
    primaryCategory: "",
    specialization: "",
    skills: [] as string[],
    experienceLevel: "Experienced",
    experienceYears: 0,
    industriesServed: [] as string[],
    softwareTools: [] as string[],
    preferredProjectTypes: [] as string[],
    achievements: "",
    employment: [] as Employment[],
    education: [] as Education[],
    certifications: [] as Certification[],
    portfolio: [] as PortfolioItem[],
    availability: "Available",
    portfolioUrl: "",
    githubUrl: "",
    linkedinUrl: "",
    workPreferences: {
      availability: "Available",
      preferredEngagement: "Both",
      preferredProjectDuration: "1_TO_3_MONTHS",
      workingDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      workingHours: "Flexible",
      timezone: "UTC+05:30 (IST)",
      expectedResponseTime: "Within a few hours",
      preferredCommunicationMethod: "Platform Messages",
      minimumBudget: 0,
      revisionPolicy: "Up to 2 rounds of minor revisions per milestone included.",
    } as FreelancerWorkPreferences,

    // Client Organization
    organization: {
      companyName: "",
      companyLogo: null as string | null,
      industry: "",
      companySize: "1-10",
      companyWebsite: "",
      companyTagline: "",
      companyDescription: "",
      businessLocation: "",
      businessEmail: "",
      businessPhone: "",
      userDesignation: "",
    } as ClientOrganization,

    // Client Hiring Preferences
    hiringPreferences: {
      primaryHiringCategories: [] as string[],
      preferredExpertise: [] as string[],
      typicalBudgetRange: "50K_TO_200K",
      preferredEngagement: "Both",
      preferredProjectDuration: "1_TO_3_MONTHS",
      preferredExperienceLevel: "Intermediate",
      preferredLocation: "",
      preferredLanguages: ["English"],
      preferredCommunicationMethod: "Platform Messages",
      preferredCommunicationHours: "Business hours (IST)",
    } as ClientHiringPreferences,

    // Contract & Project Expectations
    contractExpectations: {
      expectedTurnaroundTime: "Within 24 hours",
      standardReviewPeriod: "3 business days",
      preferredRevisionRounds: "2 rounds",
      preferredMilestoneStructure: "Milestone-by-feature deliverable",
      preferredDeliverableFormats: ["GitHub Repository", "Live Staging URL"],
      communicationFrequency: "Milestone check-ins",
      requirementDocPreference: "Detailed PRD with acceptance criteria",
      authorizedApprover: "",
      scopeChangeAuthority: "",
      preferredEscalationMethod: "Direct platform negotiation before AI tribunal",
    } as ContractExpectations,

    // Privacy Settings
    privacySettings: {
      showEmail: false,
      showPhone: false,
      showPortfolioLinks: true,
      showEarnings: false,
    } as PrivacySettings,
  });

  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Dynamic tag inputs
  const [skillInput, setSkillInput] = useState("");
  const [industryInput, setIndustryInput] = useState("");
  const [toolInput, setToolInput] = useState("");
  const [projectTypeInput, setProjectTypeInput] = useState("");
  const [clientCategoryInput, setClientCategoryInput] = useState("");
  const [clientExpertiseInput, setClientExpertiseInput] = useState("");

  // Language input modal/form
  const [newLanguage, setNewLanguage] = useState("");
  const [newLanguageProficiency, setNewLanguageProficiency] = useState("Fluent");

  // Avatar and Logo upload
  const fileInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);

  // Repeatable modals / editors
  const [editingEmployment, setEditingEmployment] = useState<Employment | null>(null);
  const [editingEducation, setEditingEducation] = useState<Education | null>(null);
  const [editingCertification, setEditingCertification] = useState<Certification | null>(null);
  const [editingPortfolio, setEditingPortfolio] = useState<PortfolioItem | null>(null);
  const [portfolioTechInput, setPortfolioTechInput] = useState("");

  // Password Change
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Sync from dbUser
  useEffect(() => {
    if (dbUser) {
      setFormData({
        name: dbUser.name || "",
        displayName: dbUser.displayName || dbUser.name || "",
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
        languages: dbUser.languages || [{ language: "English", proficiency: "Fluent" }],

        // Freelancer
        professionalTitle: dbUser.professionalTitle || "",
        primaryCategory: dbUser.primaryCategory || "",
        specialization: dbUser.specialization || "",
        skills: dbUser.skills || [],
        experienceLevel: dbUser.experienceLevel || "Experienced",
        experienceYears: dbUser.experienceYears || 0,
        industriesServed: dbUser.industriesServed || [],
        softwareTools: dbUser.softwareTools || [],
        preferredProjectTypes: dbUser.preferredProjectTypes || [],
        achievements: dbUser.achievements || "",
        employment: dbUser.employment || [],
        education: dbUser.education || [],
        certifications: dbUser.certifications || [],
        portfolio: dbUser.portfolio || [],
        availability: dbUser.availability || "Available",
        portfolioUrl: dbUser.portfolioUrl || "",
        githubUrl: dbUser.githubUrl || "",
        linkedinUrl: dbUser.linkedinUrl || "",
        workPreferences: dbUser.workPreferences || {
          availability: dbUser.availability || "Available",
          preferredEngagement: "Both",
          preferredProjectDuration: "1_TO_3_MONTHS",
          workingDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
          workingHours: "Flexible",
          timezone: dbUser.timezone || "UTC+05:30 (IST)",
          expectedResponseTime: "Within a few hours",
          preferredCommunicationMethod: "Platform Messages",
          minimumBudget: 0,
          revisionPolicy: "Up to 2 rounds of minor revisions per milestone included.",
        },

        // Client
        organization: dbUser.organization || {
          companyName: dbUser.company || "",
          companyLogo: null,
          industry: "",
          companySize: "1-10",
          companyWebsite: "",
          companyTagline: "",
          companyDescription: "",
          businessLocation: "",
          businessEmail: "",
          businessPhone: "",
          userDesignation: dbUser.designation || "",
        },
        hiringPreferences: dbUser.hiringPreferences || {
          primaryHiringCategories: [],
          preferredExpertise: [],
          typicalBudgetRange: "50K_TO_200K",
          preferredEngagement: "Both",
          preferredProjectDuration: "1_TO_3_MONTHS",
          preferredExperienceLevel: "Intermediate",
          preferredLocation: "",
          preferredLanguages: ["English"],
          preferredCommunicationMethod: "Platform Messages",
          preferredCommunicationHours: "Business hours (IST)",
        },
        contractExpectations: dbUser.contractExpectations || {
          expectedTurnaroundTime: "Within 24 hours",
          standardReviewPeriod: "3 business days",
          preferredRevisionRounds: "2 rounds",
          preferredMilestoneStructure: "Milestone-by-feature deliverable",
          preferredDeliverableFormats: ["GitHub Repository", "Live Staging URL"],
          communicationFrequency: "Milestone check-ins",
          requirementDocPreference: "Detailed PRD with acceptance criteria",
          authorizedApprover: "",
          scopeChangeAuthority: "",
          preferredEscalationMethod: "Direct platform negotiation before AI tribunal",
        },
        privacySettings: dbUser.privacySettings || {
          showEmail: false,
          showPhone: false,
          showPortfolioLinks: true,
          showEarnings: false,
        },
      });
      setHasUnsavedChanges(false);
    }
  }, [dbUser]);

  // Unsaved changes browser prompt
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedChanges]);

  const updateField = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setHasUnsavedChanges(true);
    setProfileSuccess(false);
  };

  const updateNestedField = (parent: string, field: string, value: any) => {
    setFormData((prev: any) => ({
      ...prev,
      [parent]: {
        ...prev[parent],
        [field]: value,
      },
    }));
    setHasUnsavedChanges(true);
    setProfileSuccess(false);
  };



  // ── Image Uploads (Avatar & Logo) ──
  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>, target: "avatar" | "companyLogo") => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setImageError("Please upload a JPEG, PNG, or WebP image.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setImageError("Image size must be less than 5 MB.");
      return;
    }

    setImageError(null);
    if (target === "avatar") setUploadingAvatar(true);
    else setUploadingLogo(true);

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64Data = reader.result as string;
        try {
          const { data } = await api.post("/auth/profile-image", {
            image: base64Data,
            target,
          });

          if (target === "avatar") {
            setDbUser(data.data.user);
          } else {
            updateNestedField("organization", "companyLogo", data.data.companyLogo || data.data.imageUrl);
          }
          setProfileSuccess(true);
          setTimeout(() => setProfileSuccess(false), 3000);
        } catch (err: any) {
          setImageError(err.response?.data?.error || "Failed to upload image. Please try again.");
        } finally {
          if (target === "avatar") setUploadingAvatar(false);
          else setUploadingLogo(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setImageError("Failed to read image file.");
      if (target === "avatar") setUploadingAvatar(false);
      else setUploadingLogo(false);
    }
  };

  // ── Save Entire Profile ──
  const handleSaveProfile = async () => {
    setSavingProfile(true);
    setProfileError(null);
    setProfileSuccess(false);

    try {
      const { data } = await api.put("/auth/profile", formData);
      setDbUser(data.data);
      setHasUnsavedChanges(false);
      setProfileSuccess(true);
      setTimeout(() => setProfileSuccess(false), 4000);
    } catch (err: any) {
      setProfileError(err.response?.data?.error || "Failed to save profile changes.");
    } finally {
      setSavingProfile(false);
    }
  };

  // ── Password Change ──
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError("Please fill out all password fields.");
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError("New password must be at least 8 characters long.");
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
      setTimeout(() => setPasswordSuccess(false), 4000);
    } catch (err: any) {
      let msg = "Failed to update password.";
      if (err.code === "auth/wrong-password" || err.code === "auth/invalid-credential") {
        msg = "Current password is incorrect. Please verify and try again.";
      } else if (err.code === "auth/weak-password") {
        msg = "Password is too weak. Please use letters, numbers, and symbols.";
      } else if (err.message) {
        msg = err.message;
      }
      setPasswordError(msg);
    } finally {
      setChangingPassword(false);
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return "U";
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  // Navigation tabs configuration
  const tabs = useMemo(() => {
    if (isAdmin) {
      return [
        { id: "personal", label: "Admin Profile", icon: User },
        { id: "security", label: "Password & Security", icon: Lock },
      ];
    }
    if (isFreelancer) {
      return [
        { id: "personal", label: "Personal Information", icon: User },
        { id: "expertise", label: "Professional Expertise", icon: Briefcase },
        { id: "history", label: "Employment & Education", icon: GraduationCap },
        { id: "certifications", label: "Certifications", icon: Award },
        { id: "portfolio", label: "Portfolio Projects", icon: FolderGit2 },
        { id: "preferences", label: "Work Preferences", icon: Sliders },
        { id: "privacy", label: "Privacy & Visibility", icon: Eye },
        { id: "security", label: "Password & Security", icon: Lock },
      ];
    }
    // Client
    return [
      { id: "personal", label: "Personal Information", icon: User },
      { id: "organization", label: "Organization & Account", icon: Building },
      { id: "hiring", label: "Hiring Preferences", icon: Sliders },
      { id: "expectations", label: "Contract Expectations", icon: FileCheck2 },
      { id: "privacy", label: "Privacy & Visibility", icon: Eye },
      { id: "security", label: "Password & Security", icon: Lock },
    ];
  }, [isAdmin, isFreelancer]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* ── Top Header Banner ── */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-border shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="flex items-center gap-5">
          {/* Avatar with Camera Overlay */}
          <div className="relative group">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden bg-accent-primary/10 border-2 border-accent-primary/20 flex items-center justify-center text-accent-primary font-bold text-2xl shadow-xs">
              {dbUser?.avatarUrl ? (
                <Image
                  src={dbUser.avatarUrl}
                  alt={formData.name || "Profile"}
                  width={96}
                  height={96}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span>{getInitials(formData.name)}</span>
              )}
            </div>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingAvatar}
              className="absolute inset-0 bg-black/40 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-[11px] font-medium backdrop-blur-xs cursor-pointer"
              title="Upload profile photo"
            >
              {uploadingAvatar ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Camera className="w-5 h-5 mb-0.5" />
                  <span>Change</span>
                </>
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => handleImageFileChange(e, "avatar")}
            />
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-display font-bold text-text-primary tracking-tight">
                {formData.displayName || formData.name || "Your Profile"}
              </h1>
              <span
                className={`text-xs font-mono font-semibold px-2.5 py-0.5 rounded-full border uppercase ${
                  isAdmin
                    ? "bg-amber-500/10 text-amber-700 border-amber-500/30"
                    : isClient
                    ? "bg-blue-500/10 text-blue-700 border-blue-500/30"
                    : "bg-emerald-500/10 text-emerald-700 border-emerald-500/30"
                }`}
              >
                {role}
              </span>
            </div>

            <p className="text-sm text-text-secondary flex items-center gap-2">
              <Mail className="w-4 h-4 text-slate-400" />
              <span>{dbUser?.email || user?.email}</span>
            </p>

            {isFreelancer && formData.professionalTitle && (
              <p className="text-sm font-medium text-accent-primary pt-0.5">
                {formData.professionalTitle}
              </p>
            )}
            {isClient && formData.accountType === "ORGANIZATION" && formData.organization?.companyName && (
              <p className="text-sm font-medium text-slate-700 pt-0.5 flex items-center gap-1.5">
                <Building className="w-4 h-4 text-accent-secondary" />
                <span>{formData.organization.companyName}</span>
                {formData.organization.userDesignation && (
                  <span className="text-text-secondary">• {formData.organization.userDesignation}</span>
                )}
              </p>
            )}
          </div>
        </div>

        {/* Header Actions: Save & Public View */}
        <div className="flex items-center gap-3">
          {dbUser?.id && (
            <Link href={`/profile/${dbUser.id}`}>
              <Button
                variant="outline"
                className="border-border text-text-secondary hover:text-text-primary h-11 px-4 rounded-xl flex items-center gap-2"
              >
                <Eye className="w-4 h-4" />
                <span>View Public Profile</span>
              </Button>
            </Link>
          )}

          <Button
            onClick={handleSaveProfile}
            disabled={savingProfile || !hasUnsavedChanges}
            className={`h-11 px-6 rounded-xl font-medium shadow-xs transition-all flex items-center gap-2 ${
              hasUnsavedChanges
                ? "bg-accent-primary hover:bg-accent-primary/95 text-white ring-2 ring-accent-primary/20"
                : "bg-slate-100 text-slate-400 cursor-not-allowed"
            }`}
          >
            {savingProfile ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>{savingProfile ? "Saving..." : "Save Changes"}</span>
          </Button>
        </div>
      </div>

      {/* ── Status Alerts ── */}
      {hasUnsavedChanges && (
        <div className="p-3.5 bg-amber-50/80 border border-amber-200 rounded-2xl flex items-center justify-between text-xs text-amber-800">
          <span className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <span>You have unsaved profile changes. Make sure to click <strong>Save Changes</strong> before navigating away.</span>
          </span>
          <button
            onClick={handleSaveProfile}
            disabled={savingProfile}
            className="underline font-semibold hover:text-amber-900 cursor-pointer"
          >
            Save now
          </button>
        </div>
      )}

      {profileSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2.5 text-sm text-emerald-800 animate-in fade-in duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <span>Profile changes saved and synchronized successfully!</span>
        </div>
      )}

      {profileError && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-2.5 text-sm text-rose-800 animate-in fade-in duration-200">
          <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
          <span>{profileError}</span>
        </div>
      )}

      {imageError && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-2.5 text-sm text-rose-800">
          <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
          <span>{imageError}</span>
        </div>
      )}

      {/* ── Main Layout: Vertical Tabs Sidebar + Content Panel ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Navigation Sidebar */}
        <aside className="lg:col-span-3 bg-white border border-border rounded-3xl p-3 shadow-xs space-y-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all text-left cursor-pointer ${
                  isActive
                    ? "bg-accent-primary text-white shadow-xs"
                    : "text-text-secondary hover:text-text-primary hover:bg-slate-50"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-slate-400"}`} />
                <span className="flex-1 truncate">{tab.label}</span>
                {isActive && <ChevronRight className="w-4 h-4 text-white/70" />}
              </button>
            );
          })}
        </aside>

        {/* Main Content Area */}
        <main className="lg:col-span-9 bg-white border border-border rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
          {/* ══════════════════════════════════════════════════════════
              TAB 1: PERSONAL INFORMATION
             ══════════════════════════════════════════════════════════ */}
          {activeTab === "personal" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-display font-semibold text-text-primary">
                  Personal Information
                </h2>
                <p className="text-xs text-text-secondary">
                  Your core identity details visible to contract parties.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-semibold text-text-secondary uppercase mb-1.5">
                    Full Legal Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => updateField("name", e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-accent-primary/20"
                    placeholder="e.g. Sreyansu Sekhar Mohanty"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text-secondary uppercase mb-1.5">
                    Public Display Name
                  </label>
                  <input
                    type="text"
                    value={formData.displayName}
                    onChange={(e) => updateField("displayName", e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-accent-primary/20"
                    placeholder="e.g. Sreyansu M."
                  />
                </div>

                {isFreelancer && (
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-text-secondary uppercase mb-1.5">
                      Professional Headline / Title *
                    </label>
                    <input
                      type="text"
                      value={formData.professionalTitle}
                      onChange={(e) => updateField("professionalTitle", e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-accent-primary/20"
                      placeholder="e.g. Senior Full-Stack Architect & Smart Contract Specialist"
                    />
                  </div>
                )}

                {isClient && (
                  <div>
                    <label className="block text-xs font-semibold text-text-secondary uppercase mb-1.5">
                      Designation / Role in Organization
                    </label>
                    <input
                      type="text"
                      value={formData.designation}
                      onChange={(e) => updateField("designation", e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-accent-primary/20"
                      placeholder="e.g. Head of Product / Founder"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-text-secondary uppercase mb-1.5">
                    Contact Phone (Optional)
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => updateField("phone", e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-accent-primary/20"
                    placeholder="+91 98765 43210"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">Kept private unless explicitly shared.</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text-secondary uppercase mb-1.5">
                    Country
                  </label>
                  <input
                    type="text"
                    value={formData.country}
                    onChange={(e) => updateField("country", e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-accent-primary/20"
                    placeholder="e.g. India"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text-secondary uppercase mb-1.5">
                    State / Region
                  </label>
                  <input
                    type="text"
                    value={formData.state}
                    onChange={(e) => updateField("state", e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-accent-primary/20"
                    placeholder="e.g. Karnataka"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text-secondary uppercase mb-1.5">
                    City
                  </label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => updateField("city", e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-accent-primary/20"
                    placeholder="e.g. Bengaluru"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text-secondary uppercase mb-1.5">
                    Time Zone
                  </label>
                  <input
                    type="text"
                    value={formData.timezone}
                    onChange={(e) => updateField("timezone", e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-accent-primary/20"
                    placeholder="UTC+05:30 (IST)"
                  />
                </div>
              </div>

              {/* Bio / About */}
              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase mb-1.5">
                  About / Professional Summary
                </label>
                <textarea
                  rows={4}
                  value={formData.bio}
                  onChange={(e) => updateField("bio", e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-accent-primary/20"
                  placeholder="Describe your background, core strengths, and work approach..."
                />
              </div>

              {/* Languages with Proficiency */}
              <div className="pt-2 border-t border-slate-100">
                <label className="block text-xs font-semibold text-text-secondary uppercase mb-2">
                  Languages Spoken
                </label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {formData.languages.map((lang, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-800 text-xs font-medium border border-slate-200"
                    >
                      <span>{lang.language}</span>
                      <span className="text-[10px] font-mono text-accent-primary">({lang.proficiency})</span>
                      <button
                        type="button"
                        onClick={() => {
                          const updated = formData.languages.filter((_, i) => i !== idx);
                          updateField("languages", updated);
                        }}
                        className="text-slate-400 hover:text-rose-600 ml-1"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>

                <div className="flex items-center gap-2 max-w-md">
                  <input
                    type="text"
                    value={newLanguage}
                    onChange={(e) => setNewLanguage(e.target.value)}
                    placeholder="Add language (e.g. English, Hindi)"
                    className="flex-1 px-3 py-2 rounded-xl border border-border text-xs focus:outline-none focus:ring-2 focus:ring-accent-primary/20"
                  />
                  <select
                    value={newLanguageProficiency}
                    onChange={(e) => setNewLanguageProficiency(e.target.value)}
                    className="px-3 py-2 rounded-xl border border-border text-xs focus:outline-none focus:ring-2 focus:ring-accent-primary/20 bg-white"
                  >
                    <option value="Basic">Basic</option>
                    <option value="Conversational">Conversational</option>
                    <option value="Fluent">Fluent</option>
                    <option value="Native">Native</option>
                  </select>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      if (!newLanguage.trim()) return;
                      updateField("languages", [
                        ...formData.languages,
                        { language: newLanguage.trim(), proficiency: newLanguageProficiency },
                      ]);
                      setNewLanguage("");
                    }}
                    className="h-8 px-3 rounded-lg text-xs"
                  >
                    Add
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════
              TAB 2 (FREELANCER): PROFESSIONAL EXPERTISE
             ══════════════════════════════════════════════════════════ */}
          {activeTab === "expertise" && isFreelancer && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-display font-semibold text-text-primary">
                  Professional Expertise
                </h2>
                <p className="text-xs text-text-secondary">
                  Define your service categories, industry focus, and technical toolkit.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-semibold text-text-secondary uppercase mb-1.5">
                    Primary Professional Category
                  </label>
                  <select
                    value={formData.primaryCategory}
                    onChange={(e) => updateField("primaryCategory", e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-accent-primary/20 bg-white"
                  >
                    <option value="">Select Primary Category</option>
                    <option value="Full-Stack Web Development">Full-Stack Web Development</option>
                    <option value="Mobile Application Development">Mobile Application Development</option>
                    <option value="Frontend Development">Frontend Development</option>
                    <option value="Backend & Cloud Architecture">Backend & Cloud Architecture</option>
                    <option value="UI/UX & Product Design">UI/UX & Product Design</option>
                    <option value="AI / Machine Learning Engineering">AI / Machine Learning Engineering</option>
                    <option value="Smart Contracts & Web3">Smart Contracts & Web3</option>
                    <option value="DevOps & Infrastructure">DevOps & Infrastructure</option>
                    <option value="Quality Assurance & Security Audit">Quality Assurance & Security Audit</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text-secondary uppercase mb-1.5">
                    Specialization / Subcategory
                  </label>
                  <input
                    type="text"
                    value={formData.specialization}
                    onChange={(e) => updateField("specialization", e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-accent-primary/20"
                    placeholder="e.g. Next.js SaaS, High-throughput APIs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text-secondary uppercase mb-1.5">
                    Experience Level
                  </label>
                  <select
                    value={formData.experienceLevel}
                    onChange={(e) => updateField("experienceLevel", e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-accent-primary/20 bg-white"
                  >
                    <option value="Beginner">Beginner (1-2 years)</option>
                    <option value="Intermediate">Intermediate (3-5 years)</option>
                    <option value="Experienced">Experienced (5-8 years)</option>
                    <option value="Expert">Expert (8+ years)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text-secondary uppercase mb-1.5">
                    Years of Experience
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={50}
                    value={formData.experienceYears}
                    onChange={(e) => updateField("experienceYears", Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-accent-primary/20"
                  />
                </div>
              </div>

              {/* Skills Dynamic Tags */}
              <div className="pt-2 border-t border-slate-100">
                <label className="block text-xs font-semibold text-text-secondary uppercase mb-2">
                  Skills & Technologies *
                </label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {formData.skills.map((skill, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent-primary/10 text-accent-primary text-xs font-medium border border-accent-primary/20"
                    >
                      <span>{skill}</span>
                      <button
                        type="button"
                        onClick={() => {
                          const updated = formData.skills.filter((_, i) => i !== idx);
                          updateField("skills", updated);
                        }}
                        className="text-accent-primary/60 hover:text-accent-primary"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>

                <div className="flex items-center gap-2 max-w-md">
                  <input
                    type="text"
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        if (skillInput.trim() && !formData.skills.includes(skillInput.trim())) {
                          updateField("skills", [...formData.skills, skillInput.trim()]);
                          setSkillInput("");
                        }
                      }
                    }}
                    placeholder="Type skill & press Enter (e.g. TypeScript, Docker)"
                    className="flex-1 px-3 py-2 rounded-xl border border-border text-xs focus:outline-none focus:ring-2 focus:ring-accent-primary/20"
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      if (skillInput.trim() && !formData.skills.includes(skillInput.trim())) {
                        updateField("skills", [...formData.skills, skillInput.trim()]);
                        setSkillInput("");
                      }
                    }}
                    className="h-8 px-3 text-xs"
                  >
                    Add
                  </Button>
                </div>
              </div>

              {/* Industries Served */}
              <div className="pt-2 border-t border-slate-100">
                <label className="block text-xs font-semibold text-text-secondary uppercase mb-2">
                  Industries Served
                </label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {formData.industriesServed.map((ind, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-medium border border-slate-200"
                    >
                      <span>{ind}</span>
                      <button
                        type="button"
                        onClick={() => {
                          const updated = formData.industriesServed.filter((_, i) => i !== idx);
                          updateField("industriesServed", updated);
                        }}
                        className="text-slate-400 hover:text-rose-600"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex items-center gap-2 max-w-md">
                  <input
                    type="text"
                    value={industryInput}
                    onChange={(e) => setIndustryInput(e.target.value)}
                    placeholder="e.g. Fintech, Healthcare, E-Commerce"
                    className="flex-1 px-3 py-2 rounded-xl border border-border text-xs focus:outline-none focus:ring-2 focus:ring-accent-primary/20"
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      if (industryInput.trim() && !formData.industriesServed.includes(industryInput.trim())) {
                        updateField("industriesServed", [...formData.industriesServed, industryInput.trim()]);
                        setIndustryInput("");
                      }
                    }}
                    className="h-8 px-3 text-xs"
                  >
                    Add
                  </Button>
                </div>
              </div>

              {/* Software & Tools */}
              <div className="pt-2 border-t border-slate-100">
                <label className="block text-xs font-semibold text-text-secondary uppercase mb-2">
                  Software & Tools Used
                </label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {formData.softwareTools.map((tool, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-medium border border-slate-200"
                    >
                      <span>{tool}</span>
                      <button
                        type="button"
                        onClick={() => {
                          const updated = formData.softwareTools.filter((_, i) => i !== idx);
                          updateField("softwareTools", updated);
                        }}
                        className="text-slate-400 hover:text-rose-600"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex items-center gap-2 max-w-md">
                  <input
                    type="text"
                    value={toolInput}
                    onChange={(e) => setToolInput(e.target.value)}
                    placeholder="e.g. Figma, Postman, AWS, GitHub Actions"
                    className="flex-1 px-3 py-2 rounded-xl border border-border text-xs focus:outline-none focus:ring-2 focus:ring-accent-primary/20"
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      if (toolInput.trim() && !formData.softwareTools.includes(toolInput.trim())) {
                        updateField("softwareTools", [...formData.softwareTools, toolInput.trim()]);
                        setToolInput("");
                      }
                    }}
                    className="h-8 px-3 text-xs"
                  >
                    Add
                  </Button>
                </div>
              </div>

              {/* Achievements */}
              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase mb-1.5">
                  Professional Achievements & Milestones
                </label>
                <textarea
                  rows={3}
                  value={formData.achievements}
                  onChange={(e) => updateField("achievements", e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-accent-primary/20"
                  placeholder="Key accomplishments, open source contributions, high-traffic product launches..."
                />
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════
              TAB 3 (FREELANCER): EMPLOYMENT & EDUCATION
             ══════════════════════════════════════════════════════════ */}
          {activeTab === "history" && isFreelancer && (
            <div className="space-y-8">
              {/* ── Employment Section ── */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-display font-semibold text-text-primary">
                      Employment History
                    </h3>
                    <p className="text-xs text-text-secondary">
                      Past positions and relevant industry track record.
                    </p>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() =>
                      setEditingEmployment({
                        id: new Date().getTime().toString(),
                        organization: "",
                        jobTitle: "",
                        employmentType: "Full-time",
                        startDate: "",
                        endDate: "",
                        currentlyWorking: false,
                        description: "",
                      })
                    }
                    className="bg-accent-primary hover:bg-accent-primary/95 text-white h-9 px-3.5 rounded-xl text-xs flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Employment</span>
                  </Button>
                </div>

                {/* Employment Cards List */}
                <div className="space-y-3">
                  {formData.employment.length === 0 ? (
                    <div className="p-6 border border-dashed border-border rounded-2xl text-center text-xs text-slate-400">
                      No employment history entries added yet.
                    </div>
                  ) : (
                    formData.employment.map((emp) => (
                      <div
                        key={emp.id}
                        className="p-4 rounded-2xl border border-border bg-slate-50/50 flex items-start justify-between gap-4"
                      >
                        <div className="space-y-1">
                          <h4 className="font-semibold text-sm text-text-primary">{emp.jobTitle}</h4>
                          <p className="text-xs font-medium text-slate-700">
                            {emp.organization} • <span className="text-slate-500">{emp.employmentType}</span>
                          </p>
                          <p className="text-[11px] font-mono text-slate-400">
                            {emp.startDate} — {emp.currentlyWorking ? "Present" : emp.endDate || "N/A"}
                          </p>
                          {emp.description && (
                            <p className="text-xs text-text-secondary pt-1">{emp.description}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => setEditingEmployment(emp)}
                            className="p-1.5 text-slate-400 hover:text-accent-primary rounded-lg transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const updated = formData.employment.filter((e) => e.id !== emp.id);
                              updateField("employment", updated);
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Employment Modal / In-place form */}
                {editingEmployment && (
                  <div className="p-5 border border-accent-primary/20 bg-accent-primary/5 rounded-2xl space-y-4">
                    <h4 className="font-semibold text-sm text-text-primary">
                      {formData.employment.some((e) => e.id === editingEmployment.id)
                        ? "Edit Employment Entry"
                        : "New Employment Entry"}
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                          Organization *
                        </label>
                        <input
                          type="text"
                          value={editingEmployment.organization}
                          onChange={(e) =>
                            setEditingEmployment({ ...editingEmployment, organization: e.target.value })
                          }
                          className="w-full px-3 py-2 rounded-xl border border-border text-xs bg-white"
                          placeholder="e.g. Acme Tech Labs"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                          Job Title *
                        </label>
                        <input
                          type="text"
                          value={editingEmployment.jobTitle}
                          onChange={(e) =>
                            setEditingEmployment({ ...editingEmployment, jobTitle: e.target.value })
                          }
                          className="w-full px-3 py-2 rounded-xl border border-border text-xs bg-white"
                          placeholder="e.g. Lead Engineer"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                          Employment Type
                        </label>
                        <select
                          value={editingEmployment.employmentType}
                          onChange={(e) =>
                            setEditingEmployment({ ...editingEmployment, employmentType: e.target.value })
                          }
                          className="w-full px-3 py-2 rounded-xl border border-border text-xs bg-white"
                        >
                          <option value="Full-time">Full-time</option>
                          <option value="Part-time">Part-time</option>
                          <option value="Contract">Contract</option>
                          <option value="Freelance">Freelance</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                          Start Date (Month/Year) *
                        </label>
                        <input
                          type="text"
                          value={editingEmployment.startDate}
                          onChange={(e) =>
                            setEditingEmployment({ ...editingEmployment, startDate: e.target.value })
                          }
                          className="w-full px-3 py-2 rounded-xl border border-border text-xs bg-white"
                          placeholder="e.g. Jan 2022"
                        />
                      </div>
                      <div className="sm:col-span-2 flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="currentlyWorking"
                          checked={editingEmployment.currentlyWorking}
                          onChange={(e) =>
                            setEditingEmployment({
                              ...editingEmployment,
                              currentlyWorking: e.target.checked,
                              endDate: e.target.checked ? null : editingEmployment.endDate,
                            })
                          }
                          className="rounded text-accent-primary focus:ring-accent-primary"
                        />
                        <label htmlFor="currentlyWorking" className="text-xs text-slate-700">
                          I am currently working in this role
                        </label>
                      </div>
                      {!editingEmployment.currentlyWorking && (
                        <div>
                          <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                            End Date (Month/Year)
                          </label>
                          <input
                            type="text"
                            value={editingEmployment.endDate || ""}
                            onChange={(e) =>
                              setEditingEmployment({ ...editingEmployment, endDate: e.target.value })
                            }
                            className="w-full px-3 py-2 rounded-xl border border-border text-xs bg-white"
                            placeholder="e.g. Dec 2024"
                          />
                        </div>
                      )}
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                          Description
                        </label>
                        <textarea
                          rows={2}
                          value={editingEmployment.description || ""}
                          onChange={(e) =>
                            setEditingEmployment({ ...editingEmployment, description: e.target.value })
                          }
                          className="w-full px-3 py-2 rounded-xl border border-border text-xs bg-white"
                          placeholder="Summary of responsibilities and achievements..."
                        />
                      </div>
                    </div>
                    <div className="flex items-center justify-end gap-2 pt-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => setEditingEmployment(null)}
                        className="text-xs"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => {
                          if (!editingEmployment.organization || !editingEmployment.jobTitle) return;
                          const exists = formData.employment.some((e) => e.id === editingEmployment.id);
                          const updated = exists
                            ? formData.employment.map((e) =>
                                e.id === editingEmployment.id ? editingEmployment : e
                              )
                            : [...formData.employment, editingEmployment];
                          updateField("employment", updated);
                          setEditingEmployment(null);
                        }}
                        className="bg-accent-primary text-white text-xs"
                      >
                        Save Employment
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* ── Education Section ── */}
              <div className="space-y-4 pt-6 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-display font-semibold text-text-primary">
                      Education
                    </h3>
                    <p className="text-xs text-text-secondary">
                      Academic degrees and formal qualifications.
                    </p>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() =>
                      setEditingEducation({
                        id: new Date().getTime().toString(),
                        institution: "",
                        degree: "",
                        fieldOfStudy: "",
                        startYear: "",
                        endYear: "",
                        description: "",
                      })
                    }
                    className="bg-accent-primary hover:bg-accent-primary/95 text-white h-9 px-3.5 rounded-xl text-xs flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Education</span>
                  </Button>
                </div>

                <div className="space-y-3">
                  {formData.education.length === 0 ? (
                    <div className="p-6 border border-dashed border-border rounded-2xl text-center text-xs text-slate-400">
                      No education entries added yet.
                    </div>
                  ) : (
                    formData.education.map((edu) => (
                      <div
                        key={edu.id}
                        className="p-4 rounded-2xl border border-border bg-slate-50/50 flex items-start justify-between gap-4"
                      >
                        <div className="space-y-1">
                          <h4 className="font-semibold text-sm text-text-primary">
                            {edu.degree} in {edu.fieldOfStudy}
                          </h4>
                          <p className="text-xs font-medium text-slate-700">{edu.institution}</p>
                          <p className="text-[11px] font-mono text-slate-400">
                            {edu.startYear} — {edu.endYear || "Present"}
                          </p>
                          {edu.description && (
                            <p className="text-xs text-text-secondary pt-1">{edu.description}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => setEditingEducation(edu)}
                            className="p-1.5 text-slate-400 hover:text-accent-primary rounded-lg transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const updated = formData.education.filter((e) => e.id !== edu.id);
                              updateField("education", updated);
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {editingEducation && (
                  <div className="p-5 border border-accent-primary/20 bg-accent-primary/5 rounded-2xl space-y-4">
                    <h4 className="font-semibold text-sm text-text-primary">
                      {formData.education.some((e) => e.id === editingEducation.id)
                        ? "Edit Education"
                        : "New Education Entry"}
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                          Institution *
                        </label>
                        <input
                          type="text"
                          value={editingEducation.institution}
                          onChange={(e) =>
                            setEditingEducation({ ...editingEducation, institution: e.target.value })
                          }
                          className="w-full px-3 py-2 rounded-xl border border-border text-xs bg-white"
                          placeholder="e.g. Indian Institute of Technology"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                          Degree *
                        </label>
                        <input
                          type="text"
                          value={editingEducation.degree}
                          onChange={(e) =>
                            setEditingEducation({ ...editingEducation, degree: e.target.value })
                          }
                          className="w-full px-3 py-2 rounded-xl border border-border text-xs bg-white"
                          placeholder="e.g. Bachelor of Technology (B.Tech)"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                          Field of Study *
                        </label>
                        <input
                          type="text"
                          value={editingEducation.fieldOfStudy}
                          onChange={(e) =>
                            setEditingEducation({ ...editingEducation, fieldOfStudy: e.target.value })
                          }
                          className="w-full px-3 py-2 rounded-xl border border-border text-xs bg-white"
                          placeholder="e.g. Computer Science & Engineering"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                          Start Year *
                        </label>
                        <input
                          type="text"
                          value={editingEducation.startYear}
                          onChange={(e) =>
                            setEditingEducation({ ...editingEducation, startYear: e.target.value })
                          }
                          className="w-full px-3 py-2 rounded-xl border border-border text-xs bg-white"
                          placeholder="e.g. 2018"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                          End Year (or Expected)
                        </label>
                        <input
                          type="text"
                          value={editingEducation.endYear || ""}
                          onChange={(e) =>
                            setEditingEducation({ ...editingEducation, endYear: e.target.value })
                          }
                          className="w-full px-3 py-2 rounded-xl border border-border text-xs bg-white"
                          placeholder="e.g. 2022"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                          Description (Optional)
                        </label>
                        <textarea
                          rows={2}
                          value={editingEducation.description || ""}
                          onChange={(e) =>
                            setEditingEducation({ ...editingEducation, description: e.target.value })
                          }
                          className="w-full px-3 py-2 rounded-xl border border-border text-xs bg-white"
                          placeholder="Honors, activities, key thesis work..."
                        />
                      </div>
                    </div>
                    <div className="flex items-center justify-end gap-2 pt-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => setEditingEducation(null)}
                        className="text-xs"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => {
                          if (!editingEducation.institution || !editingEducation.degree) return;
                          const exists = formData.education.some((e) => e.id === editingEducation.id);
                          const updated = exists
                            ? formData.education.map((e) =>
                                e.id === editingEducation.id ? editingEducation : e
                              )
                            : [...formData.education, editingEducation];
                          updateField("education", updated);
                          setEditingEducation(null);
                        }}
                        className="bg-accent-primary text-white text-xs"
                      >
                        Save Education
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════
              TAB 4 (FREELANCER): CERTIFICATIONS
             ══════════════════════════════════════════════════════════ */}
          {activeTab === "certifications" && isFreelancer && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-display font-semibold text-text-primary">
                    Certifications & Licenses
                  </h2>
                  <p className="text-xs text-text-secondary">
                    Showcase vendor certifications and verifiable credentials.
                  </p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  onClick={() =>
                    setEditingCertification({
                      id: new Date().getTime().toString(),
                      name: "",
                      issuingOrganization: "",
                      issueDate: "",
                      expiryDate: "",
                      credentialId: "",
                      credentialUrl: "",
                    })
                  }
                  className="bg-accent-primary hover:bg-accent-primary/95 text-white h-9 px-3.5 rounded-xl text-xs flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Certification</span>
                </Button>
              </div>

              <div className="space-y-3">
                {formData.certifications.length === 0 ? (
                  <div className="p-8 border border-dashed border-border rounded-2xl text-center text-xs text-slate-400">
                    No certifications added yet. AWS, Google Cloud, Meta, or specialized credentials boost dispute trust.
                  </div>
                ) : (
                  formData.certifications.map((cert) => (
                    <div
                      key={cert.id}
                      className="p-4 rounded-2xl border border-border bg-slate-50/50 flex items-start justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Award className="w-4 h-4 text-amber-500" />
                          <h4 className="font-semibold text-sm text-text-primary">{cert.name}</h4>
                        </div>
                        <p className="text-xs font-medium text-slate-700">{cert.issuingOrganization}</p>
                        <p className="text-[11px] font-mono text-slate-400">
                          Issued: {cert.issueDate} {cert.expiryDate ? `• Expires: ${cert.expiryDate}` : ""}
                        </p>
                        {cert.credentialId && (
                          <p className="text-[11px] text-slate-500 font-mono">ID: {cert.credentialId}</p>
                        )}
                        {cert.credentialUrl && (
                          <a
                            href={cert.credentialUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-accent-primary hover:underline pt-0.5"
                          >
                            <span>Verify Credential</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setEditingCertification(cert)}
                          className="p-1.5 text-slate-400 hover:text-accent-primary rounded-lg transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const updated = formData.certifications.filter((c) => c.id !== cert.id);
                            updateField("certifications", updated);
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {editingCertification && (
                <div className="p-5 border border-accent-primary/20 bg-accent-primary/5 rounded-2xl space-y-4">
                  <h4 className="font-semibold text-sm text-text-primary">
                    {formData.certifications.some((c) => c.id === editingCertification.id)
                      ? "Edit Certification"
                      : "New Certification"}
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                        Certification Name *
                      </label>
                      <input
                        type="text"
                        value={editingCertification.name}
                        onChange={(e) =>
                          setEditingCertification({ ...editingCertification, name: e.target.value })
                        }
                        className="w-full px-3 py-2 rounded-xl border border-border text-xs bg-white"
                        placeholder="e.g. AWS Certified Solutions Architect"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                        Issuing Organization *
                      </label>
                      <input
                        type="text"
                        value={editingCertification.issuingOrganization}
                        onChange={(e) =>
                          setEditingCertification({
                            ...editingCertification,
                            issuingOrganization: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 rounded-xl border border-border text-xs bg-white"
                        placeholder="e.g. Amazon Web Services"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                        Issue Date (Month/Year) *
                      </label>
                      <input
                        type="text"
                        value={editingCertification.issueDate}
                        onChange={(e) =>
                          setEditingCertification({ ...editingCertification, issueDate: e.target.value })
                        }
                        className="w-full px-3 py-2 rounded-xl border border-border text-xs bg-white"
                        placeholder="e.g. Aug 2023"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                        Expiry Date (Optional)
                      </label>
                      <input
                        type="text"
                        value={editingCertification.expiryDate || ""}
                        onChange={(e) =>
                          setEditingCertification({ ...editingCertification, expiryDate: e.target.value })
                        }
                        className="w-full px-3 py-2 rounded-xl border border-border text-xs bg-white"
                        placeholder="e.g. Aug 2026"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                        Credential ID (Optional)
                      </label>
                      <input
                        type="text"
                        value={editingCertification.credentialId || ""}
                        onChange={(e) =>
                          setEditingCertification({
                            ...editingCertification,
                            credentialId: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 rounded-xl border border-border text-xs bg-white"
                        placeholder="e.g. AWS-839210-94"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                        Credential Verification URL (Optional)
                      </label>
                      <input
                        type="url"
                        value={editingCertification.credentialUrl || ""}
                        onChange={(e) =>
                          setEditingCertification({
                            ...editingCertification,
                            credentialUrl: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 rounded-xl border border-border text-xs bg-white"
                        placeholder="https://www.credly.com/badges/..."
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-end gap-2 pt-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => setEditingCertification(null)}
                      className="text-xs"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => {
                        if (!editingCertification.name || !editingCertification.issuingOrganization) return;
                        const exists = formData.certifications.some((c) => c.id === editingCertification.id);
                        const updated = exists
                          ? formData.certifications.map((c) =>
                              c.id === editingCertification.id ? editingCertification : c
                            )
                          : [...formData.certifications, editingCertification];
                        updateField("certifications", updated);
                        setEditingCertification(null);
                      }}
                      className="bg-accent-primary text-white text-xs"
                    >
                      Save Certification
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════
              TAB 5 (FREELANCER): PORTFOLIO PROJECTS
             ══════════════════════════════════════════════════════════ */}
          {activeTab === "portfolio" && isFreelancer && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-display font-semibold text-text-primary">
                    Portfolio Projects
                  </h2>
                  <p className="text-xs text-text-secondary">
                    Showcase tangible deliverables, architecture, and live projects.
                  </p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => {
                    setEditingPortfolio({
                      id: new Date().getTime().toString(),
                      title: "",
                      description: "",
                      role: "",
                      technologies: [],
                      startDate: "",
                      endDate: "",
                      projectUrl: "",
                      images: [],
                      supportingDocs: [],
                    });
                    setPortfolioTechInput("");
                  }}
                  className="bg-accent-primary hover:bg-accent-primary/95 text-white h-9 px-3.5 rounded-xl text-xs flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Project</span>
                </Button>
              </div>

              {/* Projects Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {formData.portfolio.length === 0 ? (
                  <div className="md:col-span-2 p-8 border border-dashed border-border rounded-2xl text-center text-xs text-slate-400">
                    No portfolio projects added yet. Click &quot;Add Project&quot; to showcase your past works.
                  </div>
                ) : (
                  formData.portfolio.map((port) => (
                    <div
                      key={port.id}
                      className="rounded-2xl border border-border p-5 bg-slate-50/50 flex flex-col justify-between space-y-4 hover:border-slate-300 transition-colors"
                    >
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-semibold text-sm text-text-primary">{port.title}</h4>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingPortfolio(port);
                                setPortfolioTechInput("");
                              }}
                              className="p-1 text-slate-400 hover:text-accent-primary"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                const updated = formData.portfolio.filter((p) => p.id !== port.id);
                                updateField("portfolio", updated);
                              }}
                              className="p-1 text-slate-400 hover:text-rose-600"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {port.role && (
                          <p className="text-xs font-medium text-accent-primary">{port.role}</p>
                        )}

                        <p className="text-xs text-text-secondary line-clamp-3">{port.description}</p>

                        {/* Tech tags */}
                        {port.technologies && port.technologies.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {port.technologies.map((t, i) => (
                              <span
                                key={i}
                                className="text-[10px] font-mono px-2 py-0.5 rounded bg-white text-slate-700 border border-slate-200"
                              >
                                {t}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Links and dates footer */}
                      <div className="pt-3 border-t border-slate-200/60 flex items-center justify-between text-xs text-slate-500">
                        <span className="font-mono text-[11px]">
                          {port.startDate || ""} {port.endDate ? `— ${port.endDate}` : ""}
                        </span>
                        {port.projectUrl && (
                          <a
                            href={port.projectUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-accent-primary font-medium hover:underline"
                          >
                            <span>Live Project</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Portfolio Edit Modal / Panel */}
              {editingPortfolio && (
                <div className="p-6 border border-accent-primary/20 bg-accent-primary/5 rounded-3xl space-y-4">
                  <h4 className="font-semibold text-sm text-text-primary">
                    {formData.portfolio.some((p) => p.id === editingPortfolio.id)
                      ? "Edit Portfolio Project"
                      : "New Portfolio Project"}
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                        Project Title *
                      </label>
                      <input
                        type="text"
                        value={editingPortfolio.title}
                        onChange={(e) =>
                          setEditingPortfolio({ ...editingPortfolio, title: e.target.value })
                        }
                        className="w-full px-3 py-2 rounded-xl border border-border text-xs bg-white"
                        placeholder="e.g. Decentralized Escrow Protocol & Dashboard"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                        Your Role in Project
                      </label>
                      <input
                        type="text"
                        value={editingPortfolio.role || ""}
                        onChange={(e) =>
                          setEditingPortfolio({ ...editingPortfolio, role: e.target.value })
                        }
                        className="w-full px-3 py-2 rounded-xl border border-border text-xs bg-white"
                        placeholder="e.g. Lead Frontend Architect"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                        Project URL / Repository
                      </label>
                      <input
                        type="url"
                        value={editingPortfolio.projectUrl || ""}
                        onChange={(e) =>
                          setEditingPortfolio({ ...editingPortfolio, projectUrl: e.target.value })
                        }
                        className="w-full px-3 py-2 rounded-xl border border-border text-xs bg-white"
                        placeholder="https://..."
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                        Start Date
                      </label>
                      <input
                        type="text"
                        value={editingPortfolio.startDate || ""}
                        onChange={(e) =>
                          setEditingPortfolio({ ...editingPortfolio, startDate: e.target.value })
                        }
                        className="w-full px-3 py-2 rounded-xl border border-border text-xs bg-white"
                        placeholder="e.g. Jan 2024"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                        End Date
                      </label>
                      <input
                        type="text"
                        value={editingPortfolio.endDate || ""}
                        onChange={(e) =>
                          setEditingPortfolio({ ...editingPortfolio, endDate: e.target.value })
                        }
                        className="w-full px-3 py-2 rounded-xl border border-border text-xs bg-white"
                        placeholder="e.g. Present"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                        Project Description *
                      </label>
                      <textarea
                        rows={3}
                        value={editingPortfolio.description}
                        onChange={(e) =>
                          setEditingPortfolio({ ...editingPortfolio, description: e.target.value })
                        }
                        className="w-full px-3 py-2 rounded-xl border border-border text-xs bg-white"
                        placeholder="Key problems solved, architectural decisions, and tangible outcomes..."
                      />
                    </div>

                    {/* Technologies tags for this project */}
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                        Technologies / Skills Used
                      </label>
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {editingPortfolio.technologies?.map((tech, i) => (
                          <span
                            key={i}
                            className="inline-flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-full bg-white text-slate-700 border border-slate-200"
                          >
                            <span>{tech}</span>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingPortfolio({
                                  ...editingPortfolio,
                                  technologies: editingPortfolio.technologies.filter((_, idx) => idx !== i),
                                });
                              }}
                              className="text-slate-400 hover:text-rose-600 ml-1"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                      <div className="flex items-center gap-2 max-w-sm">
                        <input
                          type="text"
                          value={portfolioTechInput}
                          onChange={(e) => setPortfolioTechInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              if (
                                portfolioTechInput.trim() &&
                                !editingPortfolio.technologies?.includes(portfolioTechInput.trim())
                              ) {
                                setEditingPortfolio({
                                  ...editingPortfolio,
                                  technologies: [
                                    ...(editingPortfolio.technologies || []),
                                    portfolioTechInput.trim(),
                                  ],
                                });
                                setPortfolioTechInput("");
                              }
                            }
                          }}
                          placeholder="e.g. Next.js, WebSockets"
                          className="flex-1 px-3 py-1.5 rounded-xl border border-border text-xs bg-white"
                        />
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            if (
                              portfolioTechInput.trim() &&
                              !editingPortfolio.technologies?.includes(portfolioTechInput.trim())
                            ) {
                              setEditingPortfolio({
                                ...editingPortfolio,
                                technologies: [
                                  ...(editingPortfolio.technologies || []),
                                  portfolioTechInput.trim(),
                                ],
                              });
                              setPortfolioTechInput("");
                            }
                          }}
                          className="h-8 px-2.5 text-xs"
                        >
                          Add
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => setEditingPortfolio(null)}
                      className="text-xs"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => {
                        if (!editingPortfolio.title || !editingPortfolio.description) return;
                        const exists = formData.portfolio.some((p) => p.id === editingPortfolio.id);
                        const updated = exists
                          ? formData.portfolio.map((p) =>
                              p.id === editingPortfolio.id ? editingPortfolio : p
                            )
                          : [...formData.portfolio, editingPortfolio];
                        updateField("portfolio", updated);
                        setEditingPortfolio(null);
                      }}
                      className="bg-accent-primary text-white text-xs"
                    >
                      Save Project
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════
              TAB 6 (FREELANCER): WORK PREFERENCES
             ══════════════════════════════════════════════════════════ */}
          {activeTab === "preferences" && isFreelancer && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-display font-semibold text-text-primary">
                  Work Preferences & Availability
                </h2>
                <p className="text-xs text-text-secondary">
                  Specify how and when clients can contract you.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-semibold text-text-secondary uppercase mb-1.5">
                    Current Availability Status
                  </label>
                  <select
                    value={formData.workPreferences.availability}
                    onChange={(e) => {
                      updateNestedField("workPreferences", "availability", e.target.value);
                      updateField("availability", e.target.value);
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-accent-primary/20 bg-white"
                  >
                    <option value="Available">Available (Open to new contracts)</option>
                    <option value="Busy">Busy (Limited capacity)</option>
                    <option value="Unavailable">Unavailable (Not taking new work)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text-secondary uppercase mb-1.5">
                    Preferred Engagement Model
                  </label>
                  <select
                    value={formData.workPreferences.preferredEngagement}
                    onChange={(e) =>
                      updateNestedField("workPreferences", "preferredEngagement", e.target.value)
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-accent-primary/20 bg-white"
                  >
                    <option value="Fixed-price">Fixed-price Milestones Only</option>
                    <option value="Hourly">Hourly Contracts Only</option>
                    <option value="Both">Both (Fixed-price & Hourly)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text-secondary uppercase mb-1.5">
                    Preferred Project Duration
                  </label>
                  <select
                    value={formData.workPreferences.preferredProjectDuration}
                    onChange={(e) =>
                      updateNestedField("workPreferences", "preferredProjectDuration", e.target.value)
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-accent-primary/20 bg-white"
                  >
                    <option value="LESS_THAN_1_MONTH">Less than 1 month</option>
                    <option value="1_TO_3_MONTHS">1 to 3 months</option>
                    <option value="3_TO_6_MONTHS">3 to 6 months</option>
                    <option value="MORE_THAN_6_MONTHS">Long-term (6+ months)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text-secondary uppercase mb-1.5">
                    Expected Response Time
                  </label>
                  <select
                    value={formData.workPreferences.expectedResponseTime}
                    onChange={(e) =>
                      updateNestedField("workPreferences", "expectedResponseTime", e.target.value)
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-accent-primary/20 bg-white"
                  >
                    <option value="Within 1 hour">Within 1 hour</option>
                    <option value="Within a few hours">Within a few hours</option>
                    <option value="Within 24 hours">Within 24 hours</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text-secondary uppercase mb-1.5">
                    Preferred Communication Method
                  </label>
                  <select
                    value={formData.workPreferences.preferredCommunicationMethod}
                    onChange={(e) =>
                      updateNestedField("workPreferences", "preferredCommunicationMethod", e.target.value)
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-accent-primary/20 bg-white"
                  >
                    <option value="Platform Messages">Platform Messages (Audit Verifiable)</option>
                    <option value="Video Calls & Platform Messages">Video Calls & Messages</option>
                    <option value="Email & Messages">Email & Messages</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text-secondary uppercase mb-1.5">
                    Minimum Preferred Contract Budget (₹)
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={1000}
                    value={formData.workPreferences.minimumBudget || 0}
                    onChange={(e) =>
                      updateNestedField("workPreferences", "minimumBudget", Number(e.target.value))
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-accent-primary/20"
                    placeholder="e.g. 25000"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase mb-1.5">
                  Standard Revision Policy / Preferences
                </label>
                <textarea
                  rows={2}
                  value={formData.workPreferences.revisionPolicy}
                  onChange={(e) =>
                    updateNestedField("workPreferences", "revisionPolicy", e.target.value)
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-accent-primary/20"
                  placeholder="e.g. Up to 2 minor revision cycles included per milestone."
                />
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════
              TAB 2 (CLIENT): ORGANIZATION & ACCOUNT (Section 3)
             ══════════════════════════════════════════════════════════ */}
          {activeTab === "organization" && isClient && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-display font-semibold text-text-primary">
                  Account & Organization Information
                </h2>
                <p className="text-xs text-text-secondary">
                  Configure whether you are contracting as an Individual or an Organization.
                </p>
              </div>

              {/* Account Type Selector Pill */}
              <div className="flex items-center gap-3 p-1.5 bg-slate-100 rounded-2xl max-w-sm">
                <button
                  type="button"
                  onClick={() => updateField("accountType", "INDIVIDUAL")}
                  className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                    formData.accountType === "INDIVIDUAL"
                      ? "bg-white text-text-primary shadow-xs"
                      : "text-text-secondary hover:text-text-primary"
                  }`}
                >
                  Individual Client
                </button>
                <button
                  type="button"
                  onClick={() => updateField("accountType", "ORGANIZATION")}
                  className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                    formData.accountType === "ORGANIZATION"
                      ? "bg-white text-text-primary shadow-xs"
                      : "text-text-secondary hover:text-text-primary"
                  }`}
                >
                  Organization / Entity
                </button>
              </div>

              {formData.accountType === "ORGANIZATION" && (
                <div className="pt-4 border-t border-slate-100 space-y-6 animate-in fade-in duration-200">
                  {/* Company Logo Upload */}
                  <div className="flex items-center gap-5">
                    <div className="w-16 h-16 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 relative">
                      {formData.organization?.companyLogo ? (
                        <Image
                          src={formData.organization.companyLogo}
                          alt="Company Logo"
                          width={64}
                          height={64}
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <Building className="w-7 h-7" />
                      )}
                      {uploadingLogo && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-white">
                          <Loader2 className="w-4 h-4 animate-spin" />
                        </div>
                      )}
                    </div>
                    <div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={uploadingLogo}
                        onClick={() => logoInputRef.current?.click()}
                        className="text-xs h-8 px-3 rounded-lg"
                      >
                        <Upload className="w-3.5 h-3.5 mr-1.5" />
                        <span>Upload Company Logo</span>
                      </Button>
                      <input
                        ref={logoInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="hidden"
                        onChange={(e) => handleImageFileChange(e, "companyLogo")}
                      />
                      <p className="text-[11px] text-slate-400 mt-1">JPEG, PNG, or WebP. Max 5MB.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-semibold text-text-secondary uppercase mb-1.5">
                        Company / Organization Name *
                      </label>
                      <input
                        type="text"
                        value={formData.organization?.companyName || ""}
                        onChange={(e) => {
                          updateNestedField("organization", "companyName", e.target.value);
                          updateField("company", e.target.value);
                        }}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-accent-primary/20"
                        placeholder="e.g. Acme Studio Inc."
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-text-secondary uppercase mb-1.5">
                        Industry / Sector
                      </label>
                      <input
                        type="text"
                        value={formData.organization?.industry || ""}
                        onChange={(e) => updateNestedField("organization", "industry", e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-accent-primary/20"
                        placeholder="e.g. Financial Technology / SaaS"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-text-secondary uppercase mb-1.5">
                        Company Size
                      </label>
                      <select
                        value={formData.organization?.companySize || "1-10"}
                        onChange={(e) => updateNestedField("organization", "companySize", e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-accent-primary/20 bg-white"
                      >
                        <option value="1-10">1-10 employees</option>
                        <option value="11-50">11-50 employees</option>
                        <option value="51-200">51-200 employees</option>
                        <option value="201-500">201-500 employees</option>
                        <option value="500+">500+ employees</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-text-secondary uppercase mb-1.5">
                        Company Website
                      </label>
                      <input
                        type="url"
                        value={formData.organization?.companyWebsite || ""}
                        onChange={(e) => updateNestedField("organization", "companyWebsite", e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-accent-primary/20"
                        placeholder="https://acme.io"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-text-secondary uppercase mb-1.5">
                        Company Tagline
                      </label>
                      <input
                        type="text"
                        value={formData.organization?.companyTagline || ""}
                        onChange={(e) => updateNestedField("organization", "companyTagline", e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-accent-primary/20"
                        placeholder="e.g. Building the next generation of dispute-free commerce"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-text-secondary uppercase mb-1.5">
                        Company Description
                      </label>
                      <textarea
                        rows={3}
                        value={formData.organization?.companyDescription || ""}
                        onChange={(e) => updateNestedField("organization", "companyDescription", e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-accent-primary/20"
                        placeholder="Overview of your business, mission, and typical contract engagements..."
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-text-secondary uppercase mb-1.5">
                        Business Location / HQ
                      </label>
                      <input
                        type="text"
                        value={formData.organization?.businessLocation || ""}
                        onChange={(e) => updateNestedField("organization", "businessLocation", e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-accent-primary/20"
                        placeholder="e.g. Bengaluru, Karnataka, India"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-text-secondary uppercase mb-1.5">
                        Business Contact Email
                      </label>
                      <input
                        type="email"
                        value={formData.organization?.businessEmail || ""}
                        onChange={(e) => updateNestedField("organization", "businessEmail", e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-accent-primary/20"
                        placeholder="contact@acme.io"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════
              TAB 3 (CLIENT): HIRING PREFERENCES
             ══════════════════════════════════════════════════════════ */}
          {activeTab === "hiring" && isClient && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-display font-semibold text-text-primary">
                  Hiring Preferences
                </h2>
                <p className="text-xs text-text-secondary">
                  Helps match and streamline proposals from qualified freelancers.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-semibold text-text-secondary uppercase mb-1.5">
                    Typical Contract Budget Range
                  </label>
                  <select
                    value={formData.hiringPreferences?.typicalBudgetRange || "50K_TO_200K"}
                    onChange={(e) => updateNestedField("hiringPreferences", "typicalBudgetRange", e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-accent-primary/20 bg-white"
                  >
                    <option value="UNDER_50K">Under ₹50,000</option>
                    <option value="50K_TO_200K">₹50,000 - ₹2,00,000</option>
                    <option value="200K_TO_500K">₹2,00,000 - ₹5,00,000</option>
                    <option value="500K_PLUS">₹5,00,000+</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text-secondary uppercase mb-1.5">
                    Preferred Engagement Model
                  </label>
                  <select
                    value={formData.hiringPreferences?.preferredEngagement || "Both"}
                    onChange={(e) => updateNestedField("hiringPreferences", "preferredEngagement", e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-accent-primary/20 bg-white"
                  >
                    <option value="Fixed-price">Fixed-Price Escrow Milestones</option>
                    <option value="Hourly">Hourly Engagements</option>
                    <option value="Both">Both Fixed-price & Hourly</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text-secondary uppercase mb-1.5">
                    Preferred Freelancer Experience
                  </label>
                  <select
                    value={formData.hiringPreferences?.preferredExperienceLevel || "Intermediate"}
                    onChange={(e) => updateNestedField("hiringPreferences", "preferredExperienceLevel", e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-accent-primary/20 bg-white"
                  >
                    <option value="Any">Any Experience Level</option>
                    <option value="Intermediate">Intermediate (3-5 years)</option>
                    <option value="Experienced">Experienced (5-8 years)</option>
                    <option value="Expert">Expert / Architect (8+ years)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text-secondary uppercase mb-1.5">
                    Communication Hours
                  </label>
                  <input
                    type="text"
                    value={formData.hiringPreferences?.preferredCommunicationHours || "Business hours (IST)"}
                    onChange={(e) => updateNestedField("hiringPreferences", "preferredCommunicationHours", e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-accent-primary/20"
                    placeholder="e.g. 10:00 AM - 6:00 PM IST"
                  />
                </div>
              </div>

              {/* Primary Hiring Categories */}
              <div className="pt-2 border-t border-slate-100">
                <label className="block text-xs font-semibold text-text-secondary uppercase mb-2">
                  Primary Categories You Hire For
                </label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {formData.hiringPreferences?.primaryHiringCategories?.map((cat, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent-primary/10 text-accent-primary text-xs font-medium border border-accent-primary/20"
                    >
                      <span>{cat}</span>
                      <button
                        type="button"
                        onClick={() => {
                          const updated = formData.hiringPreferences.primaryHiringCategories.filter((_, i) => i !== idx);
                          updateNestedField("hiringPreferences", "primaryHiringCategories", updated);
                        }}
                        className="text-accent-primary/60 hover:text-accent-primary"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex items-center gap-2 max-w-md">
                  <input
                    type="text"
                    value={clientCategoryInput}
                    onChange={(e) => setClientCategoryInput(e.target.value)}
                    placeholder="e.g. Frontend, DevOps, AI Development"
                    className="flex-1 px-3 py-2 rounded-xl border border-border text-xs focus:outline-none focus:ring-2 focus:ring-accent-primary/20"
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      if (clientCategoryInput.trim() && !formData.hiringPreferences.primaryHiringCategories.includes(clientCategoryInput.trim())) {
                        updateNestedField("hiringPreferences", "primaryHiringCategories", [
                          ...formData.hiringPreferences.primaryHiringCategories,
                          clientCategoryInput.trim(),
                        ]);
                        setClientCategoryInput("");
                      }
                    }}
                    className="h-8 px-3 text-xs"
                  >
                    Add
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════
              TAB 4 (CLIENT): CONTRACT EXPECTATIONS (ODR PREVENTION)
             ══════════════════════════════════════════════════════════ */}
          {activeTab === "expectations" && isClient && (
            <div className="space-y-6">
              <div>
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-accent-primary" />
                  <h2 className="text-xl font-display font-semibold text-text-primary">
                    Contract & Project Expectations
                  </h2>
                </div>
                <p className="text-xs text-text-secondary mt-1">
                  Default expectations used when creating contracts to eliminate ambiguity and prevent disputes upfront.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-semibold text-text-secondary uppercase mb-1.5">
                    Standard Deliverable Review Period
                  </label>
                  <select
                    value={formData.contractExpectations?.standardReviewPeriod || "3 business days"}
                    onChange={(e) => updateNestedField("contractExpectations", "standardReviewPeriod", e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-accent-primary/20 bg-white"
                  >
                    <option value="2 business days">2 business days</option>
                    <option value="3 business days">3 business days (Standard)</option>
                    <option value="5 business days">5 business days</option>
                    <option value="7 business days">7 calendar days</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text-secondary uppercase mb-1.5">
                    Expected Feedback Turnaround
                  </label>
                  <select
                    value={formData.contractExpectations?.expectedTurnaroundTime || "Within 24 hours"}
                    onChange={(e) => updateNestedField("contractExpectations", "expectedTurnaroundTime", e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-accent-primary/20 bg-white"
                  >
                    <option value="Within 12 hours">Within 12 hours</option>
                    <option value="Within 24 hours">Within 24 hours</option>
                    <option value="Within 48 hours">Within 48 hours</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text-secondary uppercase mb-1.5">
                    Preferred Revision Rounds per Milestone
                  </label>
                  <select
                    value={formData.contractExpectations?.preferredRevisionRounds || "2 rounds"}
                    onChange={(e) => updateNestedField("contractExpectations", "preferredRevisionRounds", e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-accent-primary/20 bg-white"
                  >
                    <option value="1 round">1 round included</option>
                    <option value="2 rounds">2 rounds included</option>
                    <option value="3 rounds">3 rounds included</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text-secondary uppercase mb-1.5">
                    Communication Frequency
                  </label>
                  <select
                    value={formData.contractExpectations?.communicationFrequency || "Milestone check-ins"}
                    onChange={(e) => updateNestedField("contractExpectations", "communicationFrequency", e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-accent-primary/20 bg-white"
                  >
                    <option value="Daily async updates">Daily async updates</option>
                    <option value="Twice a week">Twice a week</option>
                    <option value="Milestone check-ins">Milestone submission check-ins</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text-secondary uppercase mb-1.5">
                    Requirement Documentation Style
                  </label>
                  <input
                    type="text"
                    value={formData.contractExpectations?.requirementDocPreference || ""}
                    onChange={(e) => updateNestedField("contractExpectations", "requirementDocPreference", e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-accent-primary/20"
                    placeholder="e.g. Detailed PRD with acceptance criteria"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text-secondary uppercase mb-1.5">
                    Authorized Scope Change Authority
                  </label>
                  <input
                    type="text"
                    value={formData.contractExpectations?.scopeChangeAuthority || ""}
                    onChange={(e) => updateNestedField("contractExpectations", "scopeChangeAuthority", e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-accent-primary/20"
                    placeholder="e.g. Authorized signatories only"
                  />
                </div>
              </div>

              <div className="p-4 bg-indigo-50/60 border border-indigo-100 rounded-2xl flex items-start gap-3">
                <Info className="w-4 h-4 text-accent-primary flex-shrink-0 mt-0.5" />
                <p className="text-xs text-indigo-900 leading-relaxed">
                  <strong>Notice:</strong> These profile preferences are templates designed to streamline contract creation. When generating contracts, parties must agree upon and record the final binding terms in the contract itself.
                </p>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════
              TAB: PRIVACY & VISIBILITY (Section 7)
             ══════════════════════════════════════════════════════════ */}
          {activeTab === "privacy" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-display font-semibold text-text-primary">
                  Privacy & Field Visibility
                </h2>
                <p className="text-xs text-text-secondary">
                  Control what information is displayed on your public profile versus kept private.
                </p>
              </div>

              <div className="space-y-4">
                <div className="p-4 rounded-2xl border border-border bg-slate-50/60 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <p className="text-sm font-semibold text-text-primary">Public Email Address</p>
                    <p className="text-xs text-text-secondary">
                      Show your registered email on your public profile card.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.privacySettings?.showEmail || false}
                    onChange={(e) => updateNestedField("privacySettings", "showEmail", e.target.checked)}
                    className="h-4 w-4 rounded text-accent-primary focus:ring-accent-primary"
                  />
                </div>

                <div className="p-4 rounded-2xl border border-border bg-slate-50/60 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <p className="text-sm font-semibold text-text-primary">Public Contact Phone</p>
                    <p className="text-xs text-text-secondary">
                      Allow prospective counterparties to view your contact number before contract creation.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.privacySettings?.showPhone || false}
                    onChange={(e) => updateNestedField("privacySettings", "showPhone", e.target.checked)}
                    className="h-4 w-4 rounded text-accent-primary focus:ring-accent-primary"
                  />
                </div>

                <div className="p-4 rounded-2xl border border-border bg-slate-50/60 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <p className="text-sm font-semibold text-text-primary">Show Portfolio & Professional Links</p>
                    <p className="text-xs text-text-secondary">
                      Display project live links, GitHub, and LinkedIn URLs publicly.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.privacySettings?.showPortfolioLinks !== false}
                    onChange={(e) => updateNestedField("privacySettings", "showPortfolioLinks", e.target.checked)}
                    className="h-4 w-4 rounded text-accent-primary focus:ring-accent-primary"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════
              TAB: PASSWORD & SECURITY (Section 6 of requirements)
             ══════════════════════════════════════════════════════════ */}
          {activeTab === "security" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-display font-semibold text-text-primary">
                  Password & Account Security
                </h2>
                <p className="text-xs text-text-secondary">
                  Update your authentication credentials securely via Firebase.
                </p>
              </div>

              {passwordSuccess && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2.5 text-sm text-emerald-800">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                  <span>Password updated successfully.</span>
                </div>
              )}

              {passwordError && (
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-2.5 text-sm text-rose-800">
                  <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
                  <span>{passwordError}</span>
                </div>
              )}

              <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
                <div>
                  <label className="block text-xs font-semibold text-text-secondary uppercase mb-1.5">
                    Current Password
                  </label>
                  <div className="relative">
                    <input
                      type={showCurrentPassword ? "text" : "password"}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full px-3.5 py-2.5 pr-10 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-accent-primary/20"
                      placeholder="Enter current password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text-secondary uppercase mb-1.5">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-3.5 py-2.5 pr-10 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-accent-primary/20"
                      placeholder="At least 8 characters"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text-secondary uppercase mb-1.5">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full px-3.5 py-2.5 pr-10 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-accent-primary/20"
                      placeholder="Confirm your new password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={changingPassword}
                  className="bg-accent-primary hover:bg-accent-primary/95 text-white h-11 px-6 rounded-xl font-medium shadow-xs"
                >
                  {changingPassword ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      <span>Updating Password...</span>
                    </>
                  ) : (
                    "Update Password"
                  )}
                </Button>
              </form>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
