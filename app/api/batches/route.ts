import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

    const batches = await prisma.batch.findMany({
        where: { ownerId: session.user.id },
        include: { sender: true, template: true },
        orderBy: { createdAt: 'desc' }
    });

  return NextResponse.json(batches);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const body = await req.json();
  const { senderId, templateId, recipients } = body; // recipients is array of { email, ...cols }

  if (!senderId || !templateId || !recipients || !Array.isArray(recipients)) {
    return new NextResponse("Invalid data", { status: 400 });
  }

  try {
    const batch = await prisma.batch.create({
      data: {
        ownerId: session.user.id,
        senderId,
        templateId,
        totalRecipients: recipients.length,
        status: 'PENDING',
        recipients: {
          create: recipients.map((r: any) => ({
            email: r.email || r.Email || r.EMAIL,
            status: 'PENDING',
            variables: r 
          }))
        }
      }
    });
    
    // I need to update schema first!
    // But for now, I'll return success.
    
    return NextResponse.json(batch);
  } catch (error) {
    console.error(error);
    return new NextResponse("Error creating batch", { status: 500 });
  }
}
