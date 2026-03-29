"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, Tag } from "lucide-react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import {
  createCompany,
  updateCompany,
  deleteCompany,
  createCustomerStatus,
  updateCustomerStatus,
  deleteCustomerStatus,
  createIndustry,
  updateIndustry,
  deleteIndustry,
  createVisitFrequency,
  updateVisitFrequency,
  deleteVisitFrequency,
  createInteractionType,
  updateInteractionType,
  deleteInteractionType,
} from "@/server/actions/settings";
import {
  createEventType,
  updateEventType,
  deleteEventType,
} from "@/server/actions/events";

// ─── Types ────────────────────────────────────────────────────────────────────

interface LookupItem {
  id: string;
  name: string;
}

interface EventTypeItem {
  id: string;
  name: string;
  slug: string;
  color: string;
  sortOrder: number;
  isActive: boolean;
}

interface SettingsClientProps {
  companies: LookupItem[];
  customerStatuses: LookupItem[];
  industries: LookupItem[];
  visitFrequencies: LookupItem[];
  interactionTypes: LookupItem[];
  eventTypes: EventTypeItem[];
}

// ─── Color options for Event Types ───────────────────────────────────────────

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

function getColorClass(color: string) {
  return COLOR_OPTIONS.find((c) => c.value === color)?.cls ?? COLOR_OPTIONS[COLOR_OPTIONS.length - 1].cls;
}

