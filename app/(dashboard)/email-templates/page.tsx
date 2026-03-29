export const dynamic = "force-dynamic";

import { Header } from "@/components/layout/header";
import { EmailTemplatesClient } from "@/components/email-templates/email-templates-client";
import { getAllEmailTemplates } from "@/server/actions/email-templates";

export default async function EmailTemplatesPage() {
  const templates = await getAllEmailTemplates();

  return (
    <div className="flex flex-col h-full">
      <Header title="Email Templates" />
      <div className="flex-1 overflow-auto">
        <EmailTemplatesClient templates={templates as any} />
      </div>
    </div>
  );
}
