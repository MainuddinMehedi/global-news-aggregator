"use client";

export default function SettingsPage() {
  return (
    <div className="p-4 lg:p-6 max-w-2xl mx-auto space-y-6">
      <h2 className="text-xl font-bold text-zinc-100">Settings</h2>

      <div className="bg-card border border-border rounded-xl p-6 space-y-6">
        {/* Data Sources */}
        <div>
          <h3 className="text-sm font-bold text-zinc-200 mb-4">
            Data Sources
          </h3>
          <div className="space-y-3">
            {[
              { name: "The Daily Star (RSS)", status: "Active", ok: true },
              { name: "Al Jazeera (RSS)", status: "Disabled", ok: false },
              { name: "Dhaka Tribune (RSS)", status: "Disabled", ok: false },
              { name: "UN News (RSS)", status: "Disabled", ok: false },
              { name: "TechCrunch (RSS)", status: "Disabled", ok: false },
            ].map((src) => (
              <div
                key={src.name}
                className="flex items-center justify-between p-3 bg-zinc-900/50 rounded-lg border border-zinc-800"
              >
                <div className="flex items-center space-x-3">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      src.ok ? "bg-emerald-500" : "bg-zinc-600"
                    }`}
                  />
                  <span className="text-sm text-zinc-300">{src.name}</span>
                </div>
                <div
                  className={`text-xs ${
                    src.ok ? "text-zinc-500" : "text-zinc-600"
                  }`}
                >
                  Status: {src.status}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* AI Configuration */}
        <div className="border-t border-zinc-800 pt-6">
          <h3 className="text-sm font-bold text-zinc-200 mb-4">
            AI Configuration
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-zinc-500 mb-1">
                Ingestion Model
              </label>
              <div className="w-full bg-zinc-900 border border-zinc-700 rounded-md py-2 px-3 text-sm text-zinc-400">
                {process.env.NEXT_PUBLIC_AI_PRIMARY_MODEL ||
                  "llama-4-scout-17b"}
              </div>
            </div>
            <div>
              <label className="block text-xs text-zinc-500 mb-1">
                Chat Model
              </label>
              <div className="w-full bg-zinc-900 border border-zinc-700 rounded-md py-2 px-3 text-sm text-zinc-400">
                OpenRouter
              </div>
            </div>
          </div>
        </div>

        {/* Environment Info */}
        <div className="border-t border-zinc-800 pt-6">
          <h3 className="text-sm font-bold text-zinc-200 mb-4">
            Environment
          </h3>
          <div className="space-y-2 text-xs text-zinc-500">
            <div className="flex justify-between">
              <span>Database</span>
              <span className="text-zinc-400">Supabase PostgreSQL</span>
            </div>
            <div className="flex justify-between">
              <span>ORM</span>
              <span className="text-zinc-400">Prisma 6.19</span>
            </div>
            <div className="flex justify-between">
              <span>Framework</span>
              <span className="text-zinc-400">Next.js 16</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
