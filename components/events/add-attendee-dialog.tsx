"use client";

import { useState, useEffect } from "react";
import { Search, UserPlus, Building2, User, Briefcase, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  addCustomerToEvent,
  addAttendeeToEvent,
  updateCustomerEventTickets,
  searchAttendeesAndCustomers,
} from "@/server/actions/events";
import { toast } from "@/hooks/use-toast";

interface AddAttendeeDialogProps {
  open: boolean;
  onClose: () => void;
  eventId: string;
  totalTickets: number;
  totalParkingPasses: number;
}

type SearchResult = {
  id: string;
  name: string;
  company: string | null;
  email: string | null;
  phone: string | null;
  type: "customer" | "attendee" | "employee";
  customerId: string | null;
  attendeeId: string | null;
  employeeId: string | null;
};

type PendingNew = {
  name: string;
  email: string;
  phone: string;
  company: string;
  notes: string;
};

function formatDisplayName(name: string, company: string | null, type: string) {
  if (type === "employee") return `${name} — Employee`;
  if (company) return `${name} — ${company}`;
  return name;
}

export function AddAttendeeDialog({
  open,
  onClose,
  eventId,
  totalTickets,
  totalParkingPasses,
}: AddAttendeeDialogProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState<SearchResult | null>(null);
  const [pendingNew, setPendingNew] = useState<PendingNew | null>(null);
  const [tickets, setTickets] = useState(0);
  const [parking, setParking] = useState(0);
  const [saving, setSaving] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  // Create new attendee modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newCompany, setNewCompany] = useState("");
  const [newNotes, setNewNotes] = useState("");

  useEffect(() => {
    if (!open) {
      setQuery("");
      setResults([]);
      setSelected(null);
      setPendingNew(null);
      setTickets(0);
      setParking(0);
      setShowDropdown(false);
    }
  }, [open]);

  useEffect(() => {
    const timeout = setTimeout(async () => {
      if (query.length < 2) {
        setResults([]);
        setShowDropdown(false);
        return;
      }
      if (selected || pendingNew) return;
      setSearching(true);
      const res = await searchAttendeesAndCustomers(query);
      setResults(res.data ?? []);
      setShowDropdown(true);
      setSearching(false);
    }, 300);
    return () => clearTimeout(timeout);
  }, [query, selected, pendingNew]);

  function selectResult(r: SearchResult) {
    setSelected(r);
    setPendingNew(null);
    setQuery(formatDisplayName(r.name, r.company, r.type));
    setShowDropdown(false);
  }

  function clearSelection() {
    setSelected(null);
    setPendingNew(null);
    setQuery("");
    setResults([]);
  }

  function openCreateModal() {
    setNewName(query.length >= 2 ? query : "");
    setNewEmail("");
    setNewPhone("");
    setNewCompany("");
    setNewNotes("");
    setShowDropdown(false);
    setShowCreateModal(true);
  }

  function handleCreateConfirm() {
    if (!newName.trim()) {
      toast({ title: "Full name is required", variant: "destructive" });
      return;
    }
    const pending: PendingNew = {
      name: newName.trim(),
      email: newEmail,
      phone: newPhone,
      company: newCompany,
      notes: newNotes,
    };
    setPendingNew(pending);
    setSelected(null);
    setQuery(pending.company ? `${pending.name} — ${pending.company}` : pending.name);
    setShowCreateModal(false);
  }

  async function handleSave() {
    if (!selected && !pendingNew) {
      toast({ title: "Please select or create an attendee", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      if (selected?.type === "customer" && selected.customerId) {
        await addCustomerToEvent(eventId, selected.customerId);
        if (tickets > 0 || parking > 0) {
          await updateCustomerEventTickets(eventId, selected.customerId, tickets, parking);
        }
      } else if (selected) {
        await addAttendeeToEvent(eventId, {
          name: selected.name,
          email: selected.email ?? null,
          phone: selected.phone ?? null,
          company: selected.company ?? null,
          ticketsAssigned: tickets,
          parkingAssigned: parking,
          attendeeId: selected.attendeeId ?? null,
          type: selected.type === "employee" ? "employee" : "guest",
        });
      } else if (pendingNew) {
        await addAttendeeToEvent(eventId, {
          name: pendingNew.name,
          email: pendingNew.email || null,
          phone: pendingNew.phone || null,
          company: pendingNew.company || null,
          notes: pendingNew.notes || null,
          ticketsAssigned: tickets,
          parkingAssigned: parking,
          attendeeId: null,
          type: "guest",
        });
      }

      const displayName = selected?.name ?? pendingNew?.name ?? "Attendee";
      toast({ title: `${displayName} added to event` });
      onClose();
    } finally {
      setSaving(false);
    }
  }

  const canSave = selected !== null || pendingNew !== null;

  return (
    <>
      <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Add Attendee
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Smart search / combobox */}
            <div className="space-y-1 relative">
              <Label>Search by name, company, or email</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  className="pl-9 pr-8"
                  placeholder="Type to search customers, attendees & employees..."
                  value={query}
                  onChange={(e) => {
                    if (selected || pendingNew) clearSelection();
                    setQuery(e.target.value);
                  }}
                  onFocus={() => {
                    if (!selected && !pendingNew && results.length > 0) setShowDropdown(true);
                  }}
                />
                {(selected || pendingNew) && (
                  <button
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-gray-700"
                    onClick={clearSelection}
                    type="button"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Dropdown results */}
              {showDropdown && (
                <div className="absolute z-50 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {results.map((r) => (
                    <button
                      key={`${r.type}-${r.id}`}
                      className="w-full text-left px-3 py-2.5 hover:bg-gray-50 flex items-center gap-3 border-b last:border-b-0"
                      type="button"
                      onClick={() => selectResult(r)}
                    >
                      {r.type === "customer" ? (
                        <Building2 className="h-4 w-4 text-blue-500 shrink-0" />
                      ) : r.type === "employee" ? (
                        <Briefcase className="h-4 w-4 text-orange-500 shrink-0" />
                      ) : (
                        <User className="h-4 w-4 text-purple-500 shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {formatDisplayName(r.name, r.company, r.type)}
                        </p>
                        {r.email && (
                          <p className="text-xs text-muted-foreground truncate">{r.email}</p>
                        )}
                      </div>
                      <span
                        className={`ml-auto text-xs px-1.5 py-0.5 rounded shrink-0 ${
                          r.type === "customer"
                            ? "bg-blue-100 text-blue-700"
                            : r.type === "employee"
                            ? "bg-orange-100 text-orange-700"
                            : "bg-purple-100 text-purple-700"
                        }`}
                      >
                        {r.type === "customer"
                          ? "Customer"
                          : r.type === "employee"
                          ? "Employee"
                          : "Past Attendee"}
                      </span>
                    </button>
                  ))}
                  {/* Create new attendee option */}
                  <button
                    className="w-full text-left px-3 py-2.5 hover:bg-gray-50 flex items-center gap-3 text-[#1B4F8A] border-t"
                    type="button"
                    onClick={openCreateModal}
                  >
                    <UserPlus className="h-4 w-4 shrink-0" />
                    <span className="text-sm font-medium">Create new attendee...</span>
                  </button>
                </div>
              )}

              {searching && (
                <p className="text-xs text-muted-foreground mt-1">Searching...</p>
              )}
            </div>

            {/* Selected / pending info card */}
            {(selected || pendingNew) && (
              <div className="p-3 bg-gray-50 rounded-lg text-sm space-y-0.5">
                <p className="font-medium">
                  {selected
                    ? formatDisplayName(selected.name, selected.company, selected.type)
                    : pendingNew!.company
                    ? `${pendingNew!.name} — ${pendingNew!.company}`
                    : pendingNew!.name}
                </p>
                {(selected?.email || pendingNew?.email) && (
                  <p className="text-xs text-muted-foreground">
                    {selected?.email ?? pendingNew?.email}
                  </p>
                )}
                <span
                  className={`text-xs font-medium ${
                    selected?.type === "customer"
                      ? "text-blue-600"
                      : selected?.type === "employee"
                      ? "text-orange-600"
                      : "text-purple-600"
                  }`}
                >
                  {selected?.type === "customer"
                    ? "Customer"
                    : selected?.type === "employee"
                    ? "Employee"
                    : pendingNew
                    ? "New Attendee"
                    : "Past Attendee"}
                </span>
              </div>
            )}

            {/* Tickets & Parking */}
            {(totalTickets > 0 || totalParkingPasses > 0) && (
              <div className="grid grid-cols-2 gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="space-y-1">
                  <Label className="text-xs">Tickets Assigned</Label>
                  <Input
                    type="number"
                    min={0}
                    max={totalTickets}
                    value={tickets}
                    onChange={(e) => setTickets(Number(e.target.value))}
                  />
                  {totalTickets > 0 && (
                    <p className="text-xs text-muted-foreground">Max: {totalTickets}</p>
                  )}
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Parking Passes Assigned</Label>
                  <Input
                    type="number"
                    min={0}
                    max={totalParkingPasses}
                    value={parking}
                    onChange={(e) => setParking(Number(e.target.value))}
                  />
                  {totalParkingPasses > 0 && (
                    <p className="text-xs text-muted-foreground">Max: {totalParkingPasses}</p>
                  )}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving || !canSave}>
                {saving ? "Adding..." : "Add Attendee"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create New Attendee Modal */}
      <Dialog open={showCreateModal} onOpenChange={(v) => !v && setShowCreateModal(false)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Create New Attendee
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Full Name *</Label>
              <Input
                placeholder="e.g. John Smith"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Email</Label>
                <Input
                  type="email"
                  placeholder="john@example.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label>Phone</Label>
                <Input
                  placeholder="555-0100"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Company</Label>
              <Input
                placeholder="Company name"
                value={newCompany}
                onChange={(e) => setNewCompany(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label>Notes</Label>
              <Textarea
                placeholder="Any notes..."
                rows={2}
                value={newNotes}
                onChange={(e) => setNewNotes(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <Button variant="outline" onClick={() => setShowCreateModal(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateConfirm} disabled={!newName.trim()}>
                Confirm
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
