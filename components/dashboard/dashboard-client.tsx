"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Users,
  TrendingUp,
  AlertTriangle,
  CheckSquare,
  DollarSign,
  Calendar,
  Inbox,
  Brain,
  RefreshCw,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { DashboardStats, AIActionPlan } from "@/types";
import { formatCurrency, BRAND_LABELS, getRiskColor } from "@/lib/utils";
import { ContractRenewalsWidget } from "./contract-renewals-widget";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  description?: string;
  color?: string;
  index: number;
}

function StatCard({ title, value, icon: Icon, description, color = "text-primary", index }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {title}
          </CardTitle>
          <Icon className={`h-4 w-4 ${color}`} />
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">{value}</p>
          {description && (
            <p className="text-xs text-muted-foreground mt-1">{description}</p>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

interface AtRiskRow {
  id: string;
  company_name: string;
  status: string;
  brand: string;
  monthly_value: string | null;
  ai_risk_score: number | null;
  ai_health_score: number | null;
  risk_threshold_days: number | null;
  primary_contact_name: string | null;
  last_visit_date: string | null;
}

interface DashboardClientProps {
  stats: DashboardStats;
  atRiskCustomers: AtRiskRow[];
}

export function DashboardClient({ stats, atRiskCustomers }: DashboardClientProps) {
  const [loadingPlan, setLoadingPlan] = useState(false);

  const { data: actionPlan, refetch: refetchPlan, isFetching } = useQuery<AIActionPlan>({
    queryKey: ["action-plan"],
    queryFn: async () => {
      const res = await fetch("/api/ai/action-plan");
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
    enabled: false,
  });

  const urgencyColor = {
    high: "bg-red-100 text-red-700 border-red-200",
    medium: "bg-amber-100 text-amber-700 border-amber-200",
    low: "bg-green-100 text-green-700 border-green-200",
  };

  return (
    <div className="p-6 space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          index={0}
          title="Total Customers"
          value={stats.totalCustomers}
          icon={Users}
          description={`${stats.activeCustomers} active`}
        />
        <StatCard
          index={1}
          title="Monthly Revenue"
          value={formatCurrency(stats.monthlyRevenue)}
          icon={DollarSign}
          color="text-green-600"
          description="From active accounts"
        />
        <StatCard
          index={2}
          title="Open Leads"
          value={stats.totalLeads}
          icon={TrendingUp}
          color="text-blue-600"
          description="In pipeline"
        />
        <StatCard
          index={3}
          title="At Risk"
          value={stats.atRiskCustomers}
          icon={AlertTriangle}
          color="text-red-600"
          description="Need attention"
        />
        <StatCard
          index={4}
          title="Open Tasks"
          value={stats.openTasks}
          icon={CheckSquare}
          color="text-purple-600"
        />
        <StatCard
          index={5}
          title="Today's Visits"
          value={stats.scheduledVisitsToday}
          icon={Calendar}
          color="text-indigo-600"
          description="Scheduled"
        />
        <StatCard
          index={6}
          title="Open Requests"
          value={stats.openRequests}
          icon={Inbox}
          color="text-orange-600"
          description="Portal submissions"
        />
        <StatCard
          index={7}
          title="Active Accounts"
          value={stats.activeCustomers}
          icon={Users}
          color="text-teal-600"
          description={`of ${stats.totalCustomers} total`}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* AI Action Plan */}
        <Card className="col-span-1">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-[#1B4F8A]" />
                <CardTitle className="text-base">AI Daily Action Plan</CardTitle>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => refetchPlan()}
                disabled={isFetching}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? "animate-spin" : ""}`} />
                {actionPlan ? "Refresh" : "Generate"}
              </Button>
            </div>
            <CardDescription>
              Claude AI analyzes your pipeline and generates daily priorities
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!actionPlan ? (
              <div className="text-center py-8 text-muted-foreground">
                <Brain className="h-12 w-12 mx-auto mb-3 opacity-20" />
                <p className="text-sm">Click "Generate" to get your AI-powered action plan</p>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">{actionPlan.summary}</p>
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Priorities
                  </p>
                  {actionPlan.priorities.map((p, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 border"
                    >
                      <Badge
                        className={`text-xs shrink-0 ${urgencyColor[p.urgency]}`}
                      >
                        {p.urgency}
                      </Badge>
                      <div>
                        <p className="text-sm font-medium">{p.customerName}</p>
                        <p className="text-xs text-muted-foreground">{p.action}</p>
                        <p className="text-xs text-muted-foreground italic">{p.reason}</p>
                      </div>
                    </div>
                  ))}
                </div>
                {actionPlan.insights.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Insights
                    </p>
                    {actionPlan.insights.map((insight, i) => (
                      <p key={i} className="text-xs text-muted-foreground flex gap-2">
                        <span>•</span>
                        <span>{insight}</span>
                      </p>
                    ))}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Contract Renewals */}
        <div className="col-span-1 lg:col-span-2">
          <ContractRenewalsWidget />
        </div>

        {/* At-Risk Customers */}
        <Card className="col-span-1">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <CardTitle className="text-base">At-Risk Accounts</CardTitle>
            </div>
            <CardDescription>
              Active clients with no completed visit in 90+ days
            </CardDescription>
          </CardHeader>
          <CardContent>
            {atRiskCustomers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p className="text-sm">No at-risk accounts</p>
              </div>
            ) : (
              <div className="space-y-3">
                {atRiskCustomers.map((customer) => {
                  const daysSince = customer.last_visit_date
                    ? Math.floor(
                        (Date.now() - new Date(customer.last_visit_date).getTime()) /
                          86400000
                      )
                    : null;
                  return (
                    <div
                      key={customer.id}
                      className="flex items-center justify-between p-3 rounded-lg border bg-red-50"
                    >
                      <div>
                        <p className="text-sm font-medium">{customer.company_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {BRAND_LABELS[customer.brand as keyof typeof BRAND_LABELS] ?? customer.brand} •{" "}
                          {formatCurrency(customer.monthly_value)}/mo
                        </p>
                        <p className="text-xs text-red-600 mt-0.5">
                          {daysSince !== null
                            ? `Last visit: ${daysSince} days ago`
                            : "No visits on record"}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-bold ${getRiskColor(customer.ai_risk_score)}`}>
                          Risk: {customer.ai_risk_score ?? "—"}
                        </p>
                        {customer.ai_risk_score !== null && (
                          <Progress
                            value={customer.ai_risk_score}
                            className="h-1 w-20 mt-1"
                          />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
