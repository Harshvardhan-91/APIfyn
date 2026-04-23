"use client";

import { getBrand } from "@/components/icons/brand-icons";
import { cn } from "@/lib/utils";
import { Settings, Trash2 } from "lucide-react";
import {
  type PointerEvent as ReactPointerEvent,
  useRef,
  useState,
} from "react";
import type { BuilderBlock, BuilderConnection } from "./types";

type BuilderCanvasProps = {
  blocks: BuilderBlock[];
  connections: BuilderConnection[];
  selectedBlockId?: string;
  onSelectBlock: (id: string) => void;
  onDeleteBlock: (id: string) => void;
  onConnect: (from: string, to: string) => void;
  onMoveBlock: (id: string, position: { x: number; y: number }) => void;
  /** e.g. bottom padding so content stays above a fixed bottom UI */
  className?: string;
};

export function BuilderCanvas({
  blocks,
  connections,
  selectedBlockId,
  onSelectBlock,
  onDeleteBlock,
  onConnect,
  onMoveBlock,
  className,
}: BuilderCanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState<{
    id: string;
    offsetX: number;
    offsetY: number;
  } | null>(null);

  function getCanvasPoint(event: ReactPointerEvent) {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  }

  function startDrag(event: ReactPointerEvent, block: BuilderBlock) {
    const point = getCanvasPoint(event);
    setDragging({
      id: block.instanceId,
      offsetX: point.x - block.position.x,
      offsetY: point.y - block.position.y,
    });
    onSelectBlock(block.instanceId);
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function moveDrag(event: ReactPointerEvent) {
    if (!dragging) return;
    const point = getCanvasPoint(event);
    onMoveBlock(dragging.id, {
      x: Math.max(24, point.x - dragging.offsetX),
      y: Math.max(24, point.y - dragging.offsetY),
    });
  }

  function stopDrag(event: ReactPointerEvent) {
    if (!dragging) return;
    event.currentTarget.releasePointerCapture(event.pointerId);
    setDragging(null);
  }

  return (
    <section
      className={cn("relative flex-1 overflow-auto bg-gray-50/50", className)}
    >
      <div
        ref={canvasRef}
        className="relative min-h-[720px] min-w-[920px] bg-[radial-gradient(circle,#e5e7eb_1px,transparent_1px)] [background-size:20px_20px]"
      >
        <svg
          className="pointer-events-none absolute inset-0 h-full w-full"
          aria-hidden="true"
        >
          {connections.map((connection) => {
            const from = blocks.find(
              (block) => block.instanceId === connection.from,
            );
            const to = blocks.find(
              (block) => block.instanceId === connection.to,
            );
            if (!from || !to) return null;
            const fromX = from.position.x + 240;
            const fromY = from.position.y + 54;
            const toX = to.position.x;
            const toY = to.position.y + 54;
            const midX = (fromX + toX) / 2;
            return (
              <g key={connection.id}>
                <path
                  d={`M ${fromX} ${fromY} C ${midX} ${fromY}, ${midX} ${toY}, ${toX} ${toY}`}
                  fill="none"
                  stroke="#d1d5db"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <path
                  d={`M ${fromX} ${fromY} C ${midX} ${fromY}, ${midX} ${toY}, ${toX} ${toY}`}
                  fill="none"
                  stroke="#6b7280"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeDasharray="6 4"
                  className="animate-[dash_1s_linear_infinite]"
                  style={{
                    animation: "none",
                  }}
                />
              </g>
            );
          })}
        </svg>

        {blocks.length === 0 ? (
          <div className="flex h-[640px] items-center justify-center">
            <div className="max-w-md rounded-2xl border border-dashed border-gray-300 bg-white/80 p-10 text-center backdrop-blur">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100">
                <svg
                  className="h-7 w-7 text-gray-400"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  aria-hidden="true"
                >
                  <path d="M12 4v16m-8-8h16" strokeLinecap="round" />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-gray-900">
                Build your workflow
              </h2>
              <p className="mt-2 text-sm text-gray-500">
                Pick a trigger from the sidebar, add actions, then connect them
                to create your automation.
              </p>
            </div>
          </div>
        ) : null}

        {blocks.map((block) => {
          const brand = getBrand(block.id);
          const isSelected = selectedBlockId === block.instanceId;
          const isDragging = dragging?.id === block.instanceId;
          return (
            <div
              key={block.instanceId}
              className={cn(
                "absolute w-[240px] touch-none select-none rounded-2xl border bg-white shadow-sm transition-all",
                isDragging
                  ? "cursor-grabbing shadow-xl ring-2 ring-gray-900/5"
                  : "cursor-grab",
                isSelected
                  ? "border-gray-900 ring-4 ring-gray-900/5"
                  : "border-gray-200 hover:shadow-md",
              )}
              style={{ left: block.position.x, top: block.position.y }}
              onPointerDown={(event) => startDrag(event, block)}
              onPointerMove={moveDrag}
              onPointerUp={stopDrag}
              onPointerCancel={stopDrag}
            >
              <button
                type="button"
                className="absolute -left-2.5 top-1/2 h-5 w-5 -translate-y-1/2 rounded-full border-2 border-white bg-gray-400 shadow-sm transition hover:bg-gray-600"
                onClick={() => {
                  const previous = blocks[blocks.indexOf(block) - 1];
                  if (previous)
                    onConnect(previous.instanceId, block.instanceId);
                }}
                onPointerDown={(event) => event.stopPropagation()}
                title="Connect from previous block"
              />
              <button
                type="button"
                className="absolute -right-2.5 top-1/2 h-5 w-5 -translate-y-1/2 rounded-full border-2 border-white bg-gray-900 shadow-sm transition hover:bg-gray-700"
                onClick={() => {
                  const next = blocks[blocks.indexOf(block) + 1];
                  if (next) onConnect(block.instanceId, next.instanceId);
                }}
                onPointerDown={(event) => event.stopPropagation()}
                title="Connect to next block"
              />
              <div className="p-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-3">
                    <span
                      className={cn(
                        "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-black/5",
                        brand ? brand.bg : "bg-gray-100",
                      )}
                    >
                      <block.icon
                        className={cn(
                          "h-4.5 w-4.5",
                          brand ? brand.text : "text-gray-600",
                        )}
                      />
                    </span>
                    <div className="min-w-0">
                      <h3 className="truncate text-sm font-medium text-gray-900">
                        {block.name}
                      </h3>
                      <p className="text-[11px] text-gray-400">
                        {block.category}
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-0.5">
                    <button
                      type="button"
                      className="rounded-lg p-1.5 transition hover:bg-gray-100"
                      onClick={() => onSelectBlock(block.instanceId)}
                      onPointerDown={(event) => event.stopPropagation()}
                    >
                      <Settings className="h-3.5 w-3.5 text-gray-400" />
                    </button>
                    <button
                      type="button"
                      className="rounded-lg p-1.5 transition hover:bg-red-50"
                      onClick={() => onDeleteBlock(block.instanceId)}
                      onPointerDown={(event) => event.stopPropagation()}
                    >
                      <Trash2 className="h-3.5 w-3.5 text-gray-400 hover:text-red-500" />
                    </button>
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-1.5 text-[11px]">
                  <span
                    className={cn(
                      "h-1.5 w-1.5 rounded-full",
                      block.status === "configured"
                        ? "bg-emerald-500"
                        : "bg-amber-400",
                    )}
                  />
                  <span className="text-gray-400">
                    {block.status === "configured"
                      ? "Configured"
                      : "Needs setup"}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
