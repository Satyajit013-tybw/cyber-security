import { Schema, Document, model, models } from 'mongoose';

export interface IAuditLog extends Document {
    actor: string;
    actorEmail: string;
    action: string;
    target?: string;
    metadata?: Record<string, unknown>;
    orgId: string;
    ipAddress?: string;
    createdAt: Date;
}

const AuditLogSchema = new Schema<IAuditLog>(
    {
        actor: { type: String, required: true },
        actorEmail: { type: String, required: true },
        action: { type: String, required: true },
        target: { type: String },
        metadata: { type: Schema.Types.Mixed },
        orgId: { type: String, required: true },
        ipAddress: { type: String },
    },
    { timestamps: true }
);

export const AuditLog = models.AuditLog || model<IAuditLog>('AuditLog', AuditLogSchema);
