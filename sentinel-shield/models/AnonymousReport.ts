import { Schema, Document, model, models } from 'mongoose';

export interface IAnonymousReport extends Document {
    reportId: string;
    category: 'fake_profile' | 'harmful_content' | 'scam' | 'bullying' | 'misinformation' | 'hate_speech' | 'phishing' | 'other';
    description: string;
    evidenceUrl?: string;
    urgency: 'low' | 'medium' | 'high' | 'critical';
    status: 'pending' | 'reviewed' | 'action_taken' | 'dismissed';
    orgId: string;
    // NO userId, NO email, NO IP — fully anonymous
    createdAt: Date;
}

const AnonymousReportSchema = new Schema<IAnonymousReport>(
    {
        reportId: { type: String, required: true, unique: true },
        category: {
            type: String,
            enum: ['fake_profile', 'harmful_content', 'scam', 'bullying', 'misinformation', 'hate_speech', 'phishing', 'other'],
            required: true,
        },
        description: { type: String, required: true, maxlength: 2000 },
        evidenceUrl: { type: String },
        urgency: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium' },
        status: { type: String, enum: ['pending', 'reviewed', 'action_taken', 'dismissed'], default: 'pending' },
        orgId: { type: String, required: true },
    },
    { timestamps: true }
);

export const AnonymousReport = models.AnonymousReport || model<IAnonymousReport>('AnonymousReport', AnonymousReportSchema);
