import { KnowledgeTabs } from "@/components/knowledge/knowledge-tabs";
import { ReindexButton } from "@/components/knowledge/reindex-button";

export default function KnowledgeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <KnowledgeTabs />
        <ReindexButton />
      </div>
      {children}
    </div>
  );
}
