import { supabase } from "./supabaseClient";

export async function subscribeToPush(role) {
  if (!("serviceWorker" in navigator)) return;
  if (!("PushManager" in window)) return;

  const registration = await navigator.serviceWorker.ready;

  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: import.meta.env.VITE_VAPID_PUBLIC_KEY
  });

  await supabase.from("push_subscriptions").insert({
    user_role: role,
    subscription
  });

  return subscription;
}
