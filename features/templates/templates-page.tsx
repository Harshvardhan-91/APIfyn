"use client";

import { AppIcon } from "@/components/icons/brand-icons";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { templateDefinitions } from "@/lib/templates/definitions";
import { ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";

export function TemplatesPage() {
  const router = useRouter();
  return (
    <main className="min-h-screen bg-gray-50/50">
      <div className="mx-auto max-w-7xl px-4 pb-8 pt-20 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-xl font-semibold tracking-tight text-gray-900">
            Templates
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Pre-built workflows to get you started in seconds.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {templateDefinitions.map((template) => (
            <Card key={template.id} className="group">
              <CardContent>
                <div className="mb-1">
                  <span className="text-[11px] font-medium uppercase tracking-wider text-gray-400">
                    {template.category}
                  </span>
                </div>
                <div className="mb-4 flex gap-2">
                  {template.apps.map((app) => (
                    <AppIcon key={app} app={app} />
                  ))}
                </div>
                <h2 className="text-sm font-semibold text-gray-900">
                  {template.name}
                </h2>
                <p className="mt-1.5 text-xs leading-relaxed text-gray-500">
                  {template.description}
                </p>
                <div className="mt-3 flex items-center gap-2 text-[11px] text-gray-400">
                  <span>{template.blocks.length} blocks</span>
                  <span>&middot;</span>
                  <span>{template.connections.length} connections</span>
                </div>
                <Button
                  className="mt-4 w-full"
                  variant="secondary"
                  onClick={() =>
                    router.push(`/workflows/create?template=${template.id}`)
                  }
                >
                  Use Template
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </main>
  );
}
