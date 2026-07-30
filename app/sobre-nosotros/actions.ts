"use server";

import { Resend } from "resend";

export type ContactActionState = {
  status: "idle" | "success" | "error";
  message?: string;
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function sendContactMessage(
  prevState: ContactActionState,
  formData: FormData
): Promise<ContactActionState> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const msg = String(formData.get("msg") ?? "").trim();

  if (!name || !msg) {
    return { status: "error", message: "Nombre y mensaje son obligatorios." };
  }

  if (!EMAIL_REGEX.test(email)) {
    return { status: "error", message: "El correo electrónico no es válido." };
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const to = process.env.CONTACT_EMAIL_TO ?? "discordrobertbluesfolk@gmail.com";
  const from = process.env.CONTACT_EMAIL_FROM ?? "Arcade Vault <onboarding@resend.dev>";

  const { error } = await resend.emails.send({
    from,
    to,
    replyTo: email,
    subject: "Nuevo mensaje de contacto — Arcade Vault",
    text: `Nombre: ${name}\nEmail: ${email}\n\nMensaje:\n${msg}`,
  });

  if (error) {
    return { status: "error", message: "No se pudo enviar el mensaje. Intenta de nuevo." };
  }

  return { status: "success" };
}
