import AppShell from "@/app/components/ui/AppShell";
import { Roster } from "@/app/components/ui/Roster";
import { getAllCVs } from "@/app/lib/db";

export const dynamic = "force-dynamic";

export default async function CvsPage() {
  const cvs = await getAllCVs();
  return (
    <AppShell active="cvs">
      <Roster
        cvs={cvs.map((cv) => ({
          ...cv,
          createdAt: new Date(cv.createdAt).toISOString(),
          updatedAt: new Date(cv.updatedAt).toISOString(),
        }))}
      />
    </AppShell>
  );
}
