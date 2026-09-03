import Link from "next/link";
import { Search, Database, History, ArrowRight, LayoutDashboard, Target } from "lucide-react";
import { getICP } from "@/lib/icp/service";
import { getAnalyses } from "@/lib/icp/storage";
import { resolveFitTag } from "@/lib/icp/fit-tag";
import { FitTagBadge } from "@/components/analysis/FitTagBadge";
import { PageHeader } from "@/components/layout/PageHeader";

const statColors = [
  "border-l-tga-teal-500",
  "border-l-tga-orange-500",
  "border-l-tga-teal-400",
  "border-l-emerald-500",
];

const actionCards = [
  {
    href: "/analyze",
    icon: Search,
    title: "Analyze Company",
    description: "Evaluate a company against the current ICP",
    color: "from-tga-orange-500 to-tga-orange-600",
    iconBg: "bg-tga-orange-100 text-tga-orange-600",
  },
  {
    href: "/icp",
    icon: Database,
    title: "ICP Knowledge Base",
    description: "Manage criteria, rules, and scoring weights",
    color: "from-tga-teal-500 to-tga-teal-600",
    iconBg: "bg-tga-teal-100 text-tga-teal-600",
  },
  {
    href: "/icp/history",
    icon: History,
    title: "ICP History",
    description: "View and restore previous ICP versions",
    color: "from-tga-teal-600 to-tga-teal-700",
    iconBg: "bg-tga-teal-100 text-tga-teal-700",
  },
];

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const icp = await getICP();
  const analyses = await getAnalyses();
  const recentAnalyses = analyses.slice(0, 5);

  const stats = [
    { label: "ICP Version", value: icp.version },
    { label: "Active Criteria", value: icp.criteria.filter((c) => c.active).length },
    { label: "Total Analyses", value: analyses.length },
    {
      label: "High Fit",
      value: analyses.filter((a) => resolveFitTag(a) === "HIGH_FIT").length,
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <PageHeader
        title="Dashboard"
        description="ICP-driven company analysis powered by a centralized Knowledge Base"
        icon={<LayoutDashboard className="h-6 w-6 text-white" />}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
        {stats.map((stat, i) => (
          <div key={stat.label} className={`stat-card ${statColors[i]}`}>
            <p className="text-xs sm:text-sm font-medium text-tga-teal-600">{stat.label}</p>
            <p className="text-2xl sm:text-3xl font-bold text-tga-teal-800 mt-1">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-3 gap-6 mb-8">
        {actionCards.map(({ href, icon: Icon, title, description, color, iconBg }) => (
          <Link
            key={href}
            href={href}
            className="card overflow-hidden hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 group"
          >
            <div className={`h-1.5 bg-gradient-to-r ${color}`} />
            <div className="p-6">
              <div className={`inline-flex p-3 rounded-xl ${iconBg} mb-4`}>
                <Icon className="h-6 w-6" />
              </div>
              <h2 className="font-bold text-tga-teal-800 group-hover:text-tga-teal-600 transition-colors">
                {title}
              </h2>
              <p className="text-sm text-gray-500 mt-1">{description}</p>
              <ArrowRight className="h-4 w-4 text-tga-orange-500 mt-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        ))}
      </div>

      <div className="card overflow-hidden">
        <div className="px-4 sm:px-6 py-4 bg-tga-teal-50 border-b border-tga-teal-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <h2 className="font-bold text-tga-teal-800">Recent Analyses</h2>
          <span className="badge-teal w-fit">ICP v{icp.version}</span>
        </div>
        {recentAnalyses.length === 0 ? (
          <div className="p-10 text-center">
            <div className="inline-flex p-4 rounded-full bg-tga-teal-50 mb-4">
              <Target className="h-10 w-10 text-tga-teal-400" />
            </div>
            <p className="text-gray-500">No analyses yet. Analyze your first company to get started.</p>
            <Link href="/analyze" className="btn-primary mt-4 inline-flex">
              <Search className="h-4 w-4" />
              Analyze Now
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-tga-teal-50">
            {recentAnalyses.map((analysis) => (
              <div
                key={analysis.id}
                className="px-4 sm:px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 hover:bg-tga-teal-50/50 transition-colors"
              >
                <div className="min-w-0">
                  <p className="font-semibold text-tga-teal-900 truncate">
                    {analysis.companyName ?? analysis.companyUrl}
                  </p>
                  <p className="text-sm text-gray-500 truncate">{analysis.companyUrl}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0 flex-wrap">
                  <span className="text-sm text-tga-teal-600">v{analysis.icpVersion}</span>
                  <span className="text-xl font-bold text-tga-teal-800">{analysis.icpScore}</span>
                  <FitTagBadge fitTag={resolveFitTag(analysis)} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
