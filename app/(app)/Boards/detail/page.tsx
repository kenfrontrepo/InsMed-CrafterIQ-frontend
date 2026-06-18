import { redirect } from "next/navigation";

// Boards detail hidden — original page archived in _archived-pages/Boards-detail-page.tsx
export default function BoardDetailPage() {
  redirect("/chat");
}
