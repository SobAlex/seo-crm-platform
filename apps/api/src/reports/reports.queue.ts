import { Injectable } from '@nestjs/common';
import { MailService } from '../mail/mail.service';

export interface ReportDelivery {
  email: string;
  url: string;
  title: string;
  companyName: string;
}

/** Фоновая доставка ссылки. Без Redis задача уходит в процесс API и при отказе SMTP пишет [ReportsQueueDev]. */
@Injectable()
export class ReportsQueue {
  constructor(private readonly mail: MailService) {}

  enqueue(job: ReportDelivery): void {
    setImmediate(() => {
      void this.deliver(job);
    });
  }

  private async deliver(job: ReportDelivery): Promise<void> {
    const sent = await this.mail.sendReportLink(job.email, job.url, job.title, job.companyName);
    if (!sent) {
      console.log(`[ReportsQueueDev] Отчёт отправлен на email: ${job.url}`);
    }
  }
}
