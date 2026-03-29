"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { interactionSchema } from "@/lib/validations";
import { createInteraction } from "@/server/actions/customers";
import { toast } from "@/hooks/use-toast";

type FormData = z.infer<typeof interactionSchema>;

interface LogInteractionDialogProps {
  open: boolean;
  onClose: () => void;
  customerId: string;
  repId: string;
  interactionTypes?: { id: string; name: string }[];
}

const DEFAULT_INTERACTION_TYPES = [
  { id: "call", name: "Phone Call" },
  { id: "email", name: "Email" },
  { id: "meeting", name: "Meeting" },
  { id: "demo", name: "Demo" },
  { id: "proposal", name: "Proposal" },
  { id: "follow-up", name: "Follow-up" },
  { id: "other", name: "Other" },
];

export function LogInteractionDialog({
  open,
  onClose,
  customerId,
  repId,
  interactionTypes = [],
}: LogInteractionDialogProps) {
  const typeOptions = interactionTypes.length > 0
    ? interactionTypes.map((t) => ({ id: t.name, name: t.name }))
    : DEFAULT_INTERACTION_TYPES;
  const [saving, setSaving] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(interactionSchema),
    defaultValues: {
      customerId,
      interactionDate: new Date().toISOString().slice(0, 16),
      type: "call",
    },
  });

  const onSubmit = async (data: FormData) => {
    setSaving(true);
    try {
      const result = await createInteraction(data, repId);
      if (result.error) {
        toast({ title: result.error, variant: "destructive" });
      } else {
        toast({ title: "Interaction logged successfully" });
        reset();
        onClose();
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Log Interaction</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <input type="hidden" {...register("customerId")} />

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Type</Label>
              <Select
                defaultValue="call"
                onValueChange={(v) => setValue("type", v as any)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {typeOptions.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.type && (
                <p className="text-xs text-red-500">{errors.type.message}</p>
              )}
            </div>

            <div className="space-y-1">
              <Label>Date & Time</Label>
              <Input
                type="datetime-local"
                {...register("interactionDate")}
              />
              {errors.interactionDate && (
                <p className="text-xs text-red-500">
                  {errors.interactionDate.message}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-1">
            <Label>Subject</Label>
            <Input placeholder="Brief description" {...register("subject")} />
            {errors.subject && (
              <p className="text-xs text-red-500">{errors.subject.message}</p>
            )}
          </div>

          <div className="space-y-1">
            <Label>Notes</Label>
            <Textarea
              placeholder="Detailed notes from the interaction"
              rows={3}
              {...register("notes")}
            />
          </div>

          <div className="space-y-1">
            <Label>Outcome</Label>
            <Input
              placeholder="Result / next step"
              {...register("outcome")}
            />
          </div>

          <div className="space-y-1">
            <Label>Next Follow-up Date</Label>
            <Input type="date" {...register("nextFollowUpDate")} />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving..." : "Log Interaction"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
