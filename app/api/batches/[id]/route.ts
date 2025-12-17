import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 });

  const { id } = await params;

  const batch = await prisma.batch.findUnique({
    where: { id },
    include: {
        recipients: true,
        template: true,
        sender: true
    }
  });

  if (!batch || batch.ownerId !== session.user.id) {
    return new NextResponse("Not Found", { status: 404 });
  }

  return NextResponse.json(batch);
}
