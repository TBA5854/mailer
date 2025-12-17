
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { checkBounces } from "@/lib/bounces";

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 });

    const { senderId } = await req.json();
    if (!senderId) return new NextResponse("Missing senderId", { status: 400 });

    const result = await checkBounces(senderId);

    if (result.error) {
        return new NextResponse(`IMAP Error: ${result.error}`, { status: 500 });
    }

    return NextResponse.json(result);
}
