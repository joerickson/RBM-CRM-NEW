"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Inbox, Users, AlertCircle, Tag, Settings2 } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CustomerRequest, Profile } from "@/types";
import { formatDate } from "@/lib/utils";
import { updateRequestStatus } from "@/server/actions/requests";
import { toast } from "@/hooks/use-toast";

const STATUS_COLORS = {
  open: "bg-red-100 text-red-700",
  "in-review": "bg-amber-100 text-amber-700",
  resolved: "bg-green-100 text-green-700",
  closed: "bg-gray-100 text-gray-600",
};

const PRIORITY_COLORS = {
  low: "bg-slate-100 text-slate-700",
  medium: "bg-blue-100 text-blue-700",
  high: "bg-amber-100 text-amber-700",
  urgent: "bg-red-100 text-red-700",
};

interface AdminClientProps {
  requests: (CustomerRequest & { customer?: any })[];
  allProfiles: Profile[];
}

export function AdminClient({ requests, allProfiles }: AdminClientProps) {
  const router = useRouter();
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const handleStatusChange = async (
    id: string,
    status: "open" | "in-review" | "resolved" | "closed"
  ) => {
    setUpdatingId(id);
    try {
      const result = await updateRequestStatus(id, status);
      if (result.error) {
        toast({ title: "Error", description: result.error, variant: "destructive" });
      } else {
        toast({ title: "Status updated" });
        router.refresh();
      }
    } finally {
      setUpdatingId(null);
    }
  };

  const openRequests = requests.filter((r) => r.status === "open");
  const activeRequests = requests.filter((r) => r.status === "in-review");
  const resolvedRequests = requests.filter(
    (r) => r.status === "resolved" || r.status === "closed"
  );

  return (
    <div className="flex-1 overflow-auto p-6 space-y-6">
      {/* Quick Links */}
      <div className="flex gap-3 flex-wrap">
        <Link href="/admin/settings">
          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-purple-100 flex items-center justify-center">
                <Settings2 className="h-4 w-4 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-semibold">Settings</p>
                <p className="text-xs text-muted-foreground">Manage dropdown options</p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/admin/event-types">
          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-blue-100 flex items-center justify-center">
                <Tag className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-semibold">Event Types</p>
                <p className="text-xs text-muted-foreground">Manage event categories</p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
              <AlertCircle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{openRequests.length}</p>
              <p className="text-xs text-muted-foreground">Open Requests</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center">
              <Inbox className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{activeRequests.length}</p>
              <p className="text-xs text-muted-foreground">In Review</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{allProfiles.length}</p>
              <p className="text-xs text-muted-foreground">Team Members</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="requests">
        <TabsList>
          <TabsTrigger value="requests">
            Customer Requests ({requests.length})
          </TabsTrigger>
          <TabsTrigger value="team">Team Members ({allProfiles.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="requests">
          <div className="space-y-3">
            {requests.map((req, i) => (
              <motion.div
                key={req.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
              >
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium text-sm">{req.subject}</p>
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[req.status]}`}
                          >
                            {req.status}
                          </span>
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full ${PRIORITY_COLORS[req.priority]}`}
                          >
                            {req.priority}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mb-1">
                          From: <span className="font-medium">{req.customerName}</span>{" "}
                          ({req.customerEmail})
                        </p>
                        {req.customer && (
                          <p className="text-xs text-blue-600 mb-1">
                            Account: {req.customer.companyName}
                          </p>
                        )}
                        <p className="text-sm text-muted-foreground">{req.description}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Submitted: {formatDate(req.createdAt)}
                        </p>
                      </div>
                      <div className="shrink-0">
                        <Select
                          value={req.status}
                          onValueChange={(v) => handleStatusChange(req.id, v as any)}
                          disabled={updatingId === req.id}
                        >
                          <SelectTrigger className="w-32 h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="open">Open</SelectItem>
                            <SelectItem value="in-review">In Review</SelectItem>
                            <SelectItem value="resolved">Resolved</SelectItem>
                            <SelectItem value="closed">Closed</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
            {requests.length === 0 && (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  <Inbox className="h-12 w-12 mx-auto mb-3 opacity-20" />
                  <p>No customer requests yet</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="team">
          <div className="rounded-lg border bg-white overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Name</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Email</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Role</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {allProfiles.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{p.fullName ?? "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{p.email}</td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className="capitalize text-xs">
                        {p.role}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatDate(p.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
