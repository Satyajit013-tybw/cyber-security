require('dotenv').config({ path: '.env.local' });
const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = require('@google/generative-ai');
const fs = require('fs');
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

async function run() {
    try {
        const model = genAI.getGenerativeModel({
            model: 'gemini-2.0-flash',
            generationConfig: { temperature: 0.1 },
            safetySettings: [
                { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
                { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
                { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
                { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE }
            ]
        });
        const prompt = `You are an advanced fact-checking AI for "Sentinel Shield". Your job is to analyze a claim or viral message and determine its truthfulness.

INPUT TO FACT-CHECK:
"USA: Act of aggression against Venezuela further weakens rules-based international order and leaves Venezuelans still waiting for justice"

ANALYSIS INSTRUCTIONS:
1. Evaluate the claim or content against your knowledge of verified facts, known misinformation patterns, and reliable news sources.
2. Consider the source credibility, language used, and whether the claim has been debunked by fact-checkers.
3. For URLs, evaluate the domain's reputation and the content's factual accuracy.
4. Be fair and unbiased — do not flag legitimate opinions as misinformation. If the content is clearly an opinion piece from an organization, classify it as "opinion".
5. If you genuinely cannot verify the claim at all, mark it as "unverified" — never guess.

RESPOND IN EXACTLY THIS JSON FORMAT (no markdown, no code fences, just raw JSON):
{
    "verdict": "<one of: verified | unverified | false | misleading | satire | opinion>",
    "confidenceScore": <number 0-100, how confident you are in this verdict>,
    "title": "<short 5-10 word title summarizing what this claim is about>",
    "summary": "<2-3 sentence explanation of your verdict in simple language>",
    "sourceAnalysis": "<1 sentence about the source/domain credibility if applicable, or 'N/A' for text claims>",
    "redFlags": [<array of specific red flag strings found, e.g. "sensationalist language", "no credible sources cited", "known satire site">],
    "trustedSources": [<array of 1-3 trusted sources or fact-checkers that have addressed this topic, or empty array if none>],
    "category": "<one of: politics | health | science | technology | finance | social_media | general>"
}`;

        const result = await model.generateContent(prompt);
        fs.writeFileSync('node_ai_log.txt', result.response.text());
    } catch (e) {
        fs.writeFileSync('node_ai_log.txt', 'ERROR: ' + e.message + '\n\n' + JSON.stringify(e, null, 2));
    }
}
run();
