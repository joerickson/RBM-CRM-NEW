"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { FileText, RefreshCw, AlertCircle } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";

interface ContractRenewalAlert {
  id: string;
  company_name: string;
  brand: string;
  monthly_value: string | null;
  contract_end_date: string;
  days_until_renewal: number;
  primary_contact_name: string | null;
  assigned_rep_name: string | null;
  urgency: "critical" | "high" | "medium";
}

const URGENCY_STYLES = {
  critical: {
    badge: "bg-red-100 text-red-700 border-red-200",
    row: "bg-red-50 border-red-100",
  },
  high: {
    badge: "bg-amber-100 text-amber-700 border-amber-200",
    row: "bg-amber-50 border-amber-100",
  },
  medium: {
    badge: "bg-blue-100 text-blue-700 border-blue-200",
    row: "bg-blue-50 border-blue-100",
  },
};

export function ContractRenewalsWidget() {
  const [alerts, setAlerts] = useState<ContractRenewalAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchAlerts = async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch("/api/alerts/contract-renewals?days=90");
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setAlerts(data.alerts ?? []);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  const formatEndDate = (dateStr: string) => {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(new Date(dateStr));
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-amber-500" />
            <CardTitle className="text-base">Contract Renewals</CardTitle>
            {alerts.length > 0 && (
              <Badge className="bg-amber-100 text-amber-700 text-xs">
                {alerts.length}
              </Badge>
            )}
          </div>
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7"
            onClick={fetchAlerts}
            disabled={loading}
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
        <CardDescription>
          Contracts expiring within the next 90 days
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading && (
          <div className="text-center py-8 text-muted-foreground">
            <RefreshCw className="h-6 w-6 mx-auto mb-2 animate-spin opacity-30" />
            <p className="text-sm">Loading...</p>
          </div>
        )}

        {error && (
          <div className="text-center py-6 text-muted-foreground">
            <AlertCircle className="h-6 w-6 mx-auto mb-2 text-red-400" />
            <p className="text-sm">Failed to load renewals</p>
          </div>
        )}

        {!loading && !error && alerts.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-8 w-8 mx-auto mb-2 opacity-20" />
            <p className="text-sm">No contracts expiring in the next 90 days</p>
          </div>
        )}

        {!loading && !error && alerts.length > 0 && (
          <div className="space-y-2">
            {alerts.map((alert) => {
              const styles = URGENCY_STYLES[alert.urgency];
              return (
                <Link key={alert.id} href={`/customers/${alert.id}`}>
                  <div
                    className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer hover:opacity-90 transition-opacity ${styles.row}`}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{alert.company_name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Expires {formatEndDate(alert.contract_end_date)}
                        {alert.assigned_rep_name && ` · ${alert.assigned_rep_name}`}
                      </p>
                      {alert.monthly_value && (
                        <p className="text-xs text-green-700 mt-0.5">
                          {formatCurrency(alert.monthly_value)}/mo
                        </p>
                      )}
                    </div>
                    <div className="text-right shrink-0 ml-3">
                      <Badge className={`text-xs border ${styles.badge}`}>
                        {alert.days_until_renewal}d
                      </Badge>
                      <p className="text-xs text-muted-foreground mt-1 capitalize">
                        {alert.urgency}
                      </p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
