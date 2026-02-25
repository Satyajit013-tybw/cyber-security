import { Schema, Document, model, models } from 'mongoose';

export interface IThreat extends Document {
    type: 'text' | 'url' | 'image' | 'file';
    originalContent?: string;
    anonymizedContent: string;
    riskScore: number;
    categories: string[];
    confidence: number;
    explanation: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    orgId: string;
    userId: string;
    ipAddress?: string;
    countryCode?: string;
    createdAt: Date;
}

const ThreatSchema = new Schema<IThreat>(
    {
        type: { type: String, enum: ['text', 'url', 'image', 'file'], required: true },
        originalContent: { type: String },
        anonymizedContent: { type: String, required: true },
        riskScore: { type: Number, required: true, min: 0, max: 100 },
        categories: [{ type: String }],
        confidence: { type: Number, required: true, min: 0, max: 100 },
        explanation: { type: String, required: true },
        severity: { type: String, enum: ['low', 'medium', 'high', 'critical'], required: true },
        orgId: { type: String, required: true },
        userId: { type: String, required: true },
        ipAddress: { type: String },
        countryCode: { type: String },
    },
    { timestamps: true }
);

export const Threat = models.Threat || model<IThreat>('Threat', ThreatSchema);
