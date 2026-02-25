/**
 * Privacy-First Anonymizer
 * Redacts PII from content before AI processing.
 * Only anonymized content is stored in database.
 */

const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const PHONE_REGEX = /(\+?\d{1,3}[\s-]?)?(\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4})/g;
const SSN_REGEX = /\b\d{3}-\d{2}-\d{4}\b/g;
const CREDIT_CARD_REGEX = /\b(?:\d{4}[\s-]?){3}\d{4}\b/g;
const IP_REGEX = /\b(?:\d{1,3}\.){3}\d{1,3}\b/g;

export interface AnonymizationResult {
    anonymizedContent: string;
    redactedFields: string[];
    wasModified: boolean;
}

export function anonymizeContent(content: string): AnonymizationResult {
    let result = content;
    const redactedFields: string[] = [];

    if (EMAIL_REGEX.test(result)) {
        result = result.replace(EMAIL_REGEX, '[EMAIL_REDACTED]');
        redactedFields.push('email');
    }
    EMAIL_REGEX.lastIndex = 0;

    if (PHONE_REGEX.test(result)) {
        result = result.replace(PHONE_REGEX, '[PHONE_REDACTED]');
        redactedFields.push('phone');
    }
    PHONE_REGEX.lastIndex = 0;

    if (SSN_REGEX.test(result)) {
        result = result.replace(SSN_REGEX, '[SSN_REDACTED]');
        redactedFields.push('ssn');
    }
    SSN_REGEX.lastIndex = 0;

    if (CREDIT_CARD_REGEX.test(result)) {
        result = result.replace(CREDIT_CARD_REGEX, '[CARD_REDACTED]');
        redactedFields.push('credit_card');
    }
    CREDIT_CARD_REGEX.lastIndex = 0;

    if (IP_REGEX.test(result)) {
        result = result.replace(IP_REGEX, '[IP_REDACTED]');
        redactedFields.push('ip_address');
    }
    IP_REGEX.lastIndex = 0;

    return {
        anonymizedContent: result,
        redactedFields,
        wasModified: redactedFields.length > 0,
    };
}
