"use client";
import { useEffect, useState } from "react";

export default function Home() {
  const [articles, setArticles] = useState([]);
  const [category, setCategory] = useState("geopolitics");

  useEffect(() => {
    fetch(`/api/articles?category=${category}`)
      .then(r => r.json())
      .then(setArticles);
  }, [category]);

  return (
    <main className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Global News Aggregator</h1>
      <select value={category} onChange={e => setCategory(e.target.value)} className="mb-4 p-2 border rounded">
        <option value="geopolitics">Geopolitics</option>
        <option value="bangladesh">Bangladesh</option>
        <option value="technology">Technology</option>
      </select>
      <div className="grid gap-4">
        {articles.map((a: any) => (
          <div key={a.id} className="p-4 border rounded shadow-sm">
            <h2 className="font-semibold">{a.title}</h2>
            <p className="text-sm text-gray-500">{a.source} • {a.publishedAt.slice(0, 10)}</p>
            <p className="mt-2 text-gray-700 line-clamp-2">{a.contentSnippet}</p>
            {a.biasNote && <span className="mt-1 inline-block bg-yellow-100 text-xs px-2 py-1 rounded">{a.biasNote}</span>}
          </div>
        ))}
      </div>
    </main>
  );
}






// export default function Home() {
//   return (
//     <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black">
//       <h1 className="text-4xl font-bold mb-4 text-center">
//         Global News Aggregator
//       </h1>
//       <p className="text-lg text-gray-600 dark:text-gray-400 mb-8 text-center">
//         AI-powered, multi-perspective news aggregator
//       </p>
//     </div>
//   );
// }
