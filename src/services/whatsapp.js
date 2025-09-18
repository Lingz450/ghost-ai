import axios from "axios";
import { META } from "../config/meta.js";

const base = `https://graph.facebook.com/v20.0/${META.phoneId}/messages`;

async function sendText(to, body) {
  await axios.post(
    base,
    { messaging_product: "whatsapp", to, type: "text", text: { body } },
    { headers: { Authorization: `Bearer ${META.token}` } }
  );
}

export async function send(to, body) { return sendText(to, body); }

/**
 * Normalize inbound webhook and return { from, to, text, reply }
 */
export async function handleIncoming(payload) {
  const entry = payload?.entry?.[0];
  const changes = entry?.changes?.[0]?.value;
  const msg = changes?.messages?.[0];
  if (!msg) return null;

  const from = msg.from; // phone or group participant
  // for groups, changes.metadata has details; we’ll use a default "to" if needed
  const to = META.defaultTo || from;
  const text = msg.text?.body || "";

  return {
    from, to, text,
    reply: async (t) => sendText(to, t)
  };
}
