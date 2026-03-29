"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Plus, Mail, Pencil, Trash2, Copy } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
import {
  createEmailTemplate,
  updateEmailTemplate,
  deleteEmailTemplate,
} from "@/server/actions/email-templates";
import { formatDate } from "@/lib/utils";

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  category: string;
  createdAt: Date | string;
  updatedAt: Date | string;
  createdBy?: { fullName: string | null } | null;
}

interface EmailTemplatesClientProps {
  templates: EmailTemplate[];
}

const CATEGORIES = [
  { value: "intro", label: "Introduction" },
  { value: "follow-up", label: "Follow-up" },
  { value: "proposal", label: "Proposal" },
  { value: "renewal", label: "Renewal" },
  { value: "thank-you", label: "Thank You" },
  { value: "general", label: "General" },
];

const CATEGORY_COLORS: Record<string, string> = {
  intro: "bg-blue-100 text-blue-700",
  "follow-up": "bg-amber-100 text-amber-700",
  proposal: "bg-purple-100 text-purple-700",
  renewal: "bg-green-100 text-green-700",
  "thank-you": "bg-pink-100 text-pink-700",
  general: "bg-gray-100 text-gray-700",
};

const MERGE_FIELDS = [
  "{{customer_name}}",
  "{{contact_name}}",
  "{{rep_name}}",
  "{{company_name}}",
  "{{contract_end_date}}",
  "{{monthly_value}}",
];

const DEFAULT_TEMPLATES: Omit<EmailTemplate, "id" | "createdAt" | "updatedAt">[] = [
  {
    name: "Introduction Email",
    subject: "Introduction from {{rep_name}} at RBM Services",
    body: `Hi {{contact_name}},

My name is {{rep_name}} and I'm reaching out from RBM Services. We specialize in commercial cleaning and facility maintenance for businesses like {{customer_name}}.

I'd love to schedule a quick 15-minute call to learn more about your facility needs and share how we've helped similar companies in your area.

Are you available this week for a brief conversation?

Best regards,
{{rep_name}}
RBM Services`,
    category: "intro",
    createdBy: null,
  },
  {
    name: "Follow-Up After Proposal",
    subject: "Following up on our proposal for {{customer_name}}",
    body: `Hi {{contact_name}},

I wanted to follow up on the proposal I sent over for {{customer_name}}. I hope you had a chance to review it.

I'm happy to answer any questions or adjust the scope to better fit your needs. We're committed to providing top-quality service at a competitive price.

Would you have 10 minutes to connect this week?

Best regards,
{{rep_name}}`,
    category: "follow-up",
    createdBy: null,
  },
  {
    name: "Contract Renewal Reminder",
    subject: "Your RBM Services contract is coming up for renewal",
    body: `Hi {{contact_name}},

I wanted to reach out because your service contract with RBM Services is coming up for renewal on {{contract_end_date}}.

We truly value our partnership with {{customer_name}} and would love to continue providing you with the same quality service you've come to expect.

I'll give you a call this week to discuss renewal options, including any updates to services or pricing. In the meantime, please don't hesitate to reach out.

Thank you for your continued trust in us.

Best regards,
{{rep_name}}
RBM Services`,
    category: "renewal",
    createdBy: null,
  },
];

