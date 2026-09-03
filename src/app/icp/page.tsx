import { getICP } from "@/lib/icp/service";
import { ICPEditor } from "@/components/icp/ICPEditor";
import { PageHeader } from "@/components/layout/PageHeader";
import { Database } from "lucide-react";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function ICPPage() {
  const icp = await getICP();

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <PageHeader
        title="ICP Knowledge Base"
        description={`Manage criteria, rules, and scoring weights — currently on version ${icp.version}`}
        icon={<Database className="h-6 w-6 text-white" />}
      />
      <ICPEditor initialICP={icp} />
    </div>
  );
}
