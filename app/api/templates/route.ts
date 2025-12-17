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

  const templates = await prisma.template.findMany({
    where: { ownerId: session.user.id },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(templates);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const body = await req.json();
  const { name, subject, htmlContent } = body;

  if (!name || !subject || !htmlContent) {
    return new NextResponse("Missing fields", { status: 400 });
  }

  try {
    const template = await prisma.template.create({
      data: {
        name,
        subject,
        htmlContent,
        ownerId: session.user.id,
      },
    });
    return NextResponse.json(template);
  } catch (error) {
    console.error(error);
    return new NextResponse("Error creating template", { status: 500 });
  }
}

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 });

  const body = await req.json();
  const { id, name, subject, htmlContent } = body;

  try {
    const template = await prisma.template.findUnique({ where: { id } });
    if (!template || template.ownerId !== session.user.id) {
        return new NextResponse("Not Found", { status: 404 });
    }

    const updated = await prisma.template.update({
        where: { id },
        data: { name, subject, htmlContent }
    });

    return NextResponse.json(updated);
  } catch (error) {
      return new NextResponse("Error updating template", { status: 500 });
  }
}

export async function DELETE(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) return new NextResponse("Missing ID", { status: 400 });

    try {
        const template = await prisma.template.findUnique({ where: { id } });
        if (!template || template.ownerId !== session.user.id) {
            return new NextResponse("Not Found", { status: 404 });
        }

        await prisma.template.delete({ where: { id } });
        return NextResponse.json({ success: true });
    } catch (error) {
        return new NextResponse("Error deleting template", { status: 500 });
    }
}
