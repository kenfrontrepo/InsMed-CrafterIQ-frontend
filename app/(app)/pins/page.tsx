import { redirect } from "next/navigation";

// Pins hidden — original page archived in _archived-pages/pins-page.tsx
export default function AllPinsPage() {
  redirect("/chat");
}