function toSlug(name: string) {
  return name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

// ─── Reusable LookupSection ───────────────────────────────────────────────────

interface LookupSectionProps {
  title: string;
  description: string;
  items: LookupItem[];
  onCreate: (name: string) => Promise<{ data?: any; error?: string }>;
  onUpdate: (id: string, name: string) => Promise<{ data?: any; error?: string }>;
  onDelete: (id: string) => Promise<{ success?: boolean; error?: string }>;
}

function LookupSection({
  title,
  description,
  items,
  onCreate,
  onUpdate,
  onDelete,
}: LookupSectionProps) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<LookupItem | null>(null);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  function openCreate() {
    setEditing(null);
    setName("");
    setShowForm(true);
  }

  function openEdit(item: LookupItem) {
    setEditing(item);
    setName(item.name);
    setShowForm(true);
  }

  async function handleSave() {
    if (!name.trim()) {
      toast({ title: "Name is required", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const result = editing
        ? await onUpdate(editing.id, name.trim())
        : await onCreate(name.trim());
      if (result.error) {
        toast({ title: result.error, variant: "destructive" });
      } else {
        toast({ title: editing ? `${title} updated` : `${title} added` });
        setShowForm(false);
        router.refresh();
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(item: LookupItem) {
    if (!confirm(`Delete "${item.name}"? This cannot be undone.`)) return;
    setDeletingId(item.id);
    try {
      const result = await onDelete(item.id);
      if (result.error) {
        toast({ title: result.error, variant: "destructive" });
      } else {
        toast({ title: "Deleted" });
        router.refresh();
      }
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{description}</p>
        <Button size="sm" onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Add {title}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {title} ({items.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No {title.toLowerCase()} yet. Add your first one.
            </p>
          ) : (
            <div className="rounded-md border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left px-4 py-2 font-medium text-muted-foreground">Name</th>
                    <th className="w-20 px-4 py-2" />
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {items.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-4 py-2">{item.name}</td>
                      <td className="px-4 py-2">
                        <div className="flex items-center gap-1 justify-end">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7"
                            onClick={() => openEdit(item)}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 text-red-500 hover:text-red-700"
                            onClick={() => handleDelete(item)}
                            disabled={deletingId === item.id}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showForm} onOpenChange={(v) => !v && setShowForm(false)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{editing ? `Edit ${title}` : `Add ${title}`}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1">
              <Label>Name</Label>
              <Input
                placeholder={`Enter ${title.toLowerCase()} name`}
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSave()}
                autoFocus
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? "Saving..." : editing ? "Update" : "Add"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Event Types Section ──────────────────────────────────────────────────────

function EventTypesSection({ eventTypes }: { eventTypes: EventTypeItem[] }) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<EventTypeItem | null>(null);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [color, setColor] = useState("blue");
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  function openCreate() {
    setEditing(null);
    setName("");
    setSlug("");
    setColor("blue");
    setShowForm(true);
  }

  function openEdit(et: EventTypeItem) {
    setEditing(et);
    setName(et.name);
    setSlug(et.slug);
    setColor(et.color);
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
      const data = {
        name: name.trim(),
        slug: slug.trim() || toSlug(name),
        color,
        sortOrder: editing?.sortOrder ?? eventTypes.length,
        isActive: true,
      };
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

  async function handleDelete(et: EventTypeItem) {
    if (!confirm(`Delete event type "${et.name}"? Events using this type will lose their type assignment.`)) return;
    setDeletingId(et.id);
    try {
      const result = await deleteEventType(et.id);
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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Manage event categories available when creating events.
        </p>
        <Button size="sm" onClick={openCreate}>
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
            <div className="rounded-md border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left px-4 py-2 font-medium text-muted-foreground">Name</th>
                    <th className="text-left px-4 py-2 font-medium text-muted-foreground">Slug</th>
                    <th className="text-left px-4 py-2 font-medium text-muted-foreground">Color</th>
                    <th className="w-20 px-4 py-2" />
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {eventTypes.map((et) => (
                    <tr key={et.id} className="hover:bg-gray-50">
                      <td className="px-4 py-2">
                        <Badge className={`text-xs border ${getColorClass(et.color)}`}>
                          {et.name}
                        </Badge>
                        {!et.isActive && (
                          <span className="ml-2 text-xs text-red-500">(inactive)</span>
                        )}
                      </td>
                      <td className="px-4 py-2 font-mono text-xs text-muted-foreground">
                        {et.slug}
                      </td>
                      <td className="px-4 py-2 text-xs capitalize text-muted-foreground">
                        {et.color}
                      </td>
                      <td className="px-4 py-2">
                        <div className="flex items-center gap-1 justify-end">
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
                            onClick={() => handleDelete(et)}
                            disabled={deletingId === et.id}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showForm} onOpenChange={(v) => !v && setShowForm(false)}>
        <DialogContent className="max-w-sm">
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
                autoFocus
              />
            </div>
            <div className="space-y-1">
              <Label>Slug</Label>
              <Input
                placeholder="e.g. delta-center"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Lowercase letters, numbers, hyphens only.
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
                        <span className={`inline-block w-3 h-3 rounded-full border ${c.cls}`} />
                        {c.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {name && (
                <Badge className={`mt-1 text-xs border ${getColorClass(color)}`}>
                  Preview: {name}
                </Badge>
              )}
            </div>
            <div className="flex justify-end gap-2">
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

// ─── Main Settings Client ─────────────────────────────────────────────────────

export function SettingsClient({
  companies: companiesList,
  customerStatuses: customerStatusesList,
  industries: industriesList,
  visitFrequencies: visitFrequenciesList,
  interactionTypes: interactionTypesList,
  eventTypes: eventTypesList,
}: SettingsClientProps) {
  return (
    <div className="flex-1 overflow-auto p-6">
      <Tabs defaultValue="event-types">
        <TabsList className="mb-6 flex-wrap h-auto gap-1">
          <TabsTrigger value="event-types">Event Types</TabsTrigger>
          <TabsTrigger value="companies">Companies</TabsTrigger>
          <TabsTrigger value="customer-statuses">Customer Statuses</TabsTrigger>
          <TabsTrigger value="industries">Industries</TabsTrigger>
          <TabsTrigger value="visit-frequencies">Visit Frequencies</TabsTrigger>
          <TabsTrigger value="interaction-types">Interaction Types</TabsTrigger>
        </TabsList>

        <TabsContent value="event-types">
          <EventTypesSection eventTypes={eventTypesList} />
        </TabsContent>

        <TabsContent value="companies">
          <LookupSection
            title="Company"
            description="Companies available when creating events."
            items={companiesList}
            onCreate={createCompany}
            onUpdate={updateCompany}
            onDelete={deleteCompany}
          />
        </TabsContent>

        <TabsContent value="customer-statuses">
          <LookupSection
            title="Customer Status"
            description="Status options for customers (e.g. lead, active, churned)."
            items={customerStatusesList}
            onCreate={createCustomerStatus}
            onUpdate={updateCustomerStatus}
            onDelete={deleteCustomerStatus}
          />
        </TabsContent>

        <TabsContent value="industries">
          <LookupSection
            title="Industry"
            description="Industry options for customer records."
            items={industriesList}
            onCreate={createIndustry}
            onUpdate={updateIndustry}
            onDelete={deleteIndustry}
          />
        </TabsContent>

        <TabsContent value="visit-frequencies">
          <LookupSection
            title="Visit Frequency"
            description="How often visits are scheduled for customers."
            items={visitFrequenciesList}
            onCreate={createVisitFrequency}
            onUpdate={updateVisitFrequency}
            onDelete={deleteVisitFrequency}
          />
        </TabsContent>

        <TabsContent value="interaction-types">
          <LookupSection
            title="Interaction Type"
            description="Types of interactions logged for customers (e.g. call, email, site visit)."
            items={interactionTypesList}
            onCreate={createInteractionType}
            onUpdate={updateInteractionType}
            onDelete={deleteInteractionType}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
