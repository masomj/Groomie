interface PasswordResetEmailInput {
  recipientEmail: string
  recipientName: string
  resetUrl: string
}

export async function sendPasswordResetEmail(input: PasswordResetEmailInput) {
  const config = useRuntimeConfig()
  const emailConfigured = !!(config.smtpHost && config.smtpUser && config.smtpPass)

  if (!emailConfigured) {
    console.log(`[PasswordReset] ${input.recipientEmail} -> ${input.resetUrl}`)
    return
  }

  const nodemailer = await import('nodemailer').catch(() => null)
  if (!nodemailer) {
    console.log(`[PasswordReset] nodemailer not installed. ${input.recipientEmail} -> ${input.resetUrl}`)
    return
  }

  const transporter = nodemailer.createTransport({
    host: config.smtpHost,
    port: parseInt(config.smtpPort || '587', 10),
    secure: parseInt(config.smtpPort || '587', 10) === 465,
    auth: {
      user: config.smtpUser,
      pass: config.smtpPass,
    },
  })

  await transporter.sendMail({
    from: config.smtpFrom || config.smtpUser,
    to: input.recipientEmail,
    subject: 'Reset your password',
    text: [
      `Hi ${input.recipientName},`,
      '',
      'We received a request to reset your password.',
      'Use the link below to set a new password:',
      input.resetUrl,
      '',
      'This link expires in 30 minutes and can only be used once.',
      'If you did not request this, you can ignore this email.',
    ].join('\n'),
  })
}