function TemplateFormDialog({
  open,
  onClose,
  template,
}: {
  open: boolean;
  onClose: () => void;
  template?: EmailTemplate | null;
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: template?.name ?? "",
    subject: template?.subject ?? "",
    body: template?.body ?? "",
    category: template?.category ?? "general",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.subject || !form.body) return;
    setSaving(true);
    try {
      if (template) {
        await updateEmailTemplate(template.id, form);
        toast({ title: "Template updated" });
      } else {
        await createEmailTemplate(form);
        toast({ title: "Template created" });
      }
      router.refresh();
      onClose();
    } catch {
      toast({ title: "Failed to save template", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const insertMergeField = (field: string) => {
    setForm((f) => ({ ...f, body: f.body + field }));
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{template ? "Edit Template" : "New Email Template"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">Template Name</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Follow-up After Demo"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Select
                value={form.category}
                onValueChange={(v) => setForm((f) => ({ ...f, category: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="subject">Subject Line</Label>
            <Input
              id="subject"
              value={form.subject}
              onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
              placeholder="Email subject..."
              required
            />
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="body">Body</Label>
              <div className="flex gap-1 flex-wrap justify-end">
                {MERGE_FIELDS.map((field) => (
                  <button
                    key={field}
                    type="button"
                    onClick={() => insertMergeField(field)}
                    className="text-xs px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 hover:bg-blue-100 font-mono"
                  >
                    {field}
                  </button>
                ))}
              </div>
            </div>
            <Textarea
              id="body"
              value={form.body}
              onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
              rows={10}
              placeholder="Write your email body here. Use merge fields to personalize."
              required
              className="font-mono text-sm"
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={saving}
              className="bg-[#1B4F8A] hover:bg-[#163d6b]"
            >
              {saving ? "Saving..." : template ? "Save Changes" : "Create Template"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function EmailTemplatesClient({ templates }: EmailTemplatesClientProps) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [editTemplate, setEditTemplate] = useState<EmailTemplate | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<EmailTemplate | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this template?")) return;
    setDeleting(id);
    try {
      await deleteEmailTemplate(id);
      toast({ title: "Template deleted" });
      router.refresh();
    } catch {
      toast({ title: "Failed to delete", variant: "destructive" });
    } finally {
      setDeleting(null);
    }
  };

  const handleCopy = (template: EmailTemplate) => {
    navigator.clipboard.writeText(template.body);
    toast({ title: "Template body copied to clipboard" });
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Email Templates</h2>
          <p className="text-sm text-muted-foreground">
            Reusable templates with merge fields for consistent, fast communication
          </p>
        </div>
        <Button
          onClick={() => {
            setEditTemplate(null);
            setShowForm(true);
          }}
          className="bg-[#1B4F8A] hover:bg-[#163d6b]"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Template
        </Button>
      </div>

      {/* Merge field reference */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <p className="text-sm font-medium text-blue-800 mb-2">Available Merge Fields</p>
          <div className="flex flex-wrap gap-2">
            {MERGE_FIELDS.map((f) => (
              <code
                key={f}
                className="text-xs bg-white border border-blue-200 text-blue-700 px-2 py-0.5 rounded"
              >
                {f}
              </code>
            ))}
          </div>
        </CardContent>
      </Card>

      {templates.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Mail className="h-12 w-12 mx-auto mb-3 opacity-20" />
          <p className="text-sm font-medium mb-1">No templates yet</p>
          <p className="text-xs mb-4">Create your first template to get started</p>
          <Button
            variant="outline"
            onClick={() => {
              setEditTemplate(null);
              setShowForm(true);
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Template
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {templates.map((template, i) => (
            <motion.div
              key={template.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
            >
              <Card className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-sm truncate">{template.name}</CardTitle>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">
                        {template.subject}
                      </p>
                    </div>
                    <Badge
                      className={`text-xs shrink-0 capitalize ${
                        CATEGORY_COLORS[template.category] ?? CATEGORY_COLORS.general
                      }`}
                    >
                      {CATEGORIES.find((c) => c.value === template.category)?.label ??
                        template.category}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-xs text-muted-foreground line-clamp-3 font-mono bg-gray-50 rounded p-2">
                    {template.body}
                  </p>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">
                      Updated {formatDate(template.updatedAt)}
                    </p>
                    <div className="flex gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        onClick={() => handleCopy(template)}
                        title="Copy body"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        onClick={() => {
                          setEditTemplate(template);
                          setShowForm(true);
                        }}
                        title="Edit"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-red-500 hover:text-red-700 hover:bg-red-50"
                        onClick={() => handleDelete(template.id)}
                        disabled={deleting === template.id}
                        title="Delete"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      <TemplateFormDialog
        open={showForm}
        onClose={() => {
          setShowForm(false);
          setEditTemplate(null);
        }}
        template={editTemplate}
      />
    </div>
  );
}
