import { redirect } from "next/navigation";

export default function HomePage() {
  // Redirect to /chat
  // "use client" is not needed since this is a server file (for Next.js App Router)
  
  redirect("/chat");
}
