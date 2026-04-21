import type { ComponentType } from "react";

export type BuilderBlockDefinition = {
  id: string;
  name: string;
  description: string;
  category: string;
  integrationRequired: boolean;
  icon: ComponentType<{ className?: string }>;
};

export type BuilderBlock = BuilderBlockDefinition & {
  instanceId: string;
  position: { x: number; y: number };
  config: Record<string, string | string[]>;
  status: "not-configured" | "requires-integration" | "configured";
  integrationStatus: "not-connected" | "connected";
};

export type BuilderConnection = {
  id: string;
  from: string;
  to: string;
};
