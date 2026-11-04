import { Injectable, Logger } from '@nestjs/common';
import nodemailer from 'nodemailer';

export interface InviteMail {
  inviteUrl: string;
  inviterName: string;
  companyName: string;
  roleName: string;
  recipientName: string;
}

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  async sendInvite(to: string, data: InviteMail): Promise<void> {
    const host = process.env.SMTP_HOST?.trim();
    const user = process.env.SMTP_USER?.trim();
    if (!host || !user) {
      this.devLog(to, data.inviteUrl);
      return;
    }

    try {
      const port = Number(process.env.SMTP_PORT) || 465;
      const secure = process.env.SMTP_SECURE === 'true';
      const transporter = nodemailer.createTransport({
        host,
        port,
        secure,
        auth: { user, pass: process.env.SMTP_PASS ?? '' },
        connectionTimeout: 8000,
        greetingTimeout: 8000,
        socketTimeout: 8000,
      });
      const from = process.env.SMTP_FROM?.trim() || user;
      await transporter.sendMail({
        from,
        to,
        subject: `Приглашение в «${data.companyName}»`,
        text: this.text(data),
        html: this.html(data),
      });
      this.logger.log(`Приглашение отправлено на ${to}`);
    } catch (error) {
      const detail = error instanceof Error ? error.stack || error.message : String(error);
      this.logger.error(`Не удалось отправить приглашение на ${to}: ${detail}`);
      this.devLog(to, data.inviteUrl);
    }
  }

  private devLog(to: string, inviteUrl: string) {
    console.log(`[MailerDev] Отправка на ${to}, ссылка: ${inviteUrl}`);
  }

  private text(data: InviteMail): string {
    const hello = data.recipientName ? `Здравствуйте, ${data.recipientName}!` : 'Здравствуйте!';
    return [
      hello,
      '',
      `${data.inviterName} приглашает вас в команду «${data.companyName}».`,
      `Роль: ${data.roleName}.`,
      '',
      `Принять приглашение и войти: ${data.inviteUrl}`,
    ].join('\n');
  }

  private html(data: InviteMail): string {
    const hello = data.recipientName
      ? `Здравствуйте, ${escapeHtml(data.recipientName)}!`
      : 'Здравствуйте!';
    const url = escapeHtml(data.inviteUrl);
    return `<!DOCTYPE html>
<html lang="ru">
<body style="margin:0;padding:24px;background:#f5f5f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#1d1d1f;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
    <tr><td align="center">
      <table role="presentation" width="480" cellspacing="0" cellpadding="0" style="max-width:480px;background:#ffffff;border-radius:24px;padding:32px;">
        <tr><td>
          <p style="margin:0 0 12px;font-size:16px;">${hello}</p>
          <p style="margin:0 0 8px;font-size:15px;line-height:1.5;">${escapeHtml(data.inviterName)} приглашает вас в команду «${escapeHtml(data.companyName)}».</p>
          <p style="margin:0 0 24px;font-size:15px;line-height:1.5;">Роль: <strong>${escapeHtml(data.roleName)}</strong>.</p>
          <p style="margin:0 0 24px;">
            <a href="${url}" style="display:inline-block;background:#0071e3;color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;padding:12px 20px;border-radius:999px;">Принять приглашение и войти</a>
          </p>
          <p style="margin:0;font-size:12px;line-height:1.5;color:#6b7280;">Если кнопка не открывается, перейдите по ссылке:<br><a href="${url}" style="color:#0071e3;">${url}</a></p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
  }
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => {
    switch (char) {
      case '&':
        return '&amp;';
      case '<':
        return '&lt;';
      case '>':
        return '&gt;';
      case '"':
        return '&quot;';
      default:
        return '&#39;';
    }
  });
}
