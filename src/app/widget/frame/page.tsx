import { WidgetFrame } from "@/components/widget/widget-frame";

type Props = {
  searchParams: Promise<{ id?: string; parent?: string }>;
};

export default async function WidgetFramePage({ searchParams }: Props) {
  const params = await searchParams;
  return (
    <div className="fixed inset-0 bg-transparent">
      <WidgetFrame
        publicKey={params.id ?? ""}
        parentOrigin={params.parent ?? "*"}
      />
    </div>
  );
}
