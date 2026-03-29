"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Brain,
  RefreshCw,
  Edit,
  MapPin,
  Phone,
  Mail,
  DollarSign,
  Calendar,
  AlertTriangle,
  Heart,
  Star,
  MessageSquarePlus,
  CalendarPlus,
  PartyPopper,
  CheckCircle,
  XCircle,
  Send,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Customer } from "@/types";
import {
  BRAND_LABELS,
  BRAND_COLORS,
  STATUS_LABELS,
  STATUS_COLORS,
  STAGE_LABELS,
  formatCurrency,
  formatDate,
  getHealthColor,
  getRiskColor,
  getScoreBg,
} from "@/lib/utils";
import { CustomerFormDialog } from "./customer-form-dialog";
import { LogInteractionDialog } from "./log-interaction-dialog";
import { ScheduleVisitDialog } from "./schedule-visit-dialog";
import { AddToEventDialog } from "./add-to-event-dialog";
import { ActivityTimeline } from "./activity-timeline";
import { SendEmailDialog } from "./send-email-dialog";
import { toast } from "@/hooks/use-toast";
import { updateAttendance } from "@/server/actions/events";

interface EventCustomerEntry {
  id: string;
  attended: boolean | null;
  notes: string | null;
  event: {
    id: string;
    name: string;
    date: string | Date;
    location: string | null;
    type: string;
  };
}

interface UserOption {
  clerkId: string | null;
  fullName: string | null;
}

interface CustomerDetailClientProps {
  customer: Customer & {
    visits: any[];
    interactions: any[];
    requests: any[];
    sites: any[];
    eventCustomers?: EventCustomerEntry[];
  };
  repId?: string;
  allEvents?: Array<{
    id: string;
    name: string;
    date: string | Date;
    location: string | null;
    type: string;
  }>;
  interactionTypes?: { id: string; name: string }[];
  customerStatuses?: { id: string; name: string }[];
  industries?: { id: string; name: string }[];
  visitFrequencies?: { id: string; name: string }[];
  salesReps?: UserOption[];
  opsManagers?: UserOption[];
}

const EVENT_TYPE_LABELS: Record<string, string> = {
  "delta-center": "Delta Center Suite",
  theater: "Hale Center Theater",
  golf: "Golf Outing",
  dinner: "Dinner",
  "client-appreciation": "Client Appreciation",
  conference: "Conference",
  other: "Other",
};

const EVENT_TYPE_COLORS: Record<string, string> = {
  "delta-center": "bg-blue-100 text-blue-700 border-blue-200",
  theater: "bg-purple-100 text-purple-700 border-purple-200",
  golf: "bg-green-100 text-green-700 border-green-200",
  dinner: "bg-orange-100 text-orange-700 border-orange-200",
  "client-appreciation": "bg-pink-100 text-pink-700 border-pink-200",
  conference: "bg-indigo-100 text-indigo-700 border-indigo-200",
  other: "bg-gray-100 text-gray-700 border-gray-200",
};

