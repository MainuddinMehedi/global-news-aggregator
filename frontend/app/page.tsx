"use client";
import { useEffect, useState } from "react";

export default function Home() {
  const [articles, setArticles] = useState([]);
  const [category, setCategory] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/articles?category=${category}`)
      .then(r => r.json())
      .then(data => {
        setArticles(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setArticles([]);
        setLoading(false);
      });
  }, [category]);

  return (
    <main className="min-h-screen bg-slate-50 py-12 px-6">
      <div className="max-w-7xl mx-auto">
        <header className="mb-12 text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 mb-4">Global News Aggregator</h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">Testing ingestion workflow output</p>
        </header>
        
        <div className="flex justify-center mb-10">
          <select 
            value={category} 
            onChange={e => setCategory(e.target.value)} 
            className="p-3 pr-10 border-slate-300 border rounded-xl shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white text-slate-700 font-medium cursor-pointer"
          >
            <option value="all">All Categories</option>
            <option value="geopolitics">Geopolitics</option>
            <option value="bangladesh">Bangladesh</option>
            <option value="technology">Technology</option>
          </select>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {articles.length === 0 ? (
              <div className="col-span-full text-center text-slate-500 py-10 bg-white rounded-2xl shadow-sm border border-slate-100">No articles found. Check if the ingestion service has run.</div>
            ) : (
              articles.map((a: any) => (
                <a key={a.id} href={a.url || "#"} target="_blank" rel="noopener noreferrer" className="block group h-full">
                  <article className="h-full flex flex-col bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-lg hover:border-indigo-100 transition-all duration-300 transform group-hover:-translate-y-1">
                    <div className="flex justify-between items-start mb-4 gap-2">
                      <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-md uppercase tracking-wide truncate">
                        {a.source}
                      </span>
                      <time className="text-xs font-medium text-slate-400 whitespace-nowrap">
                        {a.publishedAt ? new Date(a.publishedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric'}) : ''}
                      </time>
                    </div>
                    
                    <h2 className="text-lg font-bold text-slate-900 mb-3 group-hover:text-indigo-600 transition-colors line-clamp-3 leading-snug">
                      {a.title}
                    </h2>
                    
                    <p className="text-slate-600 mb-5 text-sm line-clamp-4 flex-grow leading-relaxed">
                      {a.contentSnippet}
                    </p>
                    
                    <div className="mt-auto pt-4 border-t border-slate-50 flex flex-wrap gap-2">
                      {a.biasNote && (
                        <span className="inline-flex items-center bg-amber-50 text-amber-800 text-xs px-2 py-1 rounded font-medium border border-amber-100">
                          {a.biasNote}
                        </span>
                      )}
                      {a.sentimentScore !== null && a.sentimentScore !== undefined && (
                        <span className={`inline-flex items-center text-xs px-2 py-1 rounded font-medium border ${a.sentimentScore > 0.2 ? 'bg-emerald-50 text-emerald-800 border-emerald-100' : a.sentimentScore < -0.2 ? 'bg-rose-50 text-rose-800 border-rose-100' : 'bg-slate-50 text-slate-700 border-slate-100'}`}>
                          {a.sentimentScore > 0.2 ? 'Positive' : a.sentimentScore < -0.2 ? 'Negative' : 'Neutral'} ({a.sentimentScore.toFixed(2)})
                        </span>
                      )}
                    </div>
                  </article>
                </a>
              ))
            )}
          </div>
        )}
      </div>
    </main>
  );
}