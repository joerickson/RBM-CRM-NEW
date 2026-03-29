"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
import { toast } from "@/hooks/use-toast";
import { applyMergeFields } from "@/lib/utils";

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  category: string;
}

interface SendEmailDialogProps {
  open: boolean;
  onClose: () => void;
  customer: {
    companyName: string;
    primaryContactEmail: string | null;
    primaryContactName: string | null;
    contractEndDate: string | null;
    monthlyValue: string | number | null;
  };
  repName?: string;
}

export function SendEmailDialog({
  open,
  onClose,
  customer,
  repName,
}: SendEmailDialogProps) {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [to, setTo] = useState(customer.primaryContactEmail ?? "");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [loadingTemplates, setLoadingTemplates] = useState(false);

  useEffect(() => {
    if (open) {
      setLoadingTemplates(true);
      fetch("/api/email-templates")
        .then((r) => r.json())
        .then((data) => setTemplates(data.templates ?? []))
        .catch(() => setTemplates([]))
        .finally(() => setLoadingTemplates(false));
    }
  }, [open]);

  const mergeFields: Record<string, string> = {
    customer_name: customer.companyName,
    contact_name: customer.primaryContactName ?? customer.companyName,
    rep_name: repName ?? "Your Rep",
    company_name: customer.companyName,
    contract_end_date: customer.contractEndDate ?? "N/A",
    monthly_value: customer.monthlyValue
      ? `$${Number(customer.monthlyValue).toLocaleString()}`
      : "N/A",
  };

  const handleTemplateSelect = (id: string) => {
    setSelectedTemplateId(id);
    const tmpl = templates.find((t) => t.id === id);
    if (tmpl) {
      setSubject(applyMergeFields(tmpl.subject, mergeFields));
      setBody(applyMergeFields(tmpl.body, mergeFields));
    }
  };

  const handleSend = async () => {
    if (!to || !subject || !body) {
      toast({ title: "Please fill in all fields", variant: "destructive" });
      return;
    }
    setSending(true);
    try {
      const res = await fetch("/api/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to,
          subject,
          html: body.replace(/\n/g, "<br />"),
        }),
      });
      if (!res.ok) throw new Error("Failed");
      toast({ title: "Email sent successfully" });
      onClose();
    } catch {
      toast({ title: "Failed to send email", variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Send Email to {customer.companyName}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Load from Template</Label>
            <Select
              value={selectedTemplateId}
              onValueChange={handleTemplateSelect}
              disabled={loadingTemplates}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={
                    loadingTemplates ? "Loading templates..." : "Select a template..."
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {templates.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="to">To</Label>
            <Input
              id="to"
              type="email"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              placeholder="recipient@example.com"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Email subject"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="body">Body</Label>
            <Textarea
              id="body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={12}
              placeholder="Email body..."
              className="font-mono text-sm"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSend}
            disabled={sending}
            className="bg-[#1B4F8A] hover:bg-[#163d6b]"
          >
            {sending ? "Sending..." : "Send Email"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
