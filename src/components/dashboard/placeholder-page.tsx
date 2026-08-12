import { EmptyState } from "@/components/ui/empty-state";

type PlaceholderPageProps = {
  title: string;
  description: string;
};

export function PlaceholderPage({ title, description }: PlaceholderPageProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight">
          {title}
        </h1>
      </div>
      <EmptyState title={title} description={description} />
    </div>
  );
}
