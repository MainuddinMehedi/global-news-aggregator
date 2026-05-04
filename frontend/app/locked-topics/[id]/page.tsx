import { TopicDetailsView } from "../../../components/locked-topics/TopicDetailsView";

export default async function TopicDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="overflow-hidden rounded-3xl border border-border/50 bg-card/50 shadow-2xl backdrop-blur-xl">
        <TopicDetailsView topicId={id} />
      </div>
    </div>
  );
}
