
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Add Recipient(s)
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 });

  const { id: batchId } = await params;
  const { recipients } = await req.json(); // Expects array of { email: string, ...vars }

  // Verify ownership
  const batch = await prisma.batch.findUnique({ where: { id: batchId } });
  if (!batch || batch.ownerId !== session.user.id) {
    return new NextResponse("Not Found", { status: 404 });
  }

  try {
     // Transaction to add recipients and update batch counts
     await prisma.$transaction(async (tx) => {
        // Create recipients
        await tx.batchRecipient.createMany({
            data: recipients.map((r: any) => ({
                batchId,
                email: r.email,
                status: 'PENDING',
                variables: r, // Store all extra fields as JSON variables
            }))
        });

        // Update Batch total
        await tx.batch.update({
            where: { id: batchId },
            data: { 
                totalRecipients: { increment: recipients.length },
                // If batch was completed, reset it so it can be picked up? 
                // Actually the stream logic pulls 'PENDING', so just setting status back to 'PENDING' or 'PROCESSING' 
                // if it was 'COMPLETED' might be good UX, or we leave it and user hits "Engage" again.
                // Let's reset to DRAFT or similar if needed, but 'ENGAGE_TRANSMITTER' button logic 
                // is based on !COMPLETED. So we should probably set it to 'PENDING' if it was COMPLETED.
                status: batch.status === 'COMPLETED' ? 'PENDING' : undefined
            }
        });
     });

     return NextResponse.json({ success: true });
  } catch (err: any) {
      console.error(err);
      return new NextResponse(err.message, { status: 500 });
  }
}

// Update Recipient
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 });
  
    const { id: batchId } = await params;
    const { recipientId, email } = await req.json();
  
    // Verify ownership
    const batch = await prisma.batch.findUnique({ where: { id: batchId } });
    if (!batch || batch.ownerId !== session.user.id) {
      return new NextResponse("Not Found", { status: 404 });
    }

    try {
        const recipient = await prisma.batchRecipient.findUnique({ where: { id: recipientId } });
        if (!recipient || recipient.batchId !== batchId) {
            return new NextResponse("Recipient Not Found", { status: 404 });
        }

        if (recipient.status === 'SENT') {
            return new NextResponse("Cannot edit sent recipient", { status: 400 });
        }

        // Update logic
        const updateData: any = { email };
        // If it was FAILED, reset to PENDING so it gets retried
        if (recipient.status === 'FAILED') {
            updateData.status = 'PENDING';
            updateData.errorDetails = null;
        }

        await prisma.$transaction(async (tx) => {
            await tx.batchRecipient.update({
                where: { id: recipientId },
                data: updateData
            });

            // If we reset a failure, we need to decrement failureCount
            if (recipient.status === 'FAILED') {
                await tx.batch.update({
                    where: { id: batchId },
                    data: { 
                        failureCount: { decrement: 1 },
                         // Reset batch status if it was completed so we can restart
                        status: batch.status === 'COMPLETED' ? 'PENDING' : undefined
                    }
                });
            }
        });

        return NextResponse.json({ success: true });
    } catch (err: any) {
        return new NextResponse(err.message, { status: 500 });
    }
}
