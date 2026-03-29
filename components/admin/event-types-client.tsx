"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, GripVertical, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createEventType, updateEventType, deleteEventType } from "@/server/actions/events";
import { toast } from "@/hooks/use-toast";

const COLOR_OPTIONS = [
  { value: "blue",   label: "Blue",   cls: "bg-blue-100 text-blue-700 border-blue-200" },
  { value: "purple", label: "Purple", cls: "bg-purple-100 text-purple-700 border-purple-200" },
  { value: "green",  label: "Green",  cls: "bg-green-100 text-green-700 border-green-200" },
  { value: "orange", label: "Orange", cls: "bg-orange-100 text-orange-700 border-orange-200" },
  { value: "pink",   label: "Pink",   cls: "bg-pink-100 text-pink-700 border-pink-200" },
  { value: "indigo", label: "Indigo", cls: "bg-indigo-100 text-indigo-700 border-indigo-200" },
  { value: "red",    label: "Red",    cls: "bg-red-100 text-red-700 border-red-200" },
  { value: "yellow", label: "Yellow", cls: "bg-yellow-100 text-yellow-700 border-yellow-200" },
  { value: "teal",   label: "Teal",   cls: "bg-teal-100 text-teal-700 border-teal-200" },
  { value: "gray",   label: "Gray",   cls: "bg-gray-100 text-gray-700 border-gray-200" },
];

export function getColorClass(color: string) {
  return COLOR_OPTIONS.find((c) => c.value === color)?.cls ?? COLOR_OPTIONS[COLOR_OPTIONS.length - 1].cls;
}

interface EventType {
  id: string;
  name: string;
  slug: string;
  color: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
}

interface EventTypesClientProps {
  eventTypes: EventType[];
}

function toSlug(name: string) {
  return name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

export function EventTypesClient({ eventTypes }: EventTypesClientProps) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<EventType | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [color, setColor] = useState("blue");
  const [sortOrder, setSortOrder] = useState(0);

  function openCreate() {
    setEditing(null);
    setName("");
    setSlug("");
    setColor("blue");
    setSortOrder(eventTypes.length);
    setShowForm(true);
  }

  function openEdit(et: EventType) {
    setEditing(et);
    setName(et.name);
    setSlug(et.slug);
    setColor(et.color);
    setSortOrder(et.sortOrder);
    setShowForm(true);
  }

  function handleNameChange(val: string) {
    setName(val);
    if (!editing) setSlug(toSlug(val));
  }

  async function handleSave() {
    if (!name.trim()) {
      toast({ title: "Name is required", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const data = { name: name.trim(), slug: slug.trim() || toSlug(name), color, sortOrder, isActive: true };
      const result = editing
        ? await updateEventType(editing.id, data)
        : await createEventType(data);

      if (result.error) {
        toast({ title: result.error, variant: "destructive" });
      } else {
        toast({ title: editing ? "Event type updated" : "Event type created" });
        setShowForm(false);
        router.refresh();
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string, etName: string) {
    if (!confirm(`Delete event type "${etName}"? Events using this type will lose their type assignment.`)) return;
    setDeletingId(id);
    try {
      const result = await deleteEventType(id);
      if (result.error) {
        toast({ title: result.error, variant: "destructive" });
      } else {
        toast({ title: "Event type deleted" });
        router.refresh();
      }
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="flex-1 overflow-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">
            Manage the list of event types available when creating events.
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Add Event Type
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Tag className="h-4 w-4" />
            Event Types ({eventTypes.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {eventTypes.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No event types yet. Add your first one.
            </p>
          ) : (
            <div className="space-y-2">
              {eventTypes.map((et) => (
                <div
                  key={et.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <GripVertical className="h-4 w-4 text-gray-300" />
                    <Badge className={`text-xs border ${getColorClass(et.color)}`}>
                      {et.name}
                    </Badge>
                    <span className="text-xs text-muted-foreground font-mono">
                      {et.slug}
                    </span>
                    {!et.isActive && (
                      <span className="text-xs text-red-500">(inactive)</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7"
                      onClick={() => openEdit(et)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-red-500 hover:text-red-700"
                      onClick={() => handleDelete(et.id, et.name)}
                      disabled={deletingId === et.id}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showForm} onOpenChange={(v) => !v && setShowForm(false)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Event Type" : "New Event Type"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1">
              <Label>Name</Label>
              <Input
                placeholder="e.g. Delta Center Suite"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label>Slug (URL-safe ID)</Label>
              <Input
                placeholder="e.g. delta-center"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Lowercase letters, numbers, and hyphens only.
              </p>
            </div>
            <div className="space-y-1">
              <Label>Color</Label>
              <Select value={color} onValueChange={setColor}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {COLOR_OPTIONS.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-block w-3 h-3 rounded-full border ${c.cls}`}
                        />
                        {c.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {color && (
                <div className="mt-1">
                  <Badge className={`text-xs border ${getColorClass(color)}`}>
                    Preview: {name || "Event Type"}
                  </Badge>
                </div>
              )}
            </div>
            <div className="space-y-1">
              <Label>Sort Order</Label>
              <Input
                type="number"
                min={0}
                value={sortOrder}
                onChange={(e) => setSortOrder(Number(e.target.value))}
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? "Saving..." : editing ? "Update" : "Create"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
