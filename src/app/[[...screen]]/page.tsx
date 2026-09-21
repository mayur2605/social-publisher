import { notFound } from "next/navigation";
import { Workspace } from "@/components/workspace";
import { configured } from "@/lib/env";
export const dynamic = "force-dynamic";
export default async function Page({
  params,
}: {
  params: Promise<{ screen?: string[] }>;
}) {
  const { screen } = await params;
  const name = screen?.join("/") || "overview";
  if (
    ![
      "overview",
      "compose",
      "library",
      "calendar",
      "posts",
      "accounts",
      "billing",
      "settings",
    ].includes(name)
  )
    notFound();
  return <Workspace screen={name} configured={configured()} />;
}
