import { Schema, Document, model, models } from 'mongoose';

export interface IRuleCondition {
    field: 'text' | 'url' | 'riskScore' | 'category';
    operator: 'contains' | 'matches' | 'greaterThan' | 'lessThan' | 'equals';
    value: string | number;
}

export interface IRuleAction {
    type: 'markCritical' | 'notifyAdmin' | 'blockContent' | 'escalate' | 'lockUser';
    payload?: string;
}

export interface IRule extends Document {
    name: string;
    description: string;
    conditions: IRuleCondition[];
    conditionLogic: 'AND' | 'OR';
    actions: IRuleAction[];
    orgId: string;
    isActive: boolean;
    createdBy: string;
    triggeredCount: number;
    hitRate: number;
    falsePositiveRate: number;
    lastTriggered?: Date;
    createdAt: Date;
}

const RuleSchema = new Schema<IRule>(
    {
        name: { type: String, required: true },
        description: { type: String },
        conditions: [
            {
                field: { type: String, enum: ['text', 'url', 'riskScore', 'category'], required: true },
                operator: { type: String, enum: ['contains', 'matches', 'greaterThan', 'lessThan', 'equals'], required: true },
                value: { type: Schema.Types.Mixed, required: true },
            },
        ],
        conditionLogic: { type: String, enum: ['AND', 'OR'], default: 'AND' },
        actions: [
            {
                type: { type: String, enum: ['markCritical', 'notifyAdmin', 'blockContent', 'escalate', 'lockUser'], required: true },
                payload: { type: String },
            },
        ],
        orgId: { type: String, required: true },
        isActive: { type: Boolean, default: true },
        createdBy: { type: String, required: true },
        triggeredCount: { type: Number, default: 0 },
        hitRate: { type: Number, default: 0 },
        falsePositiveRate: { type: Number, default: 0 },
        lastTriggered: { type: Date },
    },
    { timestamps: true }
);

export const Rule = models.Rule || model<IRule>('Rule', RuleSchema);
