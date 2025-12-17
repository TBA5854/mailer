import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { encrypt } from "@/lib/crypto";

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const senders = await prisma.sender.findMany({
    where: { ownerId: session.user.id },
    select: { id: true, email: true, label: true, createdAt: true }, 
    orderBy: { createdAt: 'desc' }
  });

  return NextResponse.json(senders);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const body = await req.json();
  const { email, password, label } = body;

  if (!email || !password) {
    return new NextResponse("Missing fields", { status: 400 });
  }

  // Encrypt password
  const { encryptedData, iv } = encrypt(password);

  try {
    const sender = await prisma.sender.create({
      data: {
        email,
        label,
        encryptedAppPassword: encryptedData,
        iv,
        ownerId: session.user.id,
      },
    });
    return NextResponse.json(sender);
  } catch (error) {
    console.error(error);
    return new NextResponse("Error creating sender. Email might already be added.", { status: 500 });
  }
}

export async function DELETE(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) return new NextResponse("Missing ID", { status: 400 });

    try {
        const sender = await prisma.sender.findUnique({ where: { id } });
        if (!sender || sender.ownerId !== session.user.id) {
            return new NextResponse("Not Found", { status: 404 });
        }

        await prisma.sender.delete({ where: { id } });
        return NextResponse.json({ success: true });
    } catch (error) {
        return new NextResponse("Error deleting sender", { status: 500 });
    }
}
