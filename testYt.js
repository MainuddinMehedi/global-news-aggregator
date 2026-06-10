import ytSearch from "yt-search";

async function test() {
  const video = await ytSearch({ videoId: "a1KXGn5NR0s" });
  console.log(video.description);
}
test();