export function CustomerDetailClient({
  customer,
  repId,
  allEvents = [],
  interactionTypes = [],
  customerStatuses = [],
  industries = [],
  visitFrequencies = [],
  salesReps = [],
  opsManagers = [],
}: CustomerDetailClientProps) {
  const [showEdit, setShowEdit] = useState(false);
  const [showLogInteraction, setShowLogInteraction] = useState(false);
  const [showScheduleVisit, setShowScheduleVisit] = useState(false);
  const [showAddToEvent, setShowAddToEvent] = useState(false);
  const [showSendEmail, setShowSendEmail] = useState(false);
  const [scoring, setScoring] = useState(false);
  const router = useRouter();

  const handleScore = async () => {
    setScoring(true);
    try {
      const res = await fetch("/api/ai/score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerId: customer.id }),
      });
      if (!res.ok) throw new Error("Failed");
      toast({ title: "AI scores updated successfully" });
      router.refresh();
    } catch {
      toast({ title: "Failed to score", variant: "destructive" });
    } finally {
      setScoring(false);
    }
  };

  const handleAttendance = async (
    eventId: string,
    attended: boolean
  ) => {
    await updateAttendance(eventId, customer.id, attended);
    router.refresh();
  };

  const eventCustomers = customer.eventCustomers ?? [];

  return (
    <div className="flex-1 overflow-auto p-6 space-y-6">
      {/* Header Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-2xl font-bold">{customer.companyName}</h2>
                <span
                  className={`px-2 py-1 rounded-full text-xs border ${BRAND_COLORS[customer.brand]}`}
                >
                  {BRAND_LABELS[customer.brand]}
                </span>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[customer.status]}`}
                >
                  {STATUS_LABELS[customer.status]}
                </span>
                {customer.stage && (
                  <Badge variant="outline">{STAGE_LABELS[customer.stage]}</Badge>
                )}
              </div>
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                {customer.address && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {customer.city}, {customer.state}
                  </span>
                )}
                {customer.monthlyValue && (
                  <span className="flex items-center gap-1">
                    <DollarSign className="h-3 w-3" />
                    {formatCurrency(customer.monthlyValue)}/mo
                  </span>
                )}
                {customer.contractEndDate && (
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Contract ends: {formatDate(customer.contractEndDate)}
                  </span>
                )}
                {(() => {
                  const salesRepClerkId = (customer as any).assignedSalesRepClerkId;
                  const opsManagerClerkId = (customer as any).assignedOperationsManagerClerkId;
                  const salesRep = salesRepClerkId
                    ? salesReps.find((u) => u.clerkId === salesRepClerkId)
                    : null;
                  const opsManager = opsManagerClerkId
                    ? opsManagers.find((u) => u.clerkId === opsManagerClerkId)
                    : null;
                  if (!salesRep && !opsManager) return null;
                  return (
                    <span className="flex items-center gap-1">
                      {salesRep && <span>Sales: {salesRep.fullName}</span>}
                      {salesRep && opsManager && <span>|</span>}
                      {opsManager && <span>Ops: {opsManager.fullName}</span>}
                    </span>
                  );
                })()}
              </div>
            </div>
            <div className="flex flex-wrap gap-2 justify-end">
              <Button
                variant="default"
                size="sm"
                className="bg-[#1B4F8A] hover:bg-[#163d6b]"
                onClick={() => setShowLogInteraction(true)}
              >
                <MessageSquarePlus className="h-4 w-4 mr-2" />
                Log Interaction
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSendEmail(true)}
              >
                <Send className="h-4 w-4 mr-2" />
                Send Email
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowScheduleVisit(true)}
              >
                <CalendarPlus className="h-4 w-4 mr-2" />
                Schedule Visit
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAddToEvent(true)}
              >
                <PartyPopper className="h-4 w-4 mr-2" />
                Add to Event
              </Button>
              <Button variant="outline" size="sm" onClick={handleScore} disabled={scoring}>
                <Brain className={`h-4 w-4 mr-2 ${scoring ? "animate-pulse" : ""}`} />
                {scoring ? "Scoring..." : "Re-score"}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setShowEdit(true)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* AI Scores */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Brain className="h-4 w-4 text-[#1B4F8A]" />
              AI Scores
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Heart className="h-3 w-3" />
                  Health Score
                </span>
                <span className={`text-sm font-bold ${getHealthColor(customer.aiHealthScore)}`}>
                  {customer.aiHealthScore ?? "—"}
                </span>
              </div>
              {customer.aiHealthScore !== null && (
                <Progress
                  value={customer.aiHealthScore}
                  className={`h-2 ${getScoreBg(customer.aiHealthScore, "health")}`}
                />
              )}
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  Risk Score
                </span>
                <span className={`text-sm font-bold ${getRiskColor(customer.aiRiskScore)}`}>
                  {customer.aiRiskScore ?? "—"}
                </span>
              </div>
              {customer.aiRiskScore !== null && (
                <Progress
                  value={customer.aiRiskScore}
                  className="h-2"
                />
              )}
            </div>
            {customer.aiLeadScore !== null && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Star className="h-3 w-3" />
                    Lead Score
                  </span>
                  <span className="text-sm font-bold text-blue-600">
                    {customer.aiLeadScore}
                  </span>
                </div>
                <Progress value={customer.aiLeadScore} className="h-2" />
              </div>
            )}
            {customer.aiNotes && (
              <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                <p className="text-xs text-blue-800">{customer.aiNotes}</p>
              </div>
            )}
            {customer.lastScoreAt && (
              <p className="text-xs text-muted-foreground">
                Last scored: {formatDate(customer.lastScoreAt)}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Contact Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Contact Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {customer.primaryContactName && (
              <div>
                <p className="text-xs text-muted-foreground">Primary Contact</p>
                <p className="text-sm font-medium">{customer.primaryContactName}</p>
              </div>
            )}
            {customer.primaryContactEmail && (
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-3 w-3 text-muted-foreground" />
                <a
                  href={`mailto:${customer.primaryContactEmail}`}
                  className="text-blue-600 hover:underline"
                >
                  {customer.primaryContactEmail}
                </a>
              </div>
            )}
            {customer.primaryContactPhone && (
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-3 w-3 text-muted-foreground" />
                {customer.primaryContactPhone}
              </div>
            )}
            <Separator />
            {customer.assignedRep && (
              <div>
                <p className="text-xs text-muted-foreground">Assigned Rep</p>
                <p className="text-sm font-medium">{customer.assignedRep.fullName}</p>
                <p className="text-xs text-muted-foreground">{customer.assignedRep.email}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Contract */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Contract Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-xs text-muted-foreground">Monthly Value</p>
              <p className="text-xl font-bold text-green-600">
                {formatCurrency(customer.monthlyValue)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Start Date</p>
              <p className="text-sm">{formatDate(customer.contractStartDate)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">End Date</p>
              <p className="text-sm">{formatDate(customer.contractEndDate)}</p>
            </div>
            {customer.industry && (
              <div>
                <p className="text-xs text-muted-foreground">Industry</p>
                <p className="text-sm">{customer.industry}</p>
              </div>
            )}
            {(customer as any).visitFrequency && (
              <div>
                <p className="text-xs text-muted-foreground">Visit Frequency</p>
                <p className="text-sm capitalize">{(customer as any).visitFrequency}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tabs for History */}
      <Tabs defaultValue="timeline">
        <TabsList>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="interactions">
            Interactions ({customer.interactions?.length ?? 0})
          </TabsTrigger>
          <TabsTrigger value="visits">
            Visits ({customer.visits?.length ?? 0})
          </TabsTrigger>
          <TabsTrigger value="events">
            Events ({eventCustomers.length})
          </TabsTrigger>
          <TabsTrigger value="requests">
            Requests ({customer.requests?.length ?? 0})
          </TabsTrigger>
          <TabsTrigger value="sites">
            Sites ({customer.sites?.length ?? 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="timeline">
          <Card>
            <CardContent className="p-4">
              <ActivityTimeline
                interactions={customer.interactions ?? []}
                visits={customer.visits ?? []}
                requests={customer.requests ?? []}
                eventCustomers={eventCustomers}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="interactions">
          <Card>
            <CardContent className="p-0">
              {customer.interactions?.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm space-y-3">
                  <p>No interactions logged</p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowLogInteraction(true)}
                  >
                    <MessageSquarePlus className="h-4 w-4 mr-2" />
                    Log First Interaction
                  </Button>
                </div>
              ) : (
                <div className="divide-y">
                  {customer.interactions?.map((i: any) => (
                    <div key={i.id} className="px-4 py-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs capitalize">
                            {i.type}
                          </Badge>
                          <p className="text-sm font-medium">{i.subject}</p>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(i.interactionDate)}
                        </p>
                      </div>
                      {i.notes && (
                        <p className="text-xs text-muted-foreground mt-1">{i.notes}</p>
                      )}
                      {i.outcome && (
                        <p className="text-xs text-green-700 mt-1">
                          Outcome: {i.outcome}
                        </p>
                      )}
                      {i.rep && (
                        <p className="text-xs text-muted-foreground mt-1">
                          By: {i.rep.fullName}
                        </p>
                      )}
                      {i.nextFollowUpDate && (
                        <p className="text-xs text-amber-600 mt-1">
                          Follow-up: {formatDate(i.nextFollowUpDate)}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="visits">
          <Card>
            <CardContent className="p-0">
              {customer.visits?.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm space-y-3">
                  <p>No visits recorded</p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowScheduleVisit(true)}
                  >
                    <CalendarPlus className="h-4 w-4 mr-2" />
                    Schedule First Visit
                  </Button>
                </div>
              ) : (
                <div className="divide-y">
                  {customer.visits?.map((v: any) => (
                    <div key={v.id} className="px-4 py-3 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium capitalize">
                          {v.visitType.replace("-", " ")}
                        </p>
                        {v.employee && (
                          <p className="text-xs text-muted-foreground">
                            {v.employee.fullName}
                          </p>
                        )}
                        {v.notes && (
                          <p className="text-xs text-muted-foreground italic mt-1">
                            {v.notes}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-sm">{formatDate(v.visitDate)}</p>
                        <Badge
                          variant={v.status === "completed" ? "default" : "secondary"}
                          className="text-xs"
                        >
                          {v.status}
                        </Badge>
                        {v.customerRating && (
                          <p className="text-xs text-amber-500 mt-1">
                            {"★".repeat(v.customerRating)}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="events">
          <Card>
            <CardContent className="p-0">
              {eventCustomers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm space-y-3">
                  <p>Not invited to any events yet</p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowAddToEvent(true)}
                  >
                    <PartyPopper className="h-4 w-4 mr-2" />
                    Add to Event
                  </Button>
                </div>
              ) : (
                <div className="divide-y">
                  {eventCustomers.map((ec) => (
                    <div key={ec.id} className="px-4 py-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-sm font-medium">{ec.event.name}</p>
                            <Badge
                              className={`text-xs border ${EVENT_TYPE_COLORS[ec.event.type] ?? EVENT_TYPE_COLORS.other}`}
                            >
                              {EVENT_TYPE_LABELS[ec.event.type] ?? ec.event.type}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {formatDate(ec.event.date)}
                            </span>
                            {ec.event.location && (
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {ec.event.location}
                              </span>
                            )}
                          </div>
                          {ec.notes && (
                            <p className="text-xs text-muted-foreground italic mt-1">
                              {ec.notes}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() =>
                            handleAttendance(ec.event.id, !ec.attended)
                          }
                          className="flex items-center gap-1 text-sm"
                        >
                          {ec.attended ? (
                            <>
                              <CheckCircle className="h-4 w-4 text-green-500" />
                              <span className="text-green-600 text-xs">Attended</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="h-4 w-4 text-gray-400" />
                              <span className="text-gray-400 text-xs">Invited</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="requests">
          <Card>
            <CardContent className="p-0">
              {customer.requests?.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground text-sm">
                  No requests submitted
                </p>
              ) : (
                <div className="divide-y">
                  {customer.requests?.map((r: any) => (
                    <div key={r.id} className="px-4 py-3">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">{r.subject}</p>
                        <Badge variant="outline" className="text-xs capitalize">
                          {r.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {r.description}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sites">
          <Card>
            <CardContent className="p-0">
              {customer.sites?.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground text-sm">
                  No sites configured
                </p>
              ) : (
                <div className="divide-y">
                  {customer.sites?.map((s: any) => (
                    <div key={s.id} className="px-4 py-3">
                      <p className="text-sm font-medium">{s.siteName}</p>
                      <p className="text-xs text-muted-foreground">
                        {s.address}, {s.city}, {s.state}
                      </p>
                      {s.sqft && (
                        <p className="text-xs text-muted-foreground">
                          {s.sqft.toLocaleString()} sq ft
                        </p>
                      )}
                      {s.visitFrequency && (
                        <p className="text-xs text-muted-foreground">
                          Visit frequency: {s.visitFrequency}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {customer.notes && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{customer.notes}</p>
          </CardContent>
        </Card>
      )}

      <CustomerFormDialog
        open={showEdit}
        onClose={() => {
          setShowEdit(false);
          router.refresh();
        }}
        customer={customer}
        customerStatuses={customerStatuses}
        industries={industries}
        visitFrequencies={visitFrequencies}
        salesReps={salesReps}
        opsManagers={opsManagers}
      />

      {repId && (
        <LogInteractionDialog
          open={showLogInteraction}
          onClose={() => {
            setShowLogInteraction(false);
            router.refresh();
          }}
          customerId={customer.id}
          repId={repId}
          interactionTypes={interactionTypes}
        />
      )}

      <ScheduleVisitDialog
        open={showScheduleVisit}
        onClose={() => {
          setShowScheduleVisit(false);
          router.refresh();
        }}
        customerId={customer.id}
        sites={customer.sites}
      />

      <AddToEventDialog
        open={showAddToEvent}
        onClose={() => {
          setShowAddToEvent(false);
          router.refresh();
        }}
        customerId={customer.id}
        events={allEvents}
      />

      <SendEmailDialog
        open={showSendEmail}
        onClose={() => setShowSendEmail(false)}
        customer={{
          companyName: customer.companyName,
          primaryContactEmail: customer.primaryContactEmail,
          primaryContactName: customer.primaryContactName,
          contractEndDate: customer.contractEndDate,
          monthlyValue: customer.monthlyValue,
        }}
      />
    </div>
  );
}
