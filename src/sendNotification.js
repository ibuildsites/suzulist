export async function sendNotification(role, title, body) {
  await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-push`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ role, title, body })
  });
}