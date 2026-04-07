import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendNewTicketEmail } from "@/lib/email";
import { sendPushNotifications } from "@/lib/push";

export async function POST(request: NextRequest) {
  const apiKey = request.headers.get("authorization");
  if (!apiKey || apiKey !== process.env.API_KEY) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const {
    client_id,
    workflow_name,
    title,
    body: ticketBody,
    is_ai_generated,
    resume_webhook,
  } = body as Record<string, unknown>;

  if (
    typeof client_id !== "string" ||
    typeof workflow_name !== "string" ||
    typeof title !== "string" ||
    typeof ticketBody !== "string" ||
    typeof is_ai_generated !== "boolean" ||
    typeof resume_webhook !== "string"
  ) {
    return Response.json({ error: "Missing or invalid fields" }, { status: 400 });
  }

  const ticket = await prisma.ticket.create({
    data: {
      client_id,
      workflow_name,
      title,
      body: ticketBody,
      is_ai_generated,
      resume_webhook,
    },
  });

  // Send email notifications to all users who have opted in
  const recipients = await prisma.user.findMany({
    where: { email_notifications: true },
    select: { email: true },
  });

  await Promise.allSettled(
    recipients.map((user) =>
      sendNewTicketEmail({
        to: user.email,
        title: ticket.title,
        client_id: ticket.client_id,
        workflow_name: ticket.workflow_name,
      })
    )
  );

  await sendPushNotifications({
    title: ticket.title,
    body: ticket.client_id,
  });

  return Response.json({ ticket_id: ticket.id, status: ticket.status }, { status: 201 });
}
