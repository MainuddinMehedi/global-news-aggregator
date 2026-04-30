import { Loader } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

const categories = [
  "all",
  "geopolitics",
  "bangladesh",
  "technology",
  "conflict",
  "economy",
  "environment",
  "health",
];

export default function Filters() {
  const activeCategory = "all";

  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-hide">
        {categories.map((cat) => (
          <button
            key={cat}
            // onClick={() => setCategory(cat)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all whitespace-nowrap capitalize ${
              activeCategory === cat
                ? "bg-zinc-100 text-zinc-900"
                : "bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-zinc-800"
            }`}
          >
            {cat === "all" ? "All" : cat}
          </button>
        ))}
      </div>
      <div className="flex items-center space-x-2">
        <span className="text-xs text-zinc-500 uppercase font-bold tracking-wider">
          Sort:
        </span>
        <select className="bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs rounded-md py-1.5 px-2 focus:outline-none">
          <option>Latest</option>
          <option>Relevance</option>
          <option>Bias Score</option>
        </select>
      </div>
    </div>
  );
}
