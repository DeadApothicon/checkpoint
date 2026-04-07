"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function requireAuth() {
  const session = await getServerSession(authOptions);
  if (!session?.user) throw new Error("Unauthorized");
}

async function callWebhook(url: string, payload: object) {
  try {
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch {
    // Webhook delivery failure should not block the UI update
  }
}

export async function approveTicket(ticketId: string) {
  await requireAuth();

  const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
  if (!ticket || ticket.status !== "pending") return;

  await prisma.ticket.update({
    where: { id: ticketId },
    data: { status: "approved", actioned_at: new Date() },
  });

  await callWebhook(ticket.resume_webhook, {
    ticket_id: ticketId,
    action: "approved",
  });

  revalidatePath("/");
}

export async function denyTicket(ticketId: string) {
  await requireAuth();

  const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
  if (!ticket || ticket.status !== "pending") return;

  await prisma.ticket.update({
    where: { id: ticketId },
    data: { status: "denied", actioned_at: new Date() },
  });

  await callWebhook(ticket.resume_webhook, {
    ticket_id: ticketId,
    action: "denied",
  });

  revalidatePath("/");
}

export async function repromptTicket(ticketId: string, repromptText: string) {
  await requireAuth();

  const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
  if (!ticket || ticket.status !== "pending") return;

  await prisma.ticket.update({
    where: { id: ticketId },
    data: {
      status: "re_prompted",
      reprompt_text: repromptText,
      actioned_at: new Date(),
    },
  });

  await callWebhook(ticket.resume_webhook, {
    ticket_id: ticketId,
    action: "re_prompted",
    reprompt_text: repromptText,
  });

  revalidatePath("/");
}
