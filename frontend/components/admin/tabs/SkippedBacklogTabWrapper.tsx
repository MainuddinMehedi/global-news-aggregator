import {
  getSkippedArticles,
  getFailedEnrichments,
  getGazetteerCategoriesAndRegions,
} from "@/queries/admin/skipped";
import SkippedBacklogTab from "../SkippedBacklogTab";

export default async function SkippedBacklogTabWrapper() {
  const [skippedArticles, failedEnrichments, gazetteerConfig] = await Promise.all([
    getSkippedArticles(50),
    getFailedEnrichments(50),
    getGazetteerCategoriesAndRegions(),
  ]);

  return (
    <SkippedBacklogTab
      skippedArticles={skippedArticles}
      failedEnrichments={failedEnrichments}
      gazetteerConfig={gazetteerConfig}
    />
  );
}
