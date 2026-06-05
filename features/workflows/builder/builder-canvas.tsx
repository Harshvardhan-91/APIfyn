"use client";

import { getBrand } from "@/components/icons/brand-icons";
import { cn } from "@/lib/utils";
import { Settings, Trash2 } from "lucide-react";
import {
  type PointerEvent as ReactPointerEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import type { BuilderBlock, BuilderConnection } from "./types";

const BLOCK_WIDTH = 240;
const PORT_CENTER_Y = 54;

type BuilderCanvasProps = {
  blocks: BuilderBlock[];
  connections: BuilderConnection[];
  selectedBlockId?: string;
  onSelectBlock: (id: string) => void;
  onDeleteBlock: (id: string) => void;
  onConnect: (from: string, to: string) => void;
  onMoveBlock: (id: string, position: { x: number; y: number }) => void;
  className?: string;
};

type ConnectingState = {
  fromBlockId: string;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
};

function bezierPath(
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
): string {
  const midX = (fromX + toX) / 2;
  return `M ${fromX} ${fromY} C ${midX} ${fromY}, ${midX} ${toY}, ${toX} ${toY}`;
}

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

  const [connecting, setConnecting] = useState<ConnectingState | null>(null);
  const [hoveredInputId, setHoveredInputId] = useState<string | null>(null);

  function getCanvasPoint(event: { clientX: number; clientY: number }) {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return {
      x: event.clientX - rect.left + (canvasRef.current?.parentElement?.scrollLeft ?? 0),
      y: event.clientY - rect.top + (canvasRef.current?.parentElement?.scrollTop ?? 0),
    };
  }

  function startDrag(event: ReactPointerEvent, block: BuilderBlock) {
    if (connecting) return;
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

  const startConnecting = useCallback(
    (event: ReactPointerEvent, block: BuilderBlock) => {
      event.stopPropagation();
      event.preventDefault();
      const startX = block.position.x + BLOCK_WIDTH;
      const startY = block.position.y + PORT_CENTER_Y;
      const point = getCanvasPoint(event);
      setConnecting({
        fromBlockId: block.instanceId,
        startX,
        startY,
        currentX: point.x,
        currentY: point.y,
      });
    },
    [],
  );

  const cancelConnecting = useCallback(() => {
    setConnecting(null);
    setHoveredInputId(null);
  }, []);

  useEffect(() => {
    if (!connecting) return;

    function onMove(event: PointerEvent) {
      const point = getCanvasPoint(event);
      setConnecting((prev) =>
        prev ? { ...prev, currentX: point.x, currentY: point.y } : null,
      );
    }

    function onUp(event: PointerEvent) {
      if (!connecting) return;

      const target = document.elementFromPoint(event.clientX, event.clientY);
      const inputDot = target?.closest("[data-input-block-id]") as HTMLElement | null;

      if (inputDot) {
        const toBlockId = inputDot.getAttribute("data-input-block-id");
        if (toBlockId && toBlockId !== connecting.fromBlockId) {
          onConnect(connecting.fromBlockId, toBlockId);
        }
      }
      setConnecting(null);
      setHoveredInputId(null);
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setConnecting(null);
        setHoveredInputId(null);
      }
    }

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [connecting, onConnect, cancelConnecting]);

  const isValidDropTarget = useCallback(
    (blockId: string) => {
      if (!connecting) return false;
      if (blockId === connecting.fromBlockId) return false;
      return !connections.some(
        (c) => c.from === connecting.fromBlockId && c.to === blockId,
      );
    },
    [connecting, connections],
  );

  return (
    <section
      className={cn("relative flex-1 overflow-auto bg-gray-50/50", className)}
    >
      <div
        ref={canvasRef}
        className={cn(
          "relative min-h-[720px] min-w-[920px] bg-[radial-gradient(circle,#e5e7eb_1px,transparent_1px)] [background-size:20px_20px]",
          connecting && "cursor-crosshair",
        )}
        onClick={() => {
          if (connecting) cancelConnecting();
        }}
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
            const fromX = from.position.x + BLOCK_WIDTH;
            const fromY = from.position.y + PORT_CENTER_Y;
            const toX = to.position.x;
            const toY = to.position.y + PORT_CENTER_Y;
            const d = bezierPath(fromX, fromY, toX, toY);
            return (
              <g key={connection.id}>
                <path
                  d={d}
                  fill="none"
                  stroke="#d1d5db"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <path
                  d={d}
                  fill="none"
                  stroke="#6b7280"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeDasharray="6 4"
                />
              </g>
            );
          })}

          {connecting && (
            <path
              d={bezierPath(
                connecting.startX,
                connecting.startY,
                connecting.currentX,
                connecting.currentY,
              )}
              fill="none"
              stroke="#3b82f6"
              strokeWidth="2"
              strokeLinecap="round"
              strokeDasharray="6 4"
              className="animate-[dash_0.6s_linear_infinite]"
            />
          )}
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
          const isDropTarget = isValidDropTarget(block.instanceId);
          const isHoveredTarget = hoveredInputId === block.instanceId;

          return (
            <div
              key={block.instanceId}
              className={cn(
                "absolute w-[240px] touch-none select-none rounded-2xl border bg-white shadow-sm transition-all",
                isDragging
                  ? "cursor-grabbing shadow-xl ring-2 ring-gray-900/5"
                  : connecting
                    ? "cursor-default"
                    : "cursor-grab",
                isSelected
                  ? "border-gray-900 ring-4 ring-gray-900/5"
                  : isHoveredTarget && isDropTarget
                    ? "border-blue-400 ring-4 ring-blue-100"
                    : "border-gray-200 hover:shadow-md",
              )}
              style={{ left: block.position.x, top: block.position.y }}
              onPointerDown={(event) => {
                if (!connecting) startDrag(event, block);
              }}
              onPointerMove={moveDrag}
              onPointerUp={stopDrag}
              onPointerCancel={stopDrag}
            >
              {/* Input port (left) */}
              <button
                type="button"
                data-input-block-id={block.instanceId}
                className={cn(
                  "absolute -left-2.5 top-1/2 z-10 h-5 w-5 -translate-y-1/2 rounded-full border-2 shadow-sm transition-all",
                  isDropTarget && connecting
                    ? isHoveredTarget
                      ? "scale-125 border-blue-300 bg-blue-500 shadow-blue-200"
                      : "animate-pulse border-blue-200 bg-blue-400"
                    : "border-white bg-gray-400 hover:bg-gray-600",
                )}
                onClick={(event) => {
                  event.stopPropagation();
                  if (connecting && connecting.fromBlockId !== block.instanceId) {
                    const alreadyExists = connections.some(
                      (c) =>
                        c.from === connecting.fromBlockId &&
                        c.to === block.instanceId,
                    );
                    if (!alreadyExists) {
                      onConnect(connecting.fromBlockId, block.instanceId);
                    }
                    setConnecting(null);
                    setHoveredInputId(null);
                  }
                }}
                onPointerEnter={() => {
                  if (connecting && isDropTarget) {
                    setHoveredInputId(block.instanceId);
                  }
                }}
                onPointerLeave={() => {
                  if (hoveredInputId === block.instanceId) {
                    setHoveredInputId(null);
                  }
                }}
                onPointerDown={(event) => event.stopPropagation()}
              />

              {/* Output port (right) — drag starts connections */}
              <button
                type="button"
                className={cn(
                  "absolute -right-2.5 top-1/2 z-10 h-5 w-5 -translate-y-1/2 rounded-full border-2 border-white shadow-sm transition-all",
                  connecting?.fromBlockId === block.instanceId
                    ? "scale-110 bg-blue-500 ring-4 ring-blue-100"
                    : "bg-gray-900 hover:scale-110 hover:bg-blue-600",
                )}
                onPointerDown={(event) => {
                  event.stopPropagation();
                  startConnecting(event, block);
                }}
                title="Drag to connect"
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
