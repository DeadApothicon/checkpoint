import type { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function getUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return null;
  return prisma.user.findUnique({ where: { email: session.user.email } });
}

export async function POST(request: NextRequest) {
  const user = await getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  let subscription: unknown;
  try {
    subscription = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  let subs: unknown[];
  try {
    subs = JSON.parse(user.push_subscriptions);
  } catch {
    subs = [];
  }

  const endpoint = (subscription as { endpoint?: string }).endpoint;
  if (!endpoint) {
    return Response.json({ error: "Missing endpoint" }, { status: 400 });
  }

  const already = subs.some(
    (s) => (s as { endpoint?: string }).endpoint === endpoint
  );
  if (!already) {
    subs.push(subscription);
    await prisma.user.update({
      where: { id: user.id },
      data: { push_subscriptions: JSON.stringify(subs) },
    });
  }

  return Response.json({ ok: true });
}

export async function DELETE(request: NextRequest) {
  const user = await getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const endpoint = (body as { endpoint?: string }).endpoint;
  if (!endpoint) {
    return Response.json({ error: "Missing endpoint" }, { status: 400 });
  }

  let subs: unknown[];
  try {
    subs = JSON.parse(user.push_subscriptions);
  } catch {
    subs = [];
  }

  const filtered = subs.filter(
    (s) => (s as { endpoint?: string }).endpoint !== endpoint
  );

  await prisma.user.update({
    where: { id: user.id },
    data: { push_subscriptions: JSON.stringify(filtered) },
  });

  return Response.json({ ok: true });
}
