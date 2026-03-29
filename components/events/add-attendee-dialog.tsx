"use client";

import { useState, useEffect, useRef } from "react";
import { Search, UserPlus, Building2, User } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  type: "customer" | "attendee";
  customerId: string | null;
  attendeeId: string | null;
};

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
  const [tickets, setTickets] = useState(0);
  const [parking, setParking] = useState(0);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newCompany, setNewCompany] = useState("");
  const [saving, setSaving] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setResults([]);
      setSelected(null);
      setTickets(0);
      setParking(0);
      setNewName("");
      setNewEmail("");
      setNewPhone("");
      setNewCompany("");
    }
  }, [open]);

  useEffect(() => {
    const timeout = setTimeout(async () => {
      if (query.length < 2) {
        setResults([]);
        setShowDropdown(false);
        return;
      }
      setSearching(true);
      const res = await searchAttendeesAndCustomers(query);
      setResults(res.data ?? []);
      setShowDropdown(true);
      setSearching(false);
    }, 300);
    return () => clearTimeout(timeout);
  }, [query]);

  function selectResult(r: SearchResult) {
    setSelected(r);
    setQuery(r.name);
    setNewName(r.name);
    setNewEmail(r.email ?? "");
    setNewPhone(r.phone ?? "");
    setNewCompany(r.company ?? "");
    setShowDropdown(false);
  }

  function clearSelection() {
    setSelected(null);
    setQuery("");
    setNewName("");
    setNewEmail("");
    setNewPhone("");
    setNewCompany("");
  }

  async function handleSave() {
    const name = selected ? selected.name : newName.trim();
    if (!name) {
      toast({ title: "Name is required", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      if (selected?.type === "customer" && selected.customerId) {
        // Add as customer attendee
        await addCustomerToEvent(eventId, selected.customerId);
        // Update their ticket assignment if needed
        if (tickets > 0 || parking > 0) {
          await updateCustomerEventTickets(eventId, selected.customerId, tickets, parking);
        }
      } else {
        // Add as non-customer attendee
        await addAttendeeToEvent(eventId, {
          name,
          email: newEmail || null,
          phone: newPhone || null,
          company: newCompany || null,
          ticketsAssigned: tickets,
          parkingAssigned: parking,
          attendeeId: selected?.attendeeId ?? null,
          type: "guest",
        });
      }

      toast({ title: `${name} added to event` });
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Add Attendee
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search */}
          <div className="space-y-1 relative">
            <Label>Search by name, company, or email</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                ref={searchRef}
                className="pl-9"
                placeholder="Type to search customers & past attendees..."
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  if (selected) clearSelection();
                }}
                onFocus={() => results.length > 0 && setShowDropdown(true)}
              />
            </div>

            {/* Dropdown */}
            {showDropdown && results.length > 0 && (
              <div className="absolute z-50 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-52 overflow-y-auto">
                {results.map((r) => (
                  <button
                    key={r.id}
                    className="w-full text-left px-3 py-2.5 hover:bg-gray-50 flex items-center gap-3 border-b last:border-b-0"
                    onClick={() => selectResult(r)}
                  >
                    {r.type === "customer" ? (
                      <Building2 className="h-4 w-4 text-blue-500 shrink-0" />
                    ) : (
                      <User className="h-4 w-4 text-purple-500 shrink-0" />
                    )}
                    <div>
                      <p className="text-sm font-medium">
                        {r.company ? `${r.name} - ${r.company}` : r.name}
                      </p>
                      {r.email && (
                        <p className="text-xs text-muted-foreground">{r.email}</p>
                      )}
                    </div>
                    <span
                      className={`ml-auto text-xs px-1.5 py-0.5 rounded ${
                        r.type === "customer"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-purple-100 text-purple-700"
                      }`}
                    >
                      {r.type === "customer" ? "Customer" : "Past Attendee"}
                    </span>
                  </button>
                ))}
                {/* "Add new" option */}
                {query.length >= 2 && (
                  <button
                    className="w-full text-left px-3 py-2.5 hover:bg-gray-50 flex items-center gap-3 text-[#1B4F8A] border-t"
                    onClick={() => {
                      setShowDropdown(false);
                      setNewName(query);
                    }}
                  >
                    <UserPlus className="h-4 w-4" />
                    <span className="text-sm font-medium">
                      Add &ldquo;{query}&rdquo; as new attendee
                    </span>
                  </button>
                )}
              </div>
            )}

            {searching && (
              <p className="text-xs text-muted-foreground mt-1">Searching...</p>
            )}
          </div>

          {/* Details for new/guest attendee */}
          {!selected?.type || selected?.type === "attendee" ? (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1 col-span-2">
                <Label>Full Name *</Label>
                <Input
                  placeholder="e.g. John Smith"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                />
              </div>
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
              <div className="space-y-1 col-span-2">
                <Label>Company</Label>
                <Input
                  placeholder="Company name"
                  value={newCompany}
                  onChange={(e) => setNewCompany(e.target.value)}
                />
              </div>
            </div>
          ) : null}

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
                  <p className="text-xs text-muted-foreground">
                    Max: {totalTickets}
                  </p>
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
                  <p className="text-xs text-muted-foreground">
                    Max: {totalParkingPasses}
                  </p>
                )}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving || (!newName && !selected)}>
              {saving ? "Adding..." : "Add Attendee"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
