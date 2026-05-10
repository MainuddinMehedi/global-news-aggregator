import { NextRequest, NextResponse } from "next/server";

// This route is for generating summary of locked topics before deleting.
// TODO: Do an analysis on which model to use for this summary generation. Googles models can be right choice for this. gemma 4 or
// My resoning for choosing the model.
//  Each topic will have a lot of articles and resources collected. we have to generate summary of the articles collected from creation of the topic to the point of deletion  so it'll be a lot of text to process.
//  For that reason i'm thinking i should use a better model for this job. And the one that has suitable usage tier for this. Also one thing to notice here is that i won't trigger this as often as ingestion process or topic finding scanners. So it doesn't requires that high rpm or rpd.

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return NextResponse.json({ summary: "stub summary text" });
}
