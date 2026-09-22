import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  CalendarClock,
  CheckCircle2,
  Clock,
  ClipboardList,
  Filter,
  MoreHorizontal,
  User,
  Wrench,
} from "lucide-react";
import { MainShell } from "@/components/trackwise/MainShell";
import { KpiCard } from "@/components/trackwise/KpiCard";
import { Panel } from "@/components/trackwise/shared";
import { UnifiedDataLayer } from "@/lib/trackwise/unified-data";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const Route = createFileRoute("/work-orders")({
  component: WorkOrderCenter,
});

function WorkOrderCenter() {
  type WorkOrderRecord = ReturnType<typeof UnifiedDataLayer.generateWorkOrders>[number];
  const [filter, setFilter] = useState("All");
  const [selectedWorkOrder, setSelectedWorkOrder] = useState<WorkOrderRecord | null>(null);

  const updateSelected = (updates: Partial<WorkOrderRecord>) => {
    if (selectedWorkOrder) setSelectedWorkOrder({ ...selectedWorkOrder, ...updates });
  };

  const workOrders = UnifiedDataLayer.generateWorkOrders();

  const openCount = workOrders.filter((wo) => wo.status === "Pending").length;
  const assignedCount = workOrders.filter((wo) => wo.status === "Scheduled").length;
  const inProgressCount = workOrders.filter((wo) => wo.status === "In Progress").length;
  const completedCount = workOrders.filter((wo) => wo.status === "Completed").length;

  const filteredWorkOrders =
    filter === "All"
      ? workOrders
      : workOrders.filter((wo) => wo.priority === filter || wo.status === filter);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "P1":
        return "bg-destructive/10 text-destructive border-destructive/20";
      case "P2":
        return "bg-warn/10 text-warn-foreground border-warn/20";
      case "P3":
        return "bg-primary/10 text-primary border-primary/20";
      case "P4":
        return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
      default:
        return "bg-muted-foreground/10 text-muted-foreground border-muted-foreground/20";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Pending":
        return "bg-destructive/10 text-destructive";
      case "Scheduled":
        return "bg-warn/10 text-warn-foreground";
      case "In Progress":
        return "bg-primary/10 text-primary";
      case "Completed":
        return "bg-emerald-500/10 text-emerald-500";
      default:
        return "bg-muted-foreground/10 text-muted-foreground";
    }
  };

  return (
    <MainShell
      title="UNIFIED WORK ORDER SYSTEM"
      subtitle="Centralized work order management across TMS, TDMS, SMMS, and COA"
    >
      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 mb-4">
        <KpiCard
          label="Open"
          value={openCount}
          icon={ClipboardList}
          tone="danger"
          hint="Pending work orders"
        />
        <KpiCard
          label="Assigned"
          value={assignedCount}
          icon={User}
          tone="warn"
          hint="Scheduled work"
        />
        <KpiCard
          label="In Progress"
          value={inProgressCount}
          icon={Wrench}
          tone="warn"
          hint="Currently being worked"
        />
        <KpiCard
          label="Completed"
          value={completedCount}
          icon={CheckCircle2}
          tone="success"
          hint="Finished work"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Work Orders List */}
        <div className="lg:col-span-2">
          <Panel
            title="WORK ORDERS"
            right={
              <div className="flex items-center gap-2">
                <Filter className="size-4 text-muted-foreground" />
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="rounded-md border border-input bg-background px-3 py-1.5 text-xs font-medium text-foreground outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="All">All</option>
                  <option value="P1">P1 — CRITICAL</option>
                  <option value="P2">P2 — HIGH</option>
                  <option value="P3">P3 — MEDIUM</option>
                  <option value="P4">P4 — LOW</option>
                  <option value="Pending">Pending</option>
                  <option value="Scheduled">Scheduled</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>
            }
          >
            <div className="space-y-2">
              {filteredWorkOrders.map((workOrder) => (
                <div
                  key={workOrder.id}
                  onClick={() => setSelectedWorkOrder(workOrder)}
                  className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                    selectedWorkOrder?.id === workOrder.id
                      ? "bg-primary/10 border-primary"
                      : getPriorityColor(workOrder.priority)
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${getPriorityColor(workOrder.priority)}`}
                      >
                        {workOrder.priority}
                      </span>
                      <span className="text-xs text-muted-foreground">{workOrder.source}</span>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="size-6">
                          <MoreHorizontal className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setSelectedWorkOrder(workOrder)}>
                          <ClipboardList className="size-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() =>
                            setSelectedWorkOrder({
                              ...workOrder,
                              assigned: "Track Gang A",
                              status: "Scheduled",
                            })
                          }
                        >
                          <User className="size-4 mr-2" />
                          Assign Team
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() =>
                            setSelectedWorkOrder({
                              ...workOrder,
                              scheduled: "Next available block",
                            })
                          }
                        >
                          <CalendarClock className="size-4 mr-2" />
                          Reschedule
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <p className="text-sm font-medium text-foreground mb-1">{workOrder.id}</p>
                  <p className="text-sm text-foreground mb-2">{workOrder.issue}</p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Wrench className="size-3" />
                      {workOrder.asset}
                    </span>
                    <span className="flex items-center gap-1">
                      <CalendarClock className="size-3" />
                      {workOrder.scheduled}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Status:</span>
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(workOrder.status)}`}
                    >
                      {workOrder.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        </div>

        {/* Work Order Detail */}
        <div>
          <Panel title="WORK ORDER DETAILS">
            {selectedWorkOrder ? (
              <div className="space-y-4">
                <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <ClipboardList className="size-5 text-primary" />
                    <span className="text-sm font-semibold text-primary">
                      {selectedWorkOrder.id}
                    </span>
                  </div>
                  <p className="text-sm text-foreground">{selectedWorkOrder.issue}</p>
                </div>

                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Source System</p>
                    <p className="text-sm font-semibold text-foreground">
                      {selectedWorkOrder.source}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Asset</p>
                    <p className="text-sm font-semibold text-foreground">
                      {selectedWorkOrder.asset}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Priority</p>
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${getPriorityColor(selectedWorkOrder.priority)}`}
                    >
                      {selectedWorkOrder.priority}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Assigned</p>
                    <p className="text-sm font-semibold text-foreground">
                      {selectedWorkOrder.assigned}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Scheduled</p>
                    <p className="text-sm font-semibold text-foreground">
                      {selectedWorkOrder.scheduled}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Status</p>
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(selectedWorkOrder.status)}`}
                    >
                      {selectedWorkOrder.status}
                    </span>
                  </div>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground mb-2">Dependencies</p>
                  <div className="flex flex-wrap gap-1">
                    {selectedWorkOrder.dependencies.map((dep: string) => (
                      <span
                        key={dep}
                        className="inline-flex items-center px-2 py-1 rounded bg-warn/10 text-warn-foreground text-xs"
                      >
                        {dep}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Button
                    className="w-full"
                    size="sm"
                    onClick={() =>
                      updateSelected({ assigned: "Track Gang A", status: "Scheduled" })
                    }
                  >
                    <User className="size-4 mr-2" />
                    Assign Team
                  </Button>
                  <Button
                    className="w-full"
                    variant="outline"
                    size="sm"
                    onClick={() => updateSelected({ scheduled: "Next available block" })}
                  >
                    <CalendarClock className="size-4 mr-2" />
                    Reschedule
                  </Button>
                  <Button
                    className="w-full"
                    variant="outline"
                    size="sm"
                    onClick={() => updateSelected({ status: "Completed" })}
                  >
                    <CheckCircle2 className="size-4 mr-2" />
                    Mark Complete
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <ClipboardList className="size-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-sm text-muted-foreground">Select a work order to view details</p>
              </div>
            )}
          </Panel>
        </div>
      </div>
    </MainShell>
  );
}
