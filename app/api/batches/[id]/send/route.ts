import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { decrypt } from "@/lib/crypto";
import nodemailer from "nodemailer";

export const dynamic = 'force-dynamic';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 });

  const { id: batchId } = await params;
  
  // 1. Fetch Batch with Sender and Template
  const batch = await prisma.batch.findUnique({
    where: { id: batchId },
    include: { sender: true, template: true }
  });

  if (!batch || batch.ownerId !== session.user.id) {
    return new NextResponse("Not Found", { status: 404 });
  }

  // 2. Fetch Pending Recipients (Chunk size 5)
  const recipients = await prisma.batchRecipient.findMany({
    where: { batchId, status: 'PENDING' },
    take: 5
  });

  if (recipients.length === 0) {
    await prisma.batch.update({ where: { id: batchId }, data: { status: 'COMPLETED' } });
    return NextResponse.json({ processed: 0, remaining: 0 });
  }

  // 3. Setup Transporter
  const appPassword = decrypt(batch.sender.encryptedAppPassword, batch.sender.iv);
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: batch.sender.email,
      pass: appPassword,
    },
  });

  let successCount = 0;
  let failureCount = 0;

  // 4. Send Emails
  await Promise.all(recipients.map(async (recipient: any) => {
    try {
      // Interpolate Variables
      const variables = (recipient.variables as any) || {};
      let html = batch.template.htmlContent;
      let subject = batch.template.subject;

      // Replace {{var}} logic
      Object.keys(variables).forEach(key => {
         const regex = new RegExp(`{{${key}}}`, 'g');
         html = html.replace(regex, variables[key]);
         subject = subject.replace(regex, variables[key]);
      });

      // Send
      await transporter.sendMail({
        from: `"${batch.sender.label || batch.sender.email}" <${batch.sender.email}>`,
        to: recipient.email,
        subject: subject,
        html: html,
      });

      // Update Recipient Status
      await prisma.batchRecipient.update({
        where: { id: recipient.id },
        data: { status: 'SENT', sentAt: new Date() }
      });
      successCount++;
    } catch (error: any) {
      console.error(`Failed to send to ${recipient.email}:`, error);
      await prisma.batchRecipient.update({
        where: { id: recipient.id },
        data: { status: 'FAILED', errorDetails: error.message }
      });
      failureCount++;
    }
  }));

  // 5. Update Batch Stats
  await prisma.batch.update({
    where: { id: batchId },
    data: {
      successCount: { increment: successCount },
      failureCount: { increment: failureCount },
      status: 'PROCESSING'
    }
  });

  const remaining = await prisma.batchRecipient.count({ where: { batchId, status: 'PENDING' } });

  return NextResponse.json({ processed: recipients.length, success: successCount, failed: failureCount, remaining });
}
