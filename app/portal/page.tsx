"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence } from "framer-motion";
import { Building2, CheckCircle, Send } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { customerRequestSchema, CustomerRequestInput } from "@/lib/validations";

export default function PortalPage() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<CustomerRequestInput>({
    resolver: zodResolver(customerRequestSchema),
  });

  async function onSubmit(data: CustomerRequestInput) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error ?? "Submission failed");
      }

      setSubmitted(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1B4F8A] to-[#0D2E54] flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="h-16 w-16 rounded-2xl bg-white/10 flex items-center justify-center">
              <Building2 className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white">RBM Services</h1>
          <p className="text-blue-200 mt-1">Customer Request Portal</p>
        </div>

        <AnimatePresence mode="wait">
          {submitted ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <Card>
                <CardContent className="py-12 text-center">
                  <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                  <h2 className="text-xl font-bold mb-2">Request Submitted!</h2>
                  <p className="text-muted-foreground">
                    Thank you! Our team will review your request and follow up within
                    1-2 business days.
                  </p>
                  <Button
                    className="mt-6"
                    onClick={() => {
                      setSubmitted(false);
                      form.reset();
                    }}
                  >
                    Submit Another Request
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Submit a Request</CardTitle>
                  <CardDescription>
                    Have a question or concern about your service? We're here to help.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Your Name *</Label>
                        <Input
                          {...form.register("customerName")}
                          placeholder="Jane Smith"
                        />
                        {form.formState.errors.customerName && (
                          <p className="text-xs text-destructive mt-1">
                            {form.formState.errors.customerName.message}
                          </p>
                        )}
                      </div>
                      <div>
                        <Label>Email Address *</Label>
                        <Input
                          {...form.register("customerEmail")}
                          type="email"
                          placeholder="jane@company.com"
                        />
                        {form.formState.errors.customerEmail && (
                          <p className="text-xs text-destructive mt-1">
                            {form.formState.errors.customerEmail.message}
                          </p>
                        )}
                      </div>
                    </div>
                    <div>
                      <Label>Subject *</Label>
                      <Input
                        {...form.register("subject")}
                        placeholder="e.g., Cleaning schedule change request"
                      />
                      {form.formState.errors.subject && (
                        <p className="text-xs text-destructive mt-1">
                          {form.formState.errors.subject.message}
                        </p>
                      )}
                    </div>
                    <div>
                      <Label>Description *</Label>
                      <Textarea
                        {...form.register("description")}
                        placeholder="Please describe your request or concern in detail..."
                        rows={5}
                      />
                      {form.formState.errors.description && (
                        <p className="text-xs text-destructive mt-1">
                          {form.formState.errors.description.message}
                        </p>
                      )}
                    </div>
                    {error && (
                      <p className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                        {error}
                      </p>
                    )}
                    <Button type="submit" className="w-full" disabled={loading}>
                      <Send className="h-4 w-4 mr-2" />
                      {loading ? "Submitting..." : "Submit Request"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="text-center mt-6 text-blue-200 text-sm">
          <p>RBM Services · Double Take · Five Star</p>
          <p className="text-xs mt-1 text-blue-300">
            For urgent issues, call us directly at (555) 123-4567
          </p>
        </div>
      </div>
    </div>
  );
}
