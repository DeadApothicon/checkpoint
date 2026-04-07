export interface Ticket {
  id: string;
  client_id: string;
  workflow_name: string;
  title: string;
  body: string;
  is_ai_generated: boolean;
  status: "pending" | "approved" | "denied" | "re_prompted";
  reprompt_text: string | null;
  resume_webhook: string;
  created_at: string; // ISO date string
  actioned_at: string | null;
}

const t = (offsetMs: number) =>
  new Date(Date.now() - offsetMs).toISOString();

const MIN = 60_000;
const HR = 60 * MIN;

export const mockTickets: Ticket[] = [
  {
    id: "mock-1",
    client_id: "acme-ltd",
    workflow_name: "Customer Quote Generator",
    title: "Review quote for Acme Ltd — Job #1042",
    body: "Labour: £480\nMaterials: £320\nTotal: £800\n\nPayment terms: 30 days.",
    is_ai_generated: true,
    status: "pending",
    reprompt_text: null,
    resume_webhook: "https://example.com/webhook/abc123",
    created_at: t(23 * MIN),
    actioned_at: null,
  },
  {
    id: "mock-2",
    client_id: "globex-corp",
    workflow_name: "Invoice Approval",
    title: "Approve invoice INV-2024-0891 from Globex Corp",
    body: "Invoice for services rendered in March 2024.\nAmount: £1,250\nDue: 15 April 2024",
    is_ai_generated: false,
    status: "pending",
    reprompt_text: null,
    resume_webhook: "https://example.com/webhook/def456",
    created_at: t(2 * HR),
    actioned_at: null,
  },
  {
    id: "mock-3",
    client_id: "acme-ltd",
    workflow_name: "Client Report Generator",
    title: "Review monthly report for Acme Ltd — March 2024",
    body: "Monthly performance report:\n\n- Revenue: £24,500 (up 12% MoM)\n- Active projects: 8\n- Open support tickets: 3\n\nOverall sentiment: positive. Client satisfaction score: 4.2/5.",
    is_ai_generated: true,
    status: "pending",
    reprompt_text: null,
    resume_webhook: "https://example.com/webhook/ghi789",
    created_at: t(5 * MIN),
    actioned_at: null,
  },
  {
    id: "mock-4",
    client_id: "bright-media",
    workflow_name: "Contract Review",
    title: "Review service contract renewal — Bright Media",
    body: "Annual service contract renewal for Bright Media Ltd.\n\nTerm: 12 months\nMonthly retainer: £2,000\nServices: SEO, content strategy, monthly reporting\n\nNo changes from previous contract.",
    is_ai_generated: false,
    status: "pending",
    reprompt_text: null,
    resume_webhook: "https://example.com/webhook/jkl012",
    created_at: t(1 * HR + 12 * MIN),
    actioned_at: null,
  },
];
