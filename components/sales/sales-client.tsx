"use client";

import { useState, useCallback } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Brain, RefreshCw, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Customer, SalesStage, KanbanColumn } from "@/types";
import { STAGE_LABELS, BRAND_LABELS, BRAND_COLORS, formatCurrency } from "@/lib/utils";
import { updateCustomerStage } from "@/server/actions/customers";
import { toast } from "@/hooks/use-toast";

const STAGE_ORDER: SalesStage[] = [
  "new-lead",
  "contacted",
  "qualified",
  "proposal-sent",
  "negotiating",
  "closed-won",
];

// Map customer status to a pipeline stage when stage is not explicitly set
function getEffectiveStage(customer: Customer): SalesStage {
  if (customer.stage) return customer.stage;
  switch (customer.status) {
    case "lead":
      return "new-lead";
    case "prospect":
      return "contacted";
    case "active":
      return "closed-won";
    case "at-risk":
      return "negotiating";
    case "churned":
      return "closed-lost";
    default:
      return "new-lead";
  }
}

const STAGE_COLORS: Record<SalesStage, string> = {
  "new-lead": "bg-slate-100 border-slate-300",
  contacted: "bg-blue-50 border-blue-200",
  qualified: "bg-indigo-50 border-indigo-200",
  "proposal-sent": "bg-purple-50 border-purple-200",
  negotiating: "bg-amber-50 border-amber-200",
  "closed-won": "bg-green-50 border-green-300",
  "closed-lost": "bg-red-50 border-red-200",
};

interface SalesClientProps {
  initialCustomers: Customer[];
}

export function SalesClient({ initialCustomers }: SalesClientProps) {
  const [columns, setColumns] = useState<KanbanColumn[]>(() =>
    STAGE_ORDER.map((stage) => ({
      id: stage,
      label: STAGE_LABELS[stage],
      customers: initialCustomers.filter((c) => getEffectiveStage(c) === stage),
    }))
  );

  const { data: pipelineAnalysis, refetch, isFetching } = useQuery({
    queryKey: ["pipeline-analysis"],
    queryFn: async () => {
      const res = await fetch("/api/ai/pipeline");
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    enabled: false,
  });

  const onDragEnd = useCallback(
    async (result: DropResult) => {
      const { source, destination, draggableId } = result;
      if (!destination || source.droppableId === destination.droppableId) return;

      const sourceStage = source.droppableId as SalesStage;
      const destStage = destination.droppableId as SalesStage;

      // Optimistic update
      setColumns((prev) => {
        const next = prev.map((col) => ({ ...col, customers: [...col.customers] }));
        const sourceCol = next.find((c) => c.id === sourceStage)!;
        const destCol = next.find((c) => c.id === destStage)!;
        const [moved] = sourceCol.customers.splice(source.index, 1);
        destCol.customers.splice(destination.index, 0, { ...moved, stage: destStage });
        return next;
      });

      const result2 = await updateCustomerStage(draggableId, destStage);
      if (result2.error) {
        toast({ title: "Error", description: result2.error, variant: "destructive" });
        // Revert
        setColumns((prev) => {
          const next = prev.map((col) => ({ ...col, customers: [...col.customers] }));
          const sourceCol = next.find((c) => c.id === destStage)!;
          const destCol = next.find((c) => c.id === sourceStage)!;
          const [moved] = sourceCol.customers.splice(destination.index, 1);
          destCol.customers.splice(source.index, 0, { ...moved, stage: sourceStage });
          return next;
        });
      }
    },
    []
  );

  const totalValue = columns
    .filter((c) => c.id !== "closed-lost")
    .flatMap((c) => c.customers)
    .reduce((sum, c) => sum + (parseFloat(String(c.monthlyValue ?? 0))), 0);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center justify-between border-b bg-white px-6 py-3">
        <div className="flex items-center gap-4">
          <p className="text-sm text-muted-foreground">
            Pipeline value:{" "}
            <span className="font-semibold text-foreground">
              {formatCurrency(totalValue)}/mo
            </span>
          </p>
          <p className="text-sm text-muted-foreground">
            {columns.flatMap((c) => c.customers).length} opportunities
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => refetch()}
          disabled={isFetching}
        >
          <Brain className={`h-4 w-4 mr-2 ${isFetching ? "animate-pulse" : ""}`} />
          AI Pipeline Analysis
        </Button>
      </div>

      {/* AI Analysis Banner */}
      {pipelineAnalysis && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="border-b bg-blue-50 px-6 py-3"
        >
          <p className="text-sm font-medium text-blue-900">{pipelineAnalysis.summary}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {pipelineAnalysis.topRecommendations?.map((rec: string, i: number) => (
              <span key={i} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                {rec}
              </span>
            ))}
          </div>
        </motion.div>
      )}

      {/* Kanban Board */}
      <div className="flex-1 overflow-x-auto p-6">
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="flex gap-4 h-full" style={{ minWidth: "max-content" }}>
            {columns.map((column) => (
              <div key={column.id} className="flex flex-col w-64 shrink-0">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-700">
                    {column.label}
                  </h3>
                  <Badge variant="secondary" className="text-xs">
                    {column.customers.length}
                  </Badge>
                </div>
                <Droppable droppableId={column.id}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`flex-1 min-h-[200px] rounded-lg p-2 transition-colors ${
                        snapshot.isDraggingOver
                          ? "bg-blue-50 border-2 border-blue-200 border-dashed"
                          : "bg-gray-100"
                      }`}
                    >
                      <div className="space-y-2">
                        {column.customers.map((customer, index) => (
                          <Draggable
                            key={customer.id}
                            draggableId={customer.id}
                            index={index}
                          >
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                              >
                                <Card
                                  className={`cursor-grab active:cursor-grabbing transition-shadow ${
                                    snapshot.isDragging ? "shadow-lg rotate-1" : ""
                                  }`}
                                >
                                  <CardContent className="p-3">
                                    <p className="text-sm font-medium leading-tight">
                                      {customer.companyName}
                                    </p>
                                    <span
                                      className={`inline-block mt-1 px-2 py-0.5 text-xs rounded-full border ${
                                        BRAND_COLORS[customer.brand]
                                      }`}
                                    >
                                      {BRAND_LABELS[customer.brand]}
                                    </span>
                                    {customer.monthlyValue && (
                                      <p className="text-xs text-muted-foreground mt-1">
                                        {formatCurrency(customer.monthlyValue)}/mo
                                      </p>
                                    )}
                                    {customer.primaryContactName && (
                                      <p className="text-xs text-muted-foreground">
                                        {customer.primaryContactName}
                                      </p>
                                    )}
                                  </CardContent>
                                </Card>
                              </div>
                            )}
                          </Draggable>
                        ))}
                      </div>
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            ))}
          </div>
        </DragDropContext>
      </div>
    </div>
  );
}
