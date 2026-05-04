import { TopicDetailsView } from "../../../../components/locked-topics/TopicDetailsView";
import { InterceptedModal } from "./Modal";

export default async function InterceptedTopicDetails({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <InterceptedModal topicId={id}>
      <TopicDetailsView topicId={id} />
    </InterceptedModal>
  );
}
