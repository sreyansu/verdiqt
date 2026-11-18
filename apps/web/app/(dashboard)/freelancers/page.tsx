"use client";

import { useState, useEffect, useTransition, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Search,
  Filter,
  MapPin,
  Clock,
  Briefcase,
  Star,
  ArrowRight,
  UserCheck,
  Globe,
  SlidersHorizontal,
  X,
  Loader2,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  MessageSquare,
  Award,
  Zap,
  LayoutGrid,
  List,
  FolderGit2,
  Lock,
  ChevronRight,
} from "lucide-react";
import { useAuthenticatedApi } from "@/lib/useAuthenticatedApi";
import { useUserStore } from "@/store/userStore";

const CATEGORIES = [
  "All Categories",
  "Full-Stack Development",
  "Frontend Development",
  "Backend Development",
  "Mobile App Development",
  "UI/UX Design",
  "AI & Machine Learning",
  "Cloud & DevOps",
  "Smart Contracts & Web3",
];

const POPULAR_SKILLS = [
  "React",
  "Next.js",
  "Node.js",
  "TypeScript",
  "UI/UX Design",
  "Python",
  "Figma",
  "Smart Contracts",
  "DevOps",
];

export default function FreelancersDiscoveryPage() {
  const router = useRouter();
  const api = useAuthenticatedApi();
  const { dbUser } = useUserStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All Categories");
  const [experienceLevel, setExperienceLevel] = useState("ALL");
  const [availability, setAvailability] = useState("ALL");
  const [sortBy, setSortBy] = useState("recent");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [currentPage, setCurrentPage] = useState(1);

  const [freelancers, setFreelancers] = useState<any[]>([]);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    pageSize: 12,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(true);

  const fetchFreelancers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery.trim()) params.set("q", searchQuery.trim());
      if (selectedCategory && selectedCategory !== "All Categories") {
        params.set("category", selectedCategory);
      }
      if (experienceLevel && experienceLevel !== "ALL") {
        params.set("experienceLevel", experienceLevel);
      }
      if (availability && availability !== "ALL") {
        params.set("availability", availability);
      }
      if (sortBy) params.set("sort", sortBy);
      params.set("page", String(currentPage));
      params.set("limit", "12");

      const { data } = await api.get(`/users/freelancers?${params.toString()}`);
      if (data.success) {
        setFreelancers(data.data || []);
        if (data.pagination) setPagination(data.pagination);
      }
    } catch (err) {
      console.error("Failed to fetch freelancers:", err);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, selectedCategory, experienceLevel, availability, sortBy, currentPage, api]);

  // Debounced search trigger
  useEffect(() => {
    const handler = setTimeout(() => {
      fetchFreelancers();
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery, selectedCategory, experienceLevel, availability, sortBy, currentPage]);

  const resetFilters = () => {
    setSearchQuery("");
    setSelectedCategory("All Categories");
    setExperienceLevel("ALL");
    setAvailability("ALL");
    setSortBy("recent");
    setCurrentPage(1);
  };

  const handleQuickSkillClick = (skill: string) => {
    setSearchQuery(skill);
    setCurrentPage(1);
  };

  const hasActiveFilters =
    searchQuery.trim() !== "" ||
    selectedCategory !== "All Categories" ||
    experienceLevel !== "ALL" ||
    availability !== "ALL";

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-20">
      {/* ── Freelancer Role Notice Banner (if signed in as freelancer) ── */}
      {dbUser?.role === "FREELANCER" && (
        <div className="bg-sky-50 border border-sky-200 text-sky-800 px-4 py-3 rounded-2xl text-xs flex items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-sky-600 flex-shrink-0" />
            <span>
              <strong>You are browsing the talent directory as a Freelancer.</strong> Looking to update your own discoverability, skills, or portfolio?
            </span>
          </div>
          <Link
            href="/profile"
            className="font-semibold underline hover:text-sky-900 whitespace-nowrap"
          >
            Edit Profile →
          </Link>
        </div>
      )}

      {/* ── Upwork / Marketplace Hero Header ── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 border border-slate-800/80 p-6 sm:p-10 text-white shadow-2xl">
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent-primary/20 text-accent-primary text-xs font-semibold tracking-wide border border-accent-primary/30 backdrop-blur-xs">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Verdiqt Verified Talent Marketplace</span>
            <span className="text-slate-400">•</span>
            <span className="text-slate-300">Milestone Escrow & AI Arbitration</span>
          </div>

          <h1 className="font-display text-2xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white leading-tight">
            Hire Verified Freelancers <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-accent-primary via-sky-400 to-emerald-400 bg-clip-text text-transparent">
              Backed by Safe Escrow
            </span>
          </h1>

          <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl font-normal">
            Discover vetted engineers, designers, and specialists. Collaborate with authenticated deliverables, cryptographic chat, and automated milestone settlements.
          </p>

          {/* Upwork-style High Impact Search Bar */}
          <div className="pt-2">
            <div className="relative flex items-center max-w-2xl bg-white rounded-2xl shadow-xl p-1.5 focus-within:ring-2 focus-within:ring-accent-primary transition-all">
              <Search className="w-5 h-5 text-slate-400 ml-3 mr-2 flex-shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search by title, skills, or expertise (e.g. Full-Stack, Next.js, UI/UX, Python, Web3)..."
                className="w-full bg-transparent border-none text-slate-900 placeholder:text-slate-400 text-sm focus:outline-none py-2"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 mr-2 cursor-pointer"
                  title="Clear search"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              <Button
                onClick={() => fetchFreelancers()}
                className="bg-accent-primary hover:bg-accent-primary/90 text-white rounded-xl px-5 py-2 text-xs font-semibold h-10 shadow-sm cursor-pointer"
              >
                Search
              </Button>
            </div>

            {/* Popular skill quick tags */}
            <div className="flex items-center gap-2 pt-3 flex-wrap text-xs text-slate-300">
              <span className="flex items-center gap-1 text-[11px] font-medium text-slate-400">
                <Zap className="w-3 h-3 text-amber-400" />
                Popular:
              </span>
              {POPULAR_SKILLS.map((skill) => (
                <button
                  key={skill}
                  onClick={() => handleQuickSkillClick(skill)}
                  className={`text-[11px] px-2.5 py-0.5 rounded-full transition-colors cursor-pointer ${
                    searchQuery.toLowerCase() === skill.toLowerCase()
                      ? "bg-accent-primary text-white font-semibold"
                      : "bg-white/10 hover:bg-white/20 text-slate-200 border border-white/10"
                  }`}
                >
                  {skill}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Decorative background gradients */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-accent-primary/20 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* ── Marketplace Value Proposition Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 flex items-start gap-3.5 shadow-2xs hover:border-slate-300 transition-colors">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-slate-900 text-xs sm:text-sm">Protected Milestone Escrow</h4>
            <p className="text-slate-500 text-[11px] sm:text-xs mt-0.5 leading-relaxed">
              Funds stay safely in escrow until you inspect and approve each deliverable.
            </p>
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 flex items-start gap-3.5 shadow-2xs hover:border-slate-300 transition-colors">
          <div className="w-10 h-10 rounded-xl bg-accent-primary/10 text-accent-primary flex items-center justify-center flex-shrink-0">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-slate-900 text-xs sm:text-sm">Verified Credentials & Work</h4>
            <p className="text-slate-500 text-[11px] sm:text-xs mt-0.5 leading-relaxed">
              Review authentic employment history, verified portfolio items, and skills.
            </p>
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 flex items-start gap-3.5 shadow-2xs hover:border-slate-300 transition-colors">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-slate-900 text-xs sm:text-sm">AI Tribunal Dispute Defense</h4>
            <p className="text-slate-500 text-[11px] sm:text-xs mt-0.5 leading-relaxed">
              Cryptographically signed chat and deliverables provide undeniable arbitration evidence.
            </p>
          </div>
        </div>
      </div>

      {/* ── Category Pills Bar ── */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {CATEGORIES.map((cat) => {
            const isActive = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => {
                  setSelectedCategory(cat);
                  setCurrentPage(1);
                }}
                className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? "bg-slate-900 text-white shadow-sm ring-2 ring-slate-900/20"
                    : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Filter & Toolbar Controls ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-border shadow-xs">
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs text-text-secondary font-medium mr-1">
            <SlidersHorizontal className="w-4 h-4 text-slate-400" />
            <span>Filter by:</span>
          </div>

          {/* Experience level */}
          <select
            value={experienceLevel}
            onChange={(e) => {
              setExperienceLevel(e.target.value);
              setCurrentPage(1);
            }}
            className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 focus:outline-none focus:ring-1 focus:ring-accent-primary cursor-pointer"
          >
            <option value="ALL">All Experience Levels</option>
            <option value="Beginner">Beginner (1-2 yrs)</option>
            <option value="Intermediate">Intermediate (3-5 yrs)</option>
            <option value="Experienced">Experienced (5-8 yrs)</option>
            <option value="Expert">Expert (8+ yrs)</option>
          </select>

          {/* Availability */}
          <select
            value={availability}
            onChange={(e) => {
              setAvailability(e.target.value);
              setCurrentPage(1);
            }}
            className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 focus:outline-none focus:ring-1 focus:ring-accent-primary cursor-pointer"
          >
            <option value="ALL">Any Availability</option>
            <option value="Available">🟢 Available Now</option>
            <option value="Busy">🟡 Busy</option>
            <option value="Unavailable">🔴 Unavailable</option>
          </select>

          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="text-xs text-rose-600 hover:text-rose-700 font-medium px-2 py-1 rounded-lg hover:bg-rose-50 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          )}
        </div>

        {/* View Switcher & Sorting */}
        <div className="flex items-center justify-between md:justify-end gap-3 text-xs">
          <span className="text-text-secondary">
            <strong>{pagination.total}</strong> professionals found
          </span>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 focus:outline-none focus:ring-1 focus:ring-accent-primary cursor-pointer"
          >
            <option value="recent">Sort: Most Recent</option>
            <option value="experience_desc">Sort: Years of Experience</option>
            <option value="name_asc">Sort: Name (A-Z)</option>
          </select>

          {/* Upwork-style View Mode Switcher */}
          <div className="hidden sm:flex items-center border border-slate-200 rounded-xl p-0.5 bg-slate-50">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === "grid" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-400 hover:text-slate-600"
              }`}
              title="Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === "list" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-400 hover:text-slate-600"
              }`}
              title="Detailed List View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ── Freelancers Directory Grid / List ── */}
      {loading ? (
        <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-4"}>
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="p-6 bg-white border border-border rounded-2xl animate-pulse space-y-4 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 bg-slate-200 rounded-2xl" />
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-slate-200 rounded w-3/4" />
                  <div className="h-3 bg-slate-200 rounded w-1/2" />
                </div>
              </div>
              <div className="h-12 bg-slate-100 rounded-xl" />
              <div className="flex gap-2">
                <div className="h-6 bg-slate-200 rounded-lg w-16" />
                <div className="h-6 bg-slate-200 rounded-lg w-20" />
                <div className="h-6 bg-slate-200 rounded-lg w-14" />
              </div>
            </Card>
          ))}
        </div>
      ) : freelancers.length === 0 ? (
        <Card className="p-12 text-center bg-white border border-border rounded-3xl shadow-xs space-y-4 max-w-lg mx-auto">
          <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
            <Search className="w-8 h-8" />
          </div>
          <div>
            <h3 className="font-semibold text-text-primary text-base">No freelancers found</h3>
            <p className="text-xs text-text-secondary mt-1">
              We couldn&apos;t find any verified professionals matching your current search or category filter.
            </p>
          </div>
          {hasActiveFilters && (
            <Button variant="outline" size="sm" onClick={resetFilters} className="text-xs">
              Clear All Filters
            </Button>
          )}
        </Card>
      ) : viewMode === "grid" ? (
        /* ═══════════════════════════════════════════════════
           UPWORK / FIVERR STYLE GRID VIEW
           ═══════════════════════════════════════════════════ */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {freelancers.map((freelancer) => {
            const availabilityStatus = freelancer.availability || "Available";
            const isAvailable = availabilityStatus === "Available";
            const portfolioCount = Array.isArray(freelancer.portfolio) ? freelancer.portfolio.length : 0;
            const expYears = freelancer.experienceYears || 0;
            const minBudget = freelancer.workPreferences?.minimumBudget;

            return (
              <Card
                key={freelancer.id}
                className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between group relative overflow-hidden"
              >
                {/* Accent top gradient stripe */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-accent-primary via-sky-400 to-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                <div className="space-y-4">
                  {/* Top Header with Avatar, Verified Status & Badges */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="relative flex-shrink-0">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-accent-primary/20 to-sky-100 border border-slate-200 overflow-hidden flex items-center justify-center font-bold text-accent-primary text-lg shadow-2xs">
                          {freelancer.avatarUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={freelancer.avatarUrl}
                              alt={freelancer.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            freelancer.name?.charAt(0).toUpperCase() || "F"
                          )}
                        </div>
                        {/* Live availability pulsating beacon */}
                        {isAvailable && (
                          <span
                            title="Available for immediate work"
                            className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-white shadow-xs"
                          >
                            <span className="animate-ping absolute inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                          </span>
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <Link
                            href={`/profile/${freelancer.id}`}
                            className="font-bold text-text-primary text-base truncate group-hover:text-accent-primary transition-colors hover:underline"
                          >
                            {freelancer.displayName || freelancer.name}
                          </Link>
                          <span title="Verified Identity & Contracts">
                            <CheckCircle2 className="w-4 h-4 text-accent-primary flex-shrink-0" />
                          </span>
                        </div>
                        <p className="text-xs font-medium text-slate-500 truncate mt-0.5">
                          {freelancer.professionalTitle || "Independent Professional"}
                        </p>
                      </div>
                    </div>

                    {/* Upwork style Top Rated Pill */}
                    <div className="flex flex-col items-end flex-shrink-0">
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full">
                        <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                        <span>Top Rated</span>
                      </span>
                      {minBudget && (
                        <span className="text-[11px] font-mono font-semibold text-slate-700 mt-1">
                          ₹{Number(minBudget).toLocaleString("en-IN")}+
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Upwork Highlight Metrics: Rating, Experience, Location */}
                  <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap pt-1 pb-1 border-y border-slate-100">
                    <span className="flex items-center gap-1 font-semibold text-slate-800">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      <span>5.0</span>
                      <span className="font-normal text-slate-400">(100% Success)</span>
                    </span>

                    {expYears > 0 && (
                      <span className="flex items-center gap-1">
                        <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                        <span>{expYears} yrs exp</span>
                      </span>
                    )}

                    {(freelancer.city || freelancer.country) && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span>{[freelancer.city, freelancer.country].filter(Boolean).join(", ")}</span>
                      </span>
                    )}
                  </div>

                  {/* Bio Snippet */}
                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                    {freelancer.bio ||
                      "Available for custom software development, architecture, API development, and protected contract delivery."}
                  </p>

                  {/* Skills Chips */}
                  {Array.isArray(freelancer.skills) && freelancer.skills.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {freelancer.skills.slice(0, 4).map((skill: string, sIdx: number) => (
                        <span
                          key={sIdx}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleQuickSkillClick(skill);
                          }}
                          className="text-[11px] bg-slate-100 hover:bg-slate-200 border border-slate-200/80 text-slate-700 px-2.5 py-0.5 rounded-lg transition-colors cursor-pointer"
                        >
                          {skill}
                        </span>
                      ))}
                      {freelancer.skills.length > 4 && (
                        <span className="text-[11px] text-slate-400 px-1 py-0.5 font-mono">
                          +{freelancer.skills.length - 4} more
                        </span>
                      )}
                    </div>
                  )}

                  {/* Portfolio badge if available */}
                  {portfolioCount > 0 && (
                    <div className="flex items-center gap-1.5 text-[11px] text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-100 w-fit">
                      <FolderGit2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{portfolioCount} verified portfolio {portfolioCount === 1 ? "project" : "projects"}</span>
                    </div>
                  )}
                </div>

                {/* Card Footer Actions */}
                <div className="pt-5 mt-5 border-t border-slate-100 flex items-center gap-2">
                  <Link
                    href={`/profile/${freelancer.id}`}
                    className="flex-1 text-center py-2 px-3 text-xs font-semibold rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 transition-colors"
                  >
                    View Profile
                  </Link>

                  <Button
                    size="sm"
                    onClick={() => {
                      if (!dbUser) {
                        router.push(`/sign-in?redirect=/contracts/new?freelancerId=${freelancer.id}`);
                        return;
                      }
                      if (dbUser.role !== "CLIENT") {
                        alert("Please sign in as a Client to create and send contract invitations.");
                        return;
                      }
                      router.push(`/contracts/new?freelancerId=${freelancer.id}`);
                    }}
                    className="flex-1 bg-accent-primary hover:bg-accent-primary/90 text-white text-xs font-semibold py-2 px-3 rounded-xl gap-1.5 cursor-pointer shadow-xs"
                  >
                    <span>Hire Talent</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        /* ═══════════════════════════════════════════════════
           UPWORK DETAILED LIST VIEW
           ═══════════════════════════════════════════════════ */
        <div className="space-y-4">
          {freelancers.map((freelancer) => {
            const availabilityStatus = freelancer.availability || "Available";
            const isAvailable = availabilityStatus === "Available";
            const portfolioCount = Array.isArray(freelancer.portfolio) ? freelancer.portfolio.length : 0;
            const expYears = freelancer.experienceYears || 0;
            const minBudget = freelancer.workPreferences?.minimumBudget;

            return (
              <Card
                key={freelancer.id}
                className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-xs hover:shadow-md transition-all flex flex-col md:flex-row md:items-start justify-between gap-6 group"
              >
                {/* Left column: Avatar & Quick Stats */}
                <div className="flex items-start gap-4 flex-1 min-w-0">
                  <div className="relative flex-shrink-0">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-accent-primary/20 to-sky-100 border border-slate-200 overflow-hidden flex items-center justify-center font-bold text-accent-primary text-xl shadow-2xs">
                      {freelancer.avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={freelancer.avatarUrl}
                          alt={freelancer.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        freelancer.name?.charAt(0).toUpperCase() || "F"
                      )}
                    </div>
                    {isAvailable && (
                      <span
                        title="Available for immediate work"
                        className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-white shadow-xs"
                      >
                        <span className="animate-ping absolute inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                      </span>
                    )}
                  </div>

                  <div className="space-y-2.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Link
                        href={`/profile/${freelancer.id}`}
                        className="font-bold text-text-primary text-lg group-hover:text-accent-primary transition-colors hover:underline"
                      >
                        {freelancer.displayName || freelancer.name}
                      </Link>
                      <CheckCircle2 className="w-4 h-4 text-accent-primary flex-shrink-0" />
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full">
                        <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                        <span>Top Rated</span>
                      </span>
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                          isAvailable
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-slate-100 text-slate-600 border-slate-200"
                        }`}
                      >
                        {availabilityStatus}
                      </span>
                    </div>

                    <p className="text-xs font-semibold text-slate-700">
                      {freelancer.professionalTitle || "Independent Professional"}
                    </p>

                    {/* Upwork Meta Bar */}
                    <div className="flex items-center gap-4 text-xs text-slate-500 flex-wrap">
                      <span className="flex items-center gap-1 font-semibold text-slate-800">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        <span>5.0</span>
                        <span className="font-normal text-slate-400">(100% Success)</span>
                      </span>
                      {expYears > 0 && (
                        <span className="flex items-center gap-1">
                          <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                          <span>{expYears} yrs exp</span>
                        </span>
                      )}
                      {(freelancer.city || freelancer.country) && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          <span>{[freelancer.city, freelancer.country].filter(Boolean).join(", ")}</span>
                        </span>
                      )}
                      {portfolioCount > 0 && (
                        <span className="flex items-center gap-1 text-emerald-600 font-medium">
                          <FolderGit2 className="w-3.5 h-3.5" />
                          <span>{portfolioCount} portfolio items</span>
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed max-w-3xl line-clamp-2">
                      {freelancer.bio ||
                        "Available for custom software development, architecture, API development, and protected contract delivery."}
                    </p>

                    {/* Skills pills */}
                    {Array.isArray(freelancer.skills) && freelancer.skills.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {freelancer.skills.map((skill: string, sIdx: number) => (
                          <span
                            key={sIdx}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleQuickSkillClick(skill);
                            }}
                            className="text-[11px] bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 px-2.5 py-0.5 rounded-lg transition-colors cursor-pointer"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right column: Pricing & Actions */}
                <div className="flex md:flex-col items-center md:items-end justify-between md:justify-center gap-3 pt-4 md:pt-0 border-t md:border-t-0 border-slate-100 flex-shrink-0 min-w-[180px]">
                  {minBudget ? (
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block font-medium">Starting budget</span>
                      <span className="text-base font-bold font-mono text-slate-900">
                        ₹{Number(minBudget).toLocaleString("en-IN")}
                      </span>
                    </div>
                  ) : (
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block font-medium">Contract rate</span>
                      <span className="text-xs font-semibold text-slate-700">Fixed & Milestone</span>
                    </div>
                  )}

                  <div className="flex items-center gap-2 w-full md:w-auto">
                    <Link
                      href={`/profile/${freelancer.id}`}
                      className="text-center py-2 px-3 text-xs font-semibold rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 transition-colors flex-1 md:flex-none"
                    >
                      View Profile
                    </Link>

                    <Button
                      size="sm"
                      onClick={() => {
                        if (!dbUser) {
                          router.push(`/sign-in?redirect=/contracts/new?freelancerId=${freelancer.id}`);
                          return;
                        }
                        if (dbUser.role !== "CLIENT") {
                          alert("Please sign in as a Client to create and send contract invitations.");
                          return;
                        }
                        router.push(`/contracts/new?freelancerId=${freelancer.id}`);
                      }}
                      className="bg-accent-primary hover:bg-accent-primary/90 text-white text-xs font-semibold py-2 px-4 rounded-xl gap-1.5 cursor-pointer shadow-xs flex-1 md:flex-none"
                    >
                      <span>Hire Talent</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* ── Pagination Controls ── */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between pt-6 border-t border-border">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage <= 1 || loading}
            className="text-xs"
          >
            Previous
          </Button>

          <span className="text-xs text-text-secondary font-mono">
            Page {pagination.page} of {pagination.totalPages}
          </span>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((p) => Math.min(pagination.totalPages, p + 1))}
            disabled={currentPage >= pagination.totalPages || loading}
            className="text-xs"
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
