import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { decrypt } from "@/lib/crypto";
import nodemailer from "nodemailer";
import { checkBounces } from "@/lib/bounces";

export const dynamic = 'force-dynamic';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 });

  const { id: batchId } = await params;

  // Verify ownership
  const batch = await prisma.batch.findUnique({
    where: { id: batchId },
    include: { sender: true, template: true }
  });

  if (!batch || batch.ownerId !== session.user.id) {
    return new NextResponse("Not Found", { status: 404 });
  }

  const encoder = new TextEncoder();
  
  // Create a ReadableStream for SSE
  const stream = new ReadableStream({
    async start(controller) {
      const sendEvent = (type: string, data: any) => {
        controller.enqueue(encoder.encode(`event: ${type}\ndata: ${JSON.stringify(data)}\n\n`));
      };

      try {
        // Fetch Recipients
        const recipients = await prisma.batchRecipient.findMany({
            where: { 
                batchId, 
                status: { in: ['PENDING', 'FAILED'] } 
            }
        });

        if (recipients.length === 0) {
            sendEvent('complete', { message: 'No pending recipients' });
            controller.close();
            return;
        }

        // Setup Transporter
        let transporter;
        try {
            const appPassword = decrypt(batch.sender.encryptedAppPassword, batch.sender.iv);
            transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: batch.sender.email,
                    pass: appPassword,
                },
            });
            // Verify connection
            await transporter.verify();
        } catch (err: any) {
            sendEvent('error', { message: 'SMTP Connection Failed: ' + err.message });
            controller.close();
            return;
        }

        sendEvent('start', { total: recipients.length });

        for (const recipient of recipients) {
            try {
                // Interpolate Variables
                const variables = (recipient.variables as any) || {};
                let html = batch.template.htmlContent;
                let subject = batch.template.subject;

                Object.keys(variables).forEach(key => {
                    const regex = new RegExp(`{{${key}}}`, 'g');
                    html = html.replace(regex, variables[key] || '');
                    subject = subject.replace(regex, variables[key] || '');
                });

                // Send
                const info = await transporter.sendMail({
                    from: `"${batch.sender.label || batch.sender.email}" <${batch.sender.email}>`,
                    to: recipient.email,
                    subject: subject,
                    html: html,
                });

                if (info.rejected.length > 0) {
                     throw new Error(`SMTP Rejected: ${info.response || 'Unknown error'}`);
                }

                // Update DB (SUCCESS)
                await prisma.batchRecipient.update({
                    where: { id: recipient.id },
                    data: { 
                        status: 'SENT', 
                        sentAt: new Date(),
                        messageId: info.messageId // Save Message-ID for bounce matching
                    }
                });

                await prisma.batch.update({
                    where: { id: batchId },
                    data: { successCount: { increment: 1 } }
                });

                sendEvent('progress', { 
                    recipientId: recipient.id, 
                    email: recipient.email, 
                    status: 'SENT' 
                });

            } catch (err: any) {
                // Capture detailed Nodemailer error info
                const errorInfo = [
                    err.code ? `[${err.code}]` : '',
                    err.message,
                    err.response ? `Response: ${err.response}` : '',
                    err.command ? `Command: ${err.command}` : ''
                ].filter(Boolean).join(' | ');

                // Update DB Error
                await prisma.batchRecipient.update({
                    where: { id: recipient.id },
                    data: { status: 'FAILED', errorDetails: errorInfo || err.message }
                });
                
                await prisma.batch.update({
                    where: { id: batchId },
                    data: { failureCount: { increment: 1 } }
                });

                sendEvent('progress', { 
                    recipientId: recipient.id, 
                    email: recipient.email, 
                    status: 'FAILED',
                    error: err.message
                });
            }
        }

        await prisma.batch.update({ where: { id: batchId }, data: { status: 'COMPLETED' } });
        
        // Auto-Check Bounces after completion
        sendEvent('progress', { status: 'SCANNING_BOUNCES' });
        try {
            const bounceResult = await checkBounces(batch.senderId);
            if (bounceResult.bouncedCount > 0) {
                 sendEvent('bounce_summary', bounceResult);
            }
        } catch (e) {
            console.error("Auto-Bounce Check Failed", e);
        }

        sendEvent('complete', { message: 'All processed' });
        controller.close();

      } catch (err: any) {
        console.error(err);
        sendEvent('error', { message: 'Internal Server Error' });
        controller.close();
      }
    }
  });

  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
