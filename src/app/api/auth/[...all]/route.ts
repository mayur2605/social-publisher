import { getAuth } from "@/lib/auth";
import { configured } from "@/lib/env";
export const runtime = "nodejs";
async function handler(request: Request) {
  if (!configured())
    return Response.json(
      { error: "Google sign-in is not configured yet." },
      { status: 503 },
    );
  return getAuth().handler(request);
}
export { handler as GET, handler as POST };
