import { Schema, Document, model, models } from 'mongoose';

export interface IAlert extends Document {
    threatId: string;
    title: string;
    description: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    status: 'open' | 'dismissed' | 'escalated' | 'resolved';
    suggestedActions: string[];
    orgId: string;
    assignedTo?: string;
    resolvedBy?: string;
    resolvedAt?: Date;
    reasonTag?: string;
    reviewedBy?: string;
    createdAt: Date;
}

const AlertSchema = new Schema<IAlert>(
    {
        threatId: { type: String, required: true },
        title: { type: String, required: true },
        description: { type: String, required: true },
        severity: { type: String, enum: ['low', 'medium', 'high', 'critical'], required: true },
        status: { type: String, enum: ['open', 'dismissed', 'escalated', 'resolved'], default: 'open' },
        suggestedActions: [{ type: String }],
        orgId: { type: String, required: true },
        assignedTo: { type: String },
        resolvedBy: { type: String },
        resolvedAt: { type: Date },
        reasonTag: { type: String },
        reviewedBy: { type: String },
    },
    { timestamps: true }
);

export const Alert = models.Alert || model<IAlert>('Alert', AlertSchema);
