"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Check, Trash2, Circle, Clock } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Task } from "@/types";
import { taskSchema, TaskInput } from "@/lib/validations";
import { createTask, updateTask, deleteTask } from "@/server/actions/tasks";
import { formatDate } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const PRIORITY_COLORS = {
  low: "bg-slate-100 text-slate-700",
  medium: "bg-blue-100 text-blue-700",
  high: "bg-amber-100 text-amber-700",
  urgent: "bg-red-100 text-red-700",
};

const STATUS_ICONS = {
  todo: Circle,
  "in-progress": Clock,
  done: Check,
  cancelled: Trash2,
};

interface TasksClientProps {
  initialTasks: Task[];
  currentUserId: string;
}

export function TasksClient({ initialTasks, currentUserId }: TasksClientProps) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState("all");

  const editForm = useForm<TaskInput>({
    resolver: zodResolver(taskSchema),
  });

  const form = useForm<TaskInput>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      status: "todo",
      priority: "medium",
    },
  });

  const filtered = initialTasks.filter(
    (t) => filterStatus === "all" || t.status === filterStatus
  );

  const onSubmit = async (data: TaskInput) => {
    setLoading(true);
    try {
      const result = await createTask(data, currentUserId);
      if (result.error) {
        toast({ title: "Error", description: result.error, variant: "destructive" });
      } else {
        toast({ title: "Task created" });
        form.reset({ status: "todo", priority: "medium" });
        setShowForm(false);
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (task: Task, status: Task["status"]) => {
    await updateTask(task.id, { status });
    router.refresh();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this task?")) return;
    await deleteTask(id);
    router.refresh();
  };

  const openEditTask = (task: Task) => {
    setEditingTask(task);
    editForm.reset({
      title: task.title,
      description: task.description ?? "",
      priority: task.priority,
      status: task.status,
      dueDate: task.dueDate instanceof Date ? task.dueDate.toISOString().split("T")[0] : task.dueDate ?? "",
    });
  };

  const onEditSubmit = async (data: TaskInput) => {
    if (!editingTask) return;
    setEditLoading(true);
    try {
      const result = await updateTask(editingTask.id, data);
      if (result?.error) {
        toast({ title: "Error", description: result.error, variant: "destructive" });
      } else {
        toast({ title: "Task updated" });
        setEditingTask(null);
        router.refresh();
      }
    } finally {
      setEditLoading(false);
    }
  };

  const counts = {
    all: initialTasks.length,
    todo: initialTasks.filter((t) => t.status === "todo").length,
    "in-progress": initialTasks.filter((t) => t.status === "in-progress").length,
    done: initialTasks.filter((t) => t.status === "done").length,
  };

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <div className="flex items-center gap-3 border-b bg-white px-6 py-3">
        <div className="flex gap-2">
          {(["all", "todo", "in-progress", "done"] as const).map((s) => (
            <Button
              key={s}
              size="sm"
              variant={filterStatus === s ? "default" : "outline"}
              onClick={() => setFilterStatus(s)}
            >
              {s === "all" ? "All" : s === "in-progress" ? "In Progress" : s === "todo" ? "To Do" : "Done"}
              <span className="ml-1.5 bg-white/20 text-xs px-1.5 py-0.5 rounded-full">
                {counts[s as keyof typeof counts]}
              </span>
            </Button>
          ))}
        </div>
        <div className="flex-1" />
        <Button onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Task
        </Button>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="space-y-2 max-w-3xl mx-auto">
          {filtered.map((task, i) => {
            const StatusIcon = STATUS_ICONS[task.status];
            return (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                className={cn(
                  "flex items-start gap-3 p-4 rounded-lg border bg-white cursor-pointer hover:shadow-sm hover:border-gray-300 transition-all",
                  task.status === "done" && "opacity-60"
                )}
                onClick={() => openEditTask(task)}
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleStatusChange(task, task.status === "done" ? "todo" : "done");
                  }}
                  className="mt-0.5 shrink-0"
                >
                  <StatusIcon
                    className={cn(
                      "h-5 w-5",
                      task.status === "done"
                        ? "text-green-500 fill-green-500"
                        : "text-muted-foreground"
                    )}
                  />
                </button>
                <div className="flex-1 min-w-0">
                  <p
                    className={cn(
                      "text-sm font-medium",
                      task.status === "done" && "line-through"
                    )}
                  >
                    {task.title}
                  </p>
                  {task.description && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {task.description}
                    </p>
                  )}
                  <div className="flex items-center gap-2 mt-1.5">
                    <span
                      className={`text-xs px-1.5 py-0.5 rounded ${PRIORITY_COLORS[task.priority]}`}
                    >
                      {task.priority}
                    </span>
                    {task.dueDate && (
                      <span className="text-xs text-muted-foreground">
                        Due: {formatDate(task.dueDate)}
                      </span>
                    )}
                    {task.assignedTo && (
                      <span className="text-xs text-muted-foreground">
                        → {task.assignedTo.fullName}
                      </span>
                    )}
                    {task.customer && (
                      <span className="text-xs text-blue-600">
                        {task.customer.companyName}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                  <Select
                    value={task.status}
                    onValueChange={(v) => handleStatusChange(task, v as any)}
                  >
                    <SelectTrigger className="h-7 w-32 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todo">To Do</SelectItem>
                      <SelectItem value="in-progress">In Progress</SelectItem>
                      <SelectItem value="done">Done</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 text-destructive hover:text-destructive"
                    onClick={(e) => { e.stopPropagation(); handleDelete(task.id); }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </motion.div>
            );
          })}
          {filtered.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <CheckSquare className="h-12 w-12 mx-auto mb-3 opacity-20" />
              <p>No tasks found</p>
            </div>
          )}
        </div>
      </div>

      {/* Edit Task Dialog */}
      <Dialog open={!!editingTask} onOpenChange={(o) => !o && setEditingTask(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Task</DialogTitle>
          </DialogHeader>
          <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
            <div>
              <Label>Title *</Label>
              <Input {...editForm.register("title")} placeholder="Task title" />
              {editForm.formState.errors.title && (
                <p className="text-xs text-destructive mt-1">
                  {editForm.formState.errors.title.message}
                </p>
              )}
            </div>
            <div>
              <Label>Description</Label>
              <Textarea {...editForm.register("description")} rows={2} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Priority</Label>
                <Select
                  value={editForm.watch("priority")}
                  onValueChange={(v) => editForm.setValue("priority", v as any)}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Due Date</Label>
                <Input {...editForm.register("dueDate")} type="date" />
              </div>
              <div>
                <Label>Status</Label>
                <Select
                  value={editForm.watch("status")}
                  onValueChange={(v) => editForm.setValue("status", v as any)}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todo">To Do</SelectItem>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                    <SelectItem value="done">Done</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditingTask(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={editLoading}>
                {editLoading ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={showForm} onOpenChange={(o) => !o && setShowForm(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Task</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label>Title *</Label>
              <Input {...form.register("title")} placeholder="Task title" />
              {form.formState.errors.title && (
                <p className="text-xs text-destructive mt-1">
                  {form.formState.errors.title.message}
                </p>
              )}
            </div>
            <div>
              <Label>Description</Label>
              <Textarea {...form.register("description")} rows={2} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Priority</Label>
                <Select
                  value={form.watch("priority")}
                  onValueChange={(v) => form.setValue("priority", v as any)}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Due Date</Label>
                <Input {...form.register("dueDate")} type="date" />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Creating..." : "Create Task"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Fix: missing import for CheckSquare
function CheckSquare({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
      />
    </svg>
  );
}
