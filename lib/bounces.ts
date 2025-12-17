
import { prisma } from "@/lib/prisma";
import { decrypt } from "@/lib/crypto";
import imaps from "imap-simple";
import { simpleParser } from "mailparser";

export interface BounceResult {
    bouncedCount: number;
    updates: { recipientId: string; status: string; error: string }[];
    error?: string;
}

export async function checkBounces(senderId: string): Promise<BounceResult> {
    const sender = await prisma.sender.findUnique({ where: { id: senderId } });
    if (!sender) {
        throw new Error("Sender not found");
    }

    let connection;
    let bouncedCount = 0;
    const updates: { recipientId: string; status: string; error: string }[] = [];

    try {
        const appPassword = decrypt(sender.encryptedAppPassword, sender.iv);
        
        const config = {
            imap: {
                user: sender.email,
                password: appPassword,
                host: 'imap.gmail.com',
                port: 993,
                tls: true,
                tlsOptions: { rejectUnauthorized: false },
                authTimeout: 3000
            }
        };

        connection = await imaps.connect(config);
        await connection.openBox('INBOX');

        const delay = 24 * 60 * 60 * 1000; // 24 hours
        const yesterday = new Date();
        yesterday.setTime(yesterday.getTime() - delay);

        const searchCriteria = [
            ['SINCE', yesterday.toISOString()],
            ['FROM', 'mailer-daemon']
        ];
        
        // Fetch headers first to filter? Or bodies directly.
        // For processing, we need bodies.
        const rawMessages = await connection.search(searchCriteria, { bodies: [''] });
        console.log(`[BounceCheck] Found ${rawMessages.length} messages from mailer-daemon since ${yesterday.toISOString()}`);

        for (const item of rawMessages) {
             if (!item.parts || !item.parts[0]) continue;
             const raw = item.parts[0].body;
             const parsed = await simpleParser(raw);
             
             console.log(`[BounceCheck] Email Subject: ${parsed.subject}`);
             
             let originalMessageId = null;

             // Check References
             if (parsed.references && Array.isArray(parsed.references)) {
                 originalMessageId = parsed.references[0];
             } else if (typeof parsed.references === 'string') {
                 originalMessageId = parsed.references;
             }
             
             // Check In-Reply-To
             if (!originalMessageId && parsed.inReplyTo) {
                 originalMessageId = parsed.inReplyTo;
             }
             
             console.log(`[BounceCheck] Extracted Ref/ID: ${originalMessageId}`);

             if (originalMessageId) {
                 originalMessageId = originalMessageId.replace(/^<|>$/g, '');
                 console.log(`[BounceCheck] Cleaned ID: ${originalMessageId}`);

                 // Find recipient by Message-ID
                 const recipient = await prisma.batchRecipient.findFirst({
                     where: { messageId: originalMessageId }
                 });

                 if (recipient) {
                     console.log(`[BounceCheck] MATCH FOUND: ${recipient.email} (${recipient.status})`);
                     if (recipient.status !== 'FAILED') {
                         const errorDetails = `Bounce Detected: ${parsed.subject}`;
                         
                         await prisma.batchRecipient.update({
                             where: { id: recipient.id },
                             data: { 
                                 status: 'FAILED', 
                                 errorDetails 
                             }
                         });
                         
                         // Update batch stats
                         await prisma.batch.update({
                             where: { id: recipient.batchId },
                             data: { 
                                successCount: { decrement: 1 },
                                failureCount: { increment: 1 } 
                             }
                         });
                         bouncedCount++;
                         updates.push({
                             recipientId: recipient.id,
                             status: 'FAILED',
                             error: errorDetails
                         });
                     } else {
                         console.log(`[BounceCheck] Already marked FAILED.`);
                     }
                 } else {
                     console.log(`[BounceCheck] No DB record found for ID: ${originalMessageId}`);
                 }
             } else {
                 console.log(`[BounceCheck] No Message-ID found in bounce headers.`);
             }
        }

        return { bouncedCount, updates };
        
    } catch (error: any) {
        console.error("IMAP Error:", error);
        return { bouncedCount, updates, error: error.message };
    } finally {
        if (connection) {
            connection.end();
        }
    }
}
