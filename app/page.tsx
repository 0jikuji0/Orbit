import { redirect } from "next/navigation";
import { listMyWorkspaces } from "@/server/queries/workspaces";

export default async function HomePage() {
  const [first] = await listMyWorkspaces();
  redirect(first ? `/${first.slug}` : "/onboarding");
}
