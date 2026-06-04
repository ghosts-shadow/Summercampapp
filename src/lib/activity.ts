import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { ipFromHeaders } from "@/lib/rate-limit";

export interface LogActivityInput {
  userId?: string | null;
  action: string;
  entity: string;
  entityId?: string | null;
  message?: string | null;
  metadata?: Record<string, unknown> | null;
}

/**
 * Write an audit-trail entry. Never throws — logging failures must not break
 * the user-facing action that triggered them.
 */
export async function logActivity(input: LogActivityInput): Promise<void> {
  try {
    let ipAddress: string | undefined;
    try {
      ipAddress = ipFromHeaders(await headers());
    } catch {
      // Outside a request scope (e.g. seed scripts) — ignore.
    }

    await prisma.activityLog.create({
      data: {
        userId: input.userId ?? undefined,
        action: input.action,
        entity: input.entity,
        entityId: input.entityId ?? undefined,
        message: input.message ?? undefined,
        metadata: (input.metadata as object) ?? undefined,
        ipAddress,
      },
    });
  } catch (err) {
    console.error("[activity] failed to write log entry:", err);
  }
}
