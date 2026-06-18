import { redirect } from "next/navigation";

// Boards hidden — original page archived in _archived-pages/Boards-page.tsx
export default function BoardsPage() {
  redirect("/chat");
}
