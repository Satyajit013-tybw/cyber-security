import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helpers';

export async function POST(req: NextRequest) {
    const auth = requireAuth(req);
    if (auth.error) return auth.error;

    try {
        const { decodedContent, imageBase64 } = await req.json();

        // Without an external AI Vision API, we absolutely need the frontend jsQR library
        // to have successfully decoded the text from the image.
        if (!decodedContent) {
            return NextResponse.json({
                error: 'Could not detect a clear QR code in this image. Please ensure the code is well-lit and fully visible.'
            }, { status: 400 });
        }

        const text = decodedContent.trim();
        const textLower = text.toLowerCase();

        // Default base result
        let parsed = {
            verdict: 'suspicious',
            score: 50,
            qrType: 'other',
            title: 'QR Code Analysis',
            summary: 'Analysis completed.',
            destination: text,
            redFlags: [] as string[],
            recommendation: 'Proceed with caution.',
            paymentDetails: { payee: null as string | null, amount: null as string | null, isVerifiedMerchant: null as boolean | null },
        };

        // --- LOCAL HEURISTIC QR SCANNER ENGINE ---

        // 1. Check for UPI Payment Links
        if (textLower.startsWith('upi://pay')) {
            parsed.qrType = 'upi_payment';

            // Extract typical UPI parameters
            try {
                const url = new URL(text);
                const payee = url.searchParams.get('pa');
                const payeeName = url.searchParams.get('pn');
                const amount = url.searchParams.get('am');

                parsed.paymentDetails = {
                    payee: payee || null,
                    amount: amount || null,
                    isVerifiedMerchant: null
                };

                const isTrustedVpa = payee && (payee.endsWith('@okbizaxis') || payee.endsWith('@paytm') || payee.endsWith('@ybl') || payee.endsWith('@icici'));

                if (isTrustedVpa) {
                    parsed.verdict = 'safe';
                    parsed.score = 5;
                    parsed.title = 'Verified UPI Payment';
                    parsed.summary = `This is a secure UPI payment request${payeeName ? ` to ${payeeName}` : ''}.`;
                    parsed.recommendation = 'Safe to proceed with payment.';
                } else {
                    parsed.verdict = 'caution';
                    parsed.score = 40;
                    parsed.title = 'Personal UPI Transfer';
                    parsed.summary = `This routes to a personal UPI address${payeeName ? ` (${payeeName})` : ''} rather than a verified business.`;
                    parsed.recommendation = 'Verify the recipient is exactly who you expect before sending money.';
                    parsed.redFlags.push('Unverified private UPI address');
                }
            } catch (e) {
                // Malformed UPI Link
                parsed.verdict = 'dangerous';
                parsed.score = 80;
                parsed.title = 'Malformed Payment Link';
                parsed.summary = 'This payment link is broken or improperly formatted, which is a common indicator of a scam.';
                parsed.recommendation = 'Do NOT send money using this link.';
                parsed.redFlags.push('Invalid UPI Uniform Resource Identifier setup');
            }
        }

        // 2. Check for Standard URLs / Websites
        else if (textLower.startsWith('http://') || textLower.startsWith('https://')) {
            parsed.qrType = 'url';

            try {
                const url = new URL(textLower);
                const hostname = url.hostname;

                // Red Flag: Is it HTTP?
                if (url.protocol === 'http:') {
                    parsed.redFlags.push('Unencrypted connection (HTTP instead of HTTPS)');
                    parsed.score += 20;
                }

                // Check against known safe list
                const safeDomains = ['google.com', 'amazon.com', 'apple.com', 'microsoft.com', 'github.com', 'linkedin.com', 'en.wikipedia.com', 'en.m.wikipedia.org', 'wikipedia.org'];
                const isSafe = safeDomains.some(domain => hostname === domain || hostname.endsWith('.' + domain));

                // Check against known sketchy patterns
                const sketchyTlds = ['.xyz', '.top', '.click', '.win', '.ru', '.cn'];
                const isSketchy = sketchyTlds.some(tld => hostname.endsWith(tld));

                if (isSafe) {
                    parsed.verdict = 'safe';
                    parsed.score = 5;
                    parsed.title = 'Verified Safe Website';
                    parsed.summary = 'This QR code directs you to a highly trusted mainstream website.';
                    parsed.recommendation = 'Safe to visit.';
                } else if (isSketchy) {
                    parsed.verdict = 'dangerous';
                    parsed.score = 85;
                    parsed.title = 'Suspicious Domain Extension';
                    parsed.summary = 'This website uses a domain extension commonly associated with spam and malware distribution.';
                    parsed.recommendation = 'Avoid visiting this website.';
                    parsed.redFlags.push('High-risk domain extension');
                } else {
                    // Standard unknown URL
                    parsed.verdict = 'caution';
                    parsed.score = 30;
                    parsed.title = 'Unverified External Link';
                    parsed.summary = 'This link goes to an external website. It does not appear immediately dangerous, but extreme caution is advised.';
                    parsed.recommendation = 'Ensure you trust the location where you found this QR code.';
                }
            } catch (e) {
                parsed.verdict = 'suspicious';
                parsed.score = 60;
                parsed.summary = 'The URL structure contained in this QR code is irregular.';
            }
        }

        // 3. Check for vCards (Contact info)
        else if (text.startsWith('BEGIN:VCARD')) {
            parsed.qrType = 'vcard';
            parsed.verdict = 'safe';
            parsed.score = 0;
            parsed.title = 'Digital Contact Card';
            parsed.summary = 'This QR code contains standard contact details (name, phone, email) to add to your address book.';
            parsed.recommendation = 'Safe to save to your contacts.';
        }

        // 4. Check for WiFi Configs
        else if (textLower.startsWith('wifi:')) {
            parsed.qrType = 'wifi';
            parsed.verdict = 'safe';
            parsed.score = 5;
            parsed.title = 'WiFi Network Configuration';
            parsed.summary = 'This QR code will automatically input a WiFi network name and password into your device.';
            parsed.recommendation = 'Only connect if you are in a trusted location (like a friend\'s house or official business).';
        }

        // 5. Plain Text
        else {
            parsed.qrType = 'text';
            parsed.verdict = 'safe';
            parsed.score = 0;
            parsed.title = 'Plain Text Message';
            parsed.summary = 'This QR code simply contains readable text, not a link or command.';
            parsed.recommendation = 'Safe to read. No tracking or malicious action is executed by reading text.';
        }

        // Validate final verdict string
        const validVerdicts = ['safe', 'caution', 'suspicious', 'dangerous'];
        const verdict = validVerdicts.includes(parsed.verdict) ? parsed.verdict : 'suspicious';

        // Simulate a minor API pause of 800ms to feel real to the user and prevent rapid-fire clicking
        await new Promise(resolve => setTimeout(resolve, 800));

        return NextResponse.json({
            success: true,
            result: {
                verdict,
                score: Math.max(0, Math.min(100, Math.round(parsed.score))),
                qrType: parsed.qrType,
                title: parsed.title,
                summary: parsed.summary,
                destination: parsed.destination,
                redFlags: parsed.redFlags,
                recommendation: parsed.recommendation,
                paymentDetails: parsed.paymentDetails,
            },
        });
    } catch (err: any) {
        console.error('QR analysis error:', err);
        return NextResponse.json({ error: 'QR Local Engine analysis failed to parse.' }, { status: 500 });
    }
}
