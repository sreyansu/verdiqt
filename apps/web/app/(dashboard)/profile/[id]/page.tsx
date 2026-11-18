"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  User,
  Building,
  Briefcase,
  MapPin,
  Clock,
  Globe,
  Award,
  GraduationCap,
  FolderGit2,
  ExternalLink,
  Shield,
  ArrowLeft,
  Mail,
  Phone,
  CheckCircle2,
  Calendar,
  Sparkles,
  Layers,
  ChevronRight,
  Loader2,
  AlertCircle,
  FileCheck2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/providers/AuthProvider";
import { useUserStore } from "@/store/userStore";
import api from "@/lib/api";

export default function PublicProfileViewPage() {
  const params = useParams();
  const router = useRouter();
  const profileId = String(params?.id || "");
  const { user } = useAuth();
  const { dbUser } = useUserStore();

  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isOwnProfile = Boolean(
    dbUser && (dbUser.id === profileId || (dbUser as any)._id === profileId || dbUser.clerkId === profileId)
  );

  useEffect(() => {
    async function loadProfile() {
      if (!profileId) return;
      setLoading(true);
      setError(null);

      try {
        const { data } = await api.get(`/users/${profileId}/profile`);
        setProfile(data.data);
      } catch (err: any) {
        console.error("Failed to load public profile:", err);
        setError(err.response?.data?.error || "Profile could not be found or is unavailable.");
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, [profileId]);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-20 text-center space-y-4">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-accent-primary" />
        <p className="text-sm text-text-secondary">Loading profile...</p>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-200">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-slate-900">Profile Not Found</h2>
        <p className="text-sm text-slate-500">{error || "This user profile does not exist or has been removed."}</p>
        <Link href="/dashboard">
          <Button variant="outline" className="rounded-xl mt-2">
            Back to Dashboard
          </Button>
        </Link>
      </div>
    );
  }

  const isFreelancer = profile.role === "FREELANCER";
  const isClient = profile.role === "CLIENT";

  const getInitials = (name?: string) => {
    if (!name) return "U";
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-xs font-semibold text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>

        {isOwnProfile && (
          <Link href="/profile">
            <Button size="sm" variant="outline" className="h-9 px-4 rounded-xl text-xs flex items-center gap-1.5">
              <span>Edit Your Profile</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        )}
      </div>

      {/* ── Main Profile Header Card ── */}
      <div className="bg-white rounded-3xl p-6 sm:p-10 border border-border shadow-xs relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            {/* Avatar */}
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl overflow-hidden bg-accent-primary/10 border-2 border-accent-primary/20 flex items-center justify-center text-accent-primary font-bold text-3xl shadow-xs flex-shrink-0">
              {profile.avatarUrl ? (
                <Image
                  src={profile.avatarUrl}
                  alt={profile.displayName || profile.name}
                  width={112}
                  height={112}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span>{getInitials(profile.displayName || profile.name)}</span>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-display font-bold text-text-primary tracking-tight">
                  {profile.displayName || profile.name}
                </h1>
                <span
                  className={`text-xs font-mono font-semibold px-2.5 py-0.5 rounded-full border uppercase ${
                    profile.role === "ADMIN"
                      ? "bg-amber-500/10 text-amber-700 border-amber-500/30"
                      : isClient
                      ? "bg-blue-500/10 text-blue-700 border-blue-500/30"
                      : "bg-emerald-500/10 text-emerald-700 border-emerald-500/30"
                  }`}
                >
                  {profile.role}
                </span>

                {isFreelancer && profile.availability && (
                  <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>{profile.availability}</span>
                  </span>
                )}
              </div>

              {isFreelancer && profile.professionalTitle && (
                <p className="text-base font-semibold text-accent-primary">
                  {profile.professionalTitle}
                </p>
              )}

              {isClient && profile.organization?.companyName && (
                <p className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                  <Building className="w-4 h-4 text-accent-secondary" />
                  <span>{profile.organization.companyName}</span>
                  {profile.organization.userDesignation && (
                    <span className="text-text-secondary font-normal">• {profile.organization.userDesignation}</span>
                  )}
                </p>
              )}

              {/* Location, Timezone, Languages line */}
              <div className="flex items-center gap-4 text-xs text-text-secondary flex-wrap pt-1">
                {(profile.city || profile.country) && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>{[profile.city, profile.country].filter(Boolean).join(", ")}</span>
                  </span>
                )}
                {profile.timezone && (
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>{profile.timezone}</span>
                  </span>
                )}
                {profile.languages && profile.languages.length > 0 && (
                  <span className="flex items-center gap-1">
                    <Globe className="w-3.5 h-3.5 text-slate-400" />
                    <span>
                      {profile.languages.map((l: any) => `${l.language} (${l.proficiency})`).join(", ")}
                    </span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Action CTA for Clients viewing Freelancers */}
          {isFreelancer && !isOwnProfile && (
            <div className="flex items-center gap-3">
              <Link href={`/contracts/new?freelancerId=${profile.id}`}>
                <Button className="h-11 px-6 bg-accent-primary hover:bg-accent-primary/95 text-white font-medium text-sm rounded-xl shadow-xs transition-all flex items-center gap-2">
                  <span>Propose Contract</span>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* Bio */}
        {profile.bio && (
          <div className="mt-6 pt-6 border-t border-slate-100">
            <h3 className="text-xs font-semibold text-text-secondary uppercase mb-2">About</h3>
            <p className="text-sm text-text-primary leading-relaxed whitespace-pre-line">{profile.bio}</p>
          </div>
        )}

        {/* Links: Portfolio / GitHub / LinkedIn (if permitted by privacy) */}
        {(profile.portfolioUrl || profile.githubUrl || profile.linkedinUrl) && (
          <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-4 flex-wrap text-xs">
            {profile.portfolioUrl && (
              <a
                href={profile.portfolioUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent-primary hover:underline flex items-center gap-1"
              >
                <Globe className="w-3.5 h-3.5" />
                <span>Portfolio Website</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
            {profile.githubUrl && (
              <a
                href={profile.githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-700 hover:text-slate-900 flex items-center gap-1"
              >
                <FolderGit2 className="w-3.5 h-3.5" />
                <span>GitHub Profile</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
            {profile.linkedinUrl && (
              <a
                href={profile.linkedinUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline flex items-center gap-1"
              >
                <ExternalLink className="w-3 h-3" />
                <span>LinkedIn</span>
              </a>
            )}
          </div>
        )}
      </div>

      {/* ── FREELANCER PUBLIC PROFILE CONTENT ── */}
      {isFreelancer && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left / Main Column */}
          <div className="lg:col-span-8 space-y-8">
            {/* Skills & Categories */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-border shadow-xs space-y-4">
              <h3 className="text-lg font-display font-semibold text-text-primary">
                Skills & Technical Expertise
              </h3>

              {profile.primaryCategory && (
                <div className="pb-2">
                  <span className="text-xs text-text-secondary">Primary Category:</span>
                  <p className="text-sm font-semibold text-slate-900">
                    {profile.primaryCategory} {profile.specialization ? `• ${profile.specialization}` : ""}
                  </p>
                </div>
              )}

              {profile.skills && profile.skills.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {profile.skills.map((skill: string, idx: number) => (
                    <span
                      key={idx}
                      className="px-3 py-1 rounded-full bg-accent-primary/10 text-accent-primary text-xs font-semibold border border-accent-primary/20"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              )}

              {profile.softwareTools && profile.softwareTools.length > 0 && (
                <div className="pt-3 border-t border-slate-100">
                  <span className="text-xs font-medium text-slate-500 block mb-2">Tools & Environments:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {profile.softwareTools.map((tool: string, idx: number) => (
                      <span
                        key={idx}
                        className="text-[11px] font-mono px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200"
                      >
                        {tool}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Portfolio Showcase */}
            {profile.portfolio && profile.portfolio.length > 0 && (
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-border shadow-xs space-y-6">
                <div className="flex items-center gap-2">
                  <FolderGit2 className="w-5 h-5 text-accent-primary" />
                  <h3 className="text-lg font-display font-semibold text-text-primary">
                    Portfolio & Featured Deliverables
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {profile.portfolio.map((item: any) => (
                    <div
                      key={item.id}
                      className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between space-y-3"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-semibold text-sm text-slate-900">{item.title}</h4>
                          {item.projectUrl && (
                            <a
                              href={item.projectUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-accent-primary hover:text-accent-primary/80"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>
                        {item.role && <p className="text-xs font-medium text-accent-primary">{item.role}</p>}
                        <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">{item.description}</p>
                        {item.technologies && item.technologies.length > 0 && (
                          <div className="flex flex-wrap gap-1 pt-1">
                            {item.technologies.map((t: string, i: number) => (
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

                      {item.startDate && (
                        <p className="text-[11px] font-mono text-slate-400 pt-2 border-t border-slate-200/60">
                          {item.startDate} {item.endDate ? `— ${item.endDate}` : ""}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Employment History Timeline */}
            {profile.employment && profile.employment.length > 0 && (
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-border shadow-xs space-y-6">
                <div className="flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-accent-primary" />
                  <h3 className="text-lg font-display font-semibold text-text-primary">
                    Employment History
                  </h3>
                </div>

                <div className="space-y-4">
                  {profile.employment.map((emp: any) => (
                    <div
                      key={emp.id}
                      className="p-4 rounded-2xl border border-border bg-slate-50/50 space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-sm text-text-primary">{emp.jobTitle}</h4>
                        <span className="text-[11px] font-mono text-slate-500">
                          {emp.startDate} — {emp.currentlyWorking ? "Present" : emp.endDate || "N/A"}
                        </span>
                      </div>
                      <p className="text-xs font-medium text-slate-700">
                        {emp.organization} • <span className="text-slate-500">{emp.employmentType}</span>
                      </p>
                      {emp.description && (
                        <p className="text-xs text-text-secondary pt-1 leading-relaxed">{emp.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Education & Certifications */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {profile.education && profile.education.length > 0 && (
                <div className="bg-white rounded-3xl p-6 border border-border shadow-xs space-y-4">
                  <div className="flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-accent-primary" />
                    <h3 className="font-semibold text-sm text-text-primary">Education</h3>
                  </div>
                  <div className="space-y-3">
                    {profile.education.map((edu: any) => (
                      <div key={edu.id} className="text-xs space-y-0.5">
                        <p className="font-semibold text-slate-900">{edu.degree} in {edu.fieldOfStudy}</p>
                        <p className="text-slate-600">{edu.institution}</p>
                        <p className="text-[11px] font-mono text-slate-400">{edu.startYear} — {edu.endYear || "Present"}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {profile.certifications && profile.certifications.length > 0 && (
                <div className="bg-white rounded-3xl p-6 border border-border shadow-xs space-y-4">
                  <div className="flex items-center gap-2">
                    <Award className="w-4 h-4 text-amber-500" />
                    <h3 className="font-semibold text-sm text-text-primary">Certifications</h3>
                  </div>
                  <div className="space-y-3">
                    {profile.certifications.map((cert: any) => (
                      <div key={cert.id} className="text-xs space-y-0.5">
                        <p className="font-semibold text-slate-900">{cert.name}</p>
                        <p className="text-slate-600">{cert.issuingOrganization}</p>
                        <p className="text-[11px] font-mono text-slate-400">Issued: {cert.issueDate}</p>
                        {cert.credentialUrl && (
                          <a
                            href={cert.credentialUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] text-accent-primary hover:underline pt-0.5"
                          >
                            <span>Verify</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Work Preferences Sidebar */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white rounded-3xl p-6 border border-border shadow-xs space-y-4">
              <h3 className="font-display font-semibold text-sm text-text-primary">
                Work & Engagement Terms
              </h3>

              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <span className="text-text-secondary">Engagement:</span>
                  <span className="font-semibold text-slate-900">
                    {profile.workPreferences?.preferredEngagement || "Fixed-price / Hourly"}
                  </span>
                </div>

                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <span className="text-text-secondary">Experience:</span>
                  <span className="font-semibold text-slate-900">
                    {profile.experienceLevel || "Experienced"} ({profile.experienceYears || 0} yrs)
                  </span>
                </div>

                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <span className="text-text-secondary">Response Time:</span>
                  <span className="font-semibold text-slate-900">
                    {profile.workPreferences?.expectedResponseTime || "Within 24 hours"}
                  </span>
                </div>

                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <span className="text-text-secondary">Communication:</span>
                  <span className="font-semibold text-slate-900">
                    {profile.workPreferences?.preferredCommunicationMethod || "Platform Messages"}
                  </span>
                </div>

                {profile.workPreferences?.minimumBudget ? (
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <span className="text-text-secondary">Min. Budget:</span>
                    <span className="font-mono font-semibold text-slate-900">
                      ₹{profile.workPreferences.minimumBudget.toLocaleString()}
                    </span>
                  </div>
                ) : null}

                {profile.workPreferences?.revisionPolicy && (
                  <div className="pt-1">
                    <span className="text-text-secondary block mb-1">Standard Revision Policy:</span>
                    <p className="text-xs text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                      {profile.workPreferences.revisionPolicy}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── CLIENT PUBLIC PROFILE CONTENT ── */}
      {isClient && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-8 space-y-6">
            {profile.accountType === "ORGANIZATION" && profile.organization && (
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-border shadow-xs space-y-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-display font-semibold text-text-primary">
                      {profile.organization.companyName || "Organization Overview"}
                    </h3>
                    {profile.organization.companyTagline && (
                      <p className="text-xs text-text-secondary mt-0.5">{profile.organization.companyTagline}</p>
                    )}
                  </div>
                  {profile.organization.companyLogo && (
                    <div className="w-14 h-14 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 flex-shrink-0">
                      <Image
                        src={profile.organization.companyLogo}
                        alt="Company Logo"
                        width={56}
                        height={56}
                        className="w-full h-full object-contain"
                      />
                    </div>
                  )}
                </div>

                {profile.organization.companyDescription && (
                  <p className="text-sm text-slate-700 leading-relaxed">{profile.organization.companyDescription}</p>
                )}

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-3 border-t border-slate-100 text-xs">
                  {profile.organization.industry && (
                    <div>
                      <span className="text-text-secondary block">Industry</span>
                      <span className="font-semibold text-slate-900">{profile.organization.industry}</span>
                    </div>
                  )}
                  {profile.organization.companySize && (
                    <div>
                      <span className="text-text-secondary block">Company Size</span>
                      <span className="font-semibold text-slate-900">{profile.organization.companySize} employees</span>
                    </div>
                  )}
                  {profile.organization.companyWebsite && (
                    <div>
                      <span className="text-text-secondary block">Website</span>
                      <a
                        href={profile.organization.companyWebsite}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-semibold text-accent-primary hover:underline inline-flex items-center gap-1"
                      >
                        <span>Visit Site</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Standard Contract Expectations */}
            {profile.contractExpectations && (
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-border shadow-xs space-y-4">
                <div className="flex items-center gap-2">
                  <FileCheck2 className="w-5 h-5 text-accent-primary" />
                  <h3 className="text-lg font-display font-semibold text-text-primary">
                    Standard Project Expectations
                  </h3>
                </div>
                <p className="text-xs text-text-secondary">
                  Standards this client establishes for contract milestones to prevent delivery disputes.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-2">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-text-secondary block">Deliverable Review Period:</span>
                    <span className="font-semibold text-slate-900">
                      {profile.contractExpectations.standardReviewPeriod || "3 business days"}
                    </span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-text-secondary block">Feedback Turnaround:</span>
                    <span className="font-semibold text-slate-900">
                      {profile.contractExpectations.expectedTurnaroundTime || "Within 24 hours"}
                    </span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-text-secondary block">Revision Rounds:</span>
                    <span className="font-semibold text-slate-900">
                      {profile.contractExpectations.preferredRevisionRounds || "2 rounds"}
                    </span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-text-secondary block">Milestone Structure:</span>
                    <span className="font-semibold text-slate-900">
                      {profile.contractExpectations.preferredMilestoneStructure || "Milestone-by-feature"}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Hiring Preferences */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white rounded-3xl p-6 border border-border shadow-xs space-y-4">
              <h3 className="font-display font-semibold text-sm text-text-primary">
                Hiring Profile
              </h3>

              <div className="space-y-3 text-xs">
                {profile.hiringPreferences?.typicalBudgetRange && (
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <span className="text-text-secondary">Typical Budget:</span>
                    <span className="font-semibold text-slate-900">{profile.hiringPreferences.typicalBudgetRange}</span>
                  </div>
                )}
                {profile.hiringPreferences?.preferredEngagement && (
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <span className="text-text-secondary">Engagement:</span>
                    <span className="font-semibold text-slate-900">{profile.hiringPreferences.preferredEngagement}</span>
                  </div>
                )}
                {profile.hiringPreferences?.preferredExperienceLevel && (
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <span className="text-text-secondary">Preferred Level:</span>
                    <span className="font-semibold text-slate-900">{profile.hiringPreferences.preferredExperienceLevel}</span>
                  </div>
                )}
              </div>

              {profile.hiringPreferences?.primaryHiringCategories?.length > 0 && (
                <div className="pt-2">
                  <span className="text-xs text-text-secondary block mb-1.5">Categories Hired:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {profile.hiringPreferences.primaryHiringCategories.map((c: string, i: number) => (
                      <span
                        key={i}
                        className="text-[11px] px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-medium"
                      >
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

