"use client";

import { useMemo, useState } from "react";
import { Bug, Clipboard, Lightbulb, MessageSquare } from "lucide-react";
import ProtectedPage from "@/components/ProtectedPage";
import Button from "@/components/ui/Button";
import { Input, PageHeader, SectionCard, Textarea } from "@/components/ui";
import { showToast } from "@/lib/toast";
import { KITCHENOPS_VERSION } from "@/config/version";

type FeedbackType = "Bug" | "Feature request" | "General feedback";
const options: Array<{ value: FeedbackType; icon: typeof Bug }> = [
  { value: "Bug", icon: Bug }, { value: "Feature request", icon: Lightbulb }, { value: "General feedback", icon: MessageSquare },
];

export default function FeedbackPage() {
  const [type, setType] = useState<FeedbackType>("Bug");
  const [subject, setSubject] = useState("");
  const [details, setDetails] = useState("");
  const supportEmail = process.env.NEXT_PUBLIC_KITCHENOPS_SUPPORT_EMAIL?.trim() ?? "";
  const report = useMemo(() => [`KitchenOps feedback`, `Type: ${type}`, `Subject: ${subject || "Not provided"}`, `Version: ${KITCHENOPS_VERSION}`, `Page: ${typeof window === "undefined" ? "" : window.location.href}`, ``, details || "No additional details provided."].join("\n"), [type, subject, details]);

  async function copyReport() {
    try { await navigator.clipboard.writeText(report); showToast({ tone: "success", title: "Feedback copied", description: "Paste it into an email or message to Simpson Software." }); }
    catch { showToast({ tone: "error", title: "Could not copy feedback", description: "Select the text manually and try again." }); }
  }

  function openEmail() {
    if (!supportEmail) { showToast({ tone: "warning", title: "Support email not configured", description: "Copy the feedback and send it using your normal contact with Simpson Software." }); return; }
    window.location.href = `mailto:${supportEmail}?subject=${encodeURIComponent(`[KitchenOps ${type}] ${subject || "Feedback"}`)}&body=${encodeURIComponent(report)}`;
  }

  return <ProtectedPage><main className="ko-page ko-enter"><div className="w-full max-w-4xl"><PageHeader eyebrow="Support" title="Send feedback" description="Prepare a clear bug report, feature request or general comment for Simpson Software." />
    <SectionCard>
      <div className="grid gap-3 sm:grid-cols-3">{options.map(({ value, icon: Icon }) => <button key={value} type="button" onClick={() => setType(value)} className={`min-h-24 rounded-2xl border p-4 text-left transition ${type === value ? "border-violet-500 bg-violet-50 ring-4 ring-violet-100" : "border-slate-200 bg-white hover:border-violet-200"}`}><Icon className="h-5 w-5 text-violet-800" /><span className="mt-3 block font-bold text-slate-950">{value}</span></button>)}</div>
      <div className="mt-6 space-y-5"><Input label="Subject" value={subject} onChange={setSubject} placeholder="Briefly describe the issue or idea" /><Textarea label="Details" value={details} onChange={setDetails} rows={8} placeholder="What happened? What did you expect? Include the page and steps where possible." /></div>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row"><Button onClick={copyReport} leadingIcon={<Clipboard className="h-4 w-4" />}>Copy feedback</Button><Button variant="secondary" onClick={openEmail}>Open email app</Button></div>
      {!supportEmail ? <p className="mt-4 text-sm text-amber-700">Set NEXT_PUBLIC_KITCHENOPS_SUPPORT_EMAIL before launch to enable the email button.</p> : null}
    </SectionCard>
  </div></main></ProtectedPage>;
}
