import webpush from "web-push";
import { prisma } from "@/lib/prisma";

function initVapid() {
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT!,
    process.env.VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
  );
}

interface PushPayload {
  title: string;
  body: string;
}

export async function sendPushNotifications(payload: PushPayload) {
  if (
    !process.env.VAPID_PUBLIC_KEY ||
    !process.env.VAPID_PRIVATE_KEY ||
    !process.env.VAPID_SUBJECT
  ) {
    return;
  }

  initVapid();

  const users = await prisma.user.findMany({
    select: { push_subscriptions: true },
  });

  const subscriptions: webpush.PushSubscription[] = users.flatMap((user) => {
    try {
      return JSON.parse(user.push_subscriptions) as webpush.PushSubscription[];
    } catch {
      return [];
    }
  });

  if (subscriptions.length === 0) return;

  await Promise.allSettled(
    subscriptions.map((sub) =>
      webpush.sendNotification(sub, JSON.stringify(payload))
    )
  );
}
