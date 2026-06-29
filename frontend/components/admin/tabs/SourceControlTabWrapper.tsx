import { getFeedSources } from "@/queries/admin/sources";
import SourceControlTab from "../SourceControlTab";

export default async function SourceControlTabWrapper() {
  const feedSources = await getFeedSources();
  return <SourceControlTab feedSources={feedSources} />;
}
