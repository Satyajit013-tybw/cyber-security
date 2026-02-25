import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT ?? 587),
    secure: false,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

export async function sendVerificationEmail(email: string, token: string) {
    const url = `${process.env.NEXT_PUBLIC_APP_URL}/verify-email?token=${token}`;
    await transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to: email,
        subject: '🛡 SentinelShield – Verify Your Email',
        html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0a0f1e; color: #e2e8f0; padding: 40px; border-radius: 12px;">
        <h1 style="color: #3b82f6; margin-bottom: 8px;">SentinelShield AI</h1>
        <p style="color: #94a3b8; margin-bottom: 24px;">Enterprise Threat Intelligence Platform</p>
        <h2>Verify Your Email Address</h2>
        <p>Click the button below to verify your email. This link expires in 24 hours.</p>
        <a href="${url}" style="display: inline-block; background: #3b82f6; color: white; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; margin: 24px 0;">
          Verify Email
        </a>
        <p style="color: #94a3b8; font-size: 12px;">If you did not create an account, please ignore this email.</p>
      </div>
    `,
    });
}

export async function sendAlertEmail(email: string, alertTitle: string, severity: string, description: string) {
    await transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to: email,
        subject: `🚨 [${severity.toUpperCase()}] SentinelShield Alert: ${alertTitle}`,
        html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0a0f1e; color: #e2e8f0; padding: 40px; border-radius: 12px;">
        <h1 style="color: #ef4444;">⚠ Security Alert</h1>
        <div style="background: #1e293b; padding: 20px; border-radius: 8px; border-left: 4px solid #ef4444;">
          <h2 style="margin: 0 0 8px;">${alertTitle}</h2>
          <p style="color: #94a3b8;">${description}</p>
          <span style="background: #ef4444; color: white; padding: 4px 12px; border-radius: 4px; font-size: 12px; font-weight: bold;">${severity.toUpperCase()}</span>
        </div>
        <p style="margin-top: 24px;">Log in to your dashboard to review and take action.</p>
      </div>
    `,
    });
}

export async function sendOTPEmail(email: string, otp: string) {
    await transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to: email,
        subject: '🔐 SentinelShield – Your MFA Code',
        html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0a0f1e; color: #e2e8f0; padding: 40px; border-radius: 12px;">
        <h1 style="color: #3b82f6;">SentinelShield AI</h1>
        <h2>Your Authentication Code</h2>
        <div style="background: #1e293b; padding: 28px; border-radius: 12px; text-align: center; margin: 24px 0;">
          <span style="font-size: 36px; letter-spacing: 8px; font-weight: bold; color: #3b82f6;">${otp}</span>
        </div>
        <p>This code expires in 10 minutes. Never share it with anyone.</p>
      </div>
    `,
    });
}
