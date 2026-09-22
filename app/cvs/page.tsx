import { getAllCVs } from "@/app/lib/db";
import { Roster } from "@/app/components/ui/Roster";

export const dynamic = "force-dynamic";

export default async function CvsPage() {
  const cvs = await getAllCVs();
  return (
    <Roster
      cvs={cvs.map((cv) => ({
        ...cv,
        createdAt: new Date(cv.createdAt).toISOString(),
        updatedAt: new Date(cv.updatedAt).toISOString(),
      }))}
    />
  );
}