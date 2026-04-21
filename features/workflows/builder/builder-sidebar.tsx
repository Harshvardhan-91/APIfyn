"use client";

import { getBrand } from "@/components/icons/brand-icons";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import { blockLibrary } from "./block-library";
import type { BuilderBlockDefinition } from "./types";

type BuilderSidebarProps = {
  onAddBlock: (block: BuilderBlockDefinition) => void;
  connectedProviders: Set<string>;
};

function providerForBlock(id: string) {
  if (id.includes("github")) return "github";
  if (id.includes("slack")) return "slack";
  if (id.includes("gmail")) return "gmail";
  if (id.includes("sheets")) return "sheets";
  if (id.includes("notion")) return "notion";
  return "";
}

const groupLabels: Record<string, string> = {
  triggers: "Triggers",
  actions: "Actions",
  conditions: "Conditions",
  utilities: "Utilities",
};

export function BuilderSidebar({
  onAddBlock,
  connectedProviders,
}: BuilderSidebarProps) {
  const [search, setSearch] = useState("");
  const groups = useMemo(() => {
    return Object.entries(blockLibrary).map(
      ([group, blocks]) =>
        [
          group,
          blocks.filter((block) =>
            block.name.toLowerCase().includes(search.toLowerCase()),
          ),
        ] as const,
    );
  }, [search]);

  return (
    <aside className="flex h-full w-full shrink-0 flex-col bg-white">
      <div className="border-b border-gray-100 p-5">
        <h2 className="text-base font-semibold text-gray-900">Blocks</h2>
        <p className="mt-0.5 text-xs text-gray-500">
          Drag to canvas or click to add
        </p>
        <div className="relative mt-3">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            className="pl-9 text-sm"
            placeholder="Search blocks..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        {groups.map(([group, blocks]) =>
          blocks.length === 0 ? null : (
            <div key={group} className="mb-6">
              <h3 className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-gray-400">
                {groupLabels[group] ?? group}
              </h3>
              <div className="space-y-2">
                {blocks.map((block) => {
                  const provider = providerForBlock(block.id);
                  const connected = connectedProviders.has(provider);
                  const brand = getBrand(block.id);
                  return (
                    <button
                      type="button"
                      key={block.id}
                      className="group w-full rounded-xl border border-gray-100 bg-white p-3.5 text-left transition-all hover:border-gray-200 hover:shadow-sm active:scale-[0.98]"
                      onClick={() => onAddBlock(block)}
                    >
                      <div className="flex gap-3">
                        <span
                          className={cn(
                            "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-black/5",
                            brand ? brand.bg : "bg-gray-100",
                          )}
                        >
                          <block.icon
                            className={cn(
                              "h-5 w-5",
                              brand ? brand.text : "text-gray-600",
                            )}
                          />
                        </span>
                        <div className="min-w-0">
                          <span className="flex items-center gap-2 text-sm font-medium text-gray-900">
                            <span className="truncate">{block.name}</span>
                            {block.integrationRequired ? (
                              <span
                                className={cn(
                                  "h-1.5 w-1.5 shrink-0 rounded-full",
                                  connected ? "bg-emerald-500" : "bg-amber-400",
                                )}
                              />
                            ) : null}
                          </span>
                          <span className="mt-0.5 block text-xs leading-4 text-gray-500">
                            {block.description}
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ),
        )}
      </div>
    </aside>
  );
}
