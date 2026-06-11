import * as net from 'net';
import * as tls from 'tls';
import { Injectable } from '@nestjs/common';
import { OptionPresetKeys, REGISTER_EMAIL_CODE_SCENE, RuntimeError, UserInputError } from '@ace-pomelo/shared/server';
import { OptionService } from '@/options/option.service';
import { renderTemplate } from './user-auth.utils';

type MailScene = typeof REGISTER_EMAIL_CODE_SCENE;

type SendSceneMailOptions = {
  scene: MailScene;
  to: string;
  variables: Record<string, string | number>;
};

type RenderedMail = {
  subject: string;
  text: string;
  html?: string;
};

type SmtpConfig = {
  host: string;
  port: number;
  user: string;
  pass: string;
};

@Injectable()
export class UserMailService {
  constructor(private readonly optionService: OptionService) {}

  async send(options: SendSceneMailOptions): Promise<void> {
    switch (options.scene) {
      case REGISTER_EMAIL_CODE_SCENE:
        await this.sendRegisterEmailCode(options.to, options.variables);
        return;
    }
  }

  private async sendRegisterEmailCode(to: string, variables: Record<string, string | number>) {
    const [mailConfig, rawTemplate, siteName] = await Promise.all([
      this.optionService.getMailConfig(),
      this.optionService.getRawValue(OptionPresetKeys.AuthRegisterEmailTemplate),
      this.optionService.getRawValue(OptionPresetKeys.BlogName),
    ]);
    const template = this.parseRegisterTemplate(rawTemplate);
    const context = {
      siteName: siteName || 'Pomelo',
      ...variables,
    };

    await this.sendSmtp(mailConfig, {
      to,
      subject: renderTemplate(template.subject, context),
      text: renderTemplate(template.text, context),
      html: template.html ? renderTemplate(template.html, context) : undefined,
    });
  }

  private parseRegisterTemplate(rawTemplate: string | undefined): RenderedMail {
    try {
      const parsed = JSON.parse(rawTemplate || '{}') as Partial<RenderedMail>;
      if (!parsed.subject || !parsed.text) {
        throw new Error('missing subject or text');
      }

      return {
        subject: parsed.subject,
        text: parsed.text,
        html: parsed.html,
      };
    } catch {
      throw new UserInputError('注册邮件模板配置无效');
    }
  }

  private async sendSmtp(config: SmtpConfig, mail: RenderedMail & { to: string }) {
    const client = new SimpleSmtpClient(config);
    await client.send({
      from: config.user,
      to: mail.to,
      subject: mail.subject,
      text: mail.text,
      html: mail.html,
    });
  }
}

class SimpleSmtpClient {
  private socket!: net.Socket | tls.TLSSocket;
  private buffer = '';
  private readonly timeoutMs = 15_000;

  constructor(private readonly config: SmtpConfig) {}

  async send(mail: RenderedMail & { from: string; to: string }) {
    try {
      await this.connect();
      let capabilities = await this.ehlo();
      if (this.config.port !== 465 && capabilities.some((line) => /\bSTARTTLS\b/i.test(line))) {
        await this.command('STARTTLS', [220]);
        await this.upgradeToTls();
        capabilities = await this.ehlo();
      }
      await this.authenticate(capabilities);
      await this.command(`MAIL FROM:<${mail.from}>`, [250]);
      await this.command(`RCPT TO:<${mail.to}>`, [250, 251]);
      await this.command('DATA', [354]);
      await this.writeData(this.buildMessage(mail));
      await this.command('QUIT', [221]);
    } catch (error) {
      throw new RuntimeError(`邮件发送失败：${error instanceof Error ? error.message : String(error)}`);
    } finally {
      this.socket?.destroy();
    }
  }

  private connect() {
    return new Promise<void>((resolve, reject) => {
      const onError = (error: Error) => reject(error);
      const onConnect = async () => {
        try {
          this.socket.setTimeout(this.timeoutMs);
          this.socket.on('timeout', () => this.socket.destroy(new Error('SMTP connection timeout')));
          await this.readResponse([220]);
          resolve();
        } catch (error) {
          reject(error);
        }
      };

      this.socket =
        this.config.port === 465
          ? tls.connect(
              {
                host: this.config.host,
                port: this.config.port,
                servername: this.config.host,
              },
              onConnect,
            )
          : net.connect(
              {
                host: this.config.host,
                port: this.config.port,
              },
              onConnect,
            );
      this.socket.once('error', onError);
    });
  }

  private async upgradeToTls() {
    this.socket = tls.connect({
      socket: this.socket,
      servername: this.config.host,
    });
    await new Promise<void>((resolve, reject) => {
      this.socket.once('secureConnect', resolve);
      this.socket.once('error', reject);
    });
  }

  private async ehlo() {
    const hostname = 'pomelo.local';
    const response = await this.command(`EHLO ${hostname}`, [250]).catch(() => this.command(`HELO ${hostname}`, [250]));
    return response.lines;
  }

  private async authenticate(capabilities: string[]) {
    if (!capabilities.some((line) => /\bAUTH\b/i.test(line))) {
      return;
    }

    await this.command('AUTH LOGIN', [334]);
    await this.command(Buffer.from(this.config.user).toString('base64'), [334]);
    await this.command(Buffer.from(this.config.pass).toString('base64'), [235]);
  }

  private command(command: string, expectedCodes: number[]) {
    this.socket.write(`${command}\r\n`);
    return this.readResponse(expectedCodes);
  }

  private writeData(message: string) {
    this.socket.write(`${message}\r\n.\r\n`);
    return this.readResponse([250]);
  }

  private readResponse(expectedCodes: number[]) {
    return new Promise<{ code: number; lines: string[] }>((resolve, reject) => {
      const cleanup = () => {
        this.socket.off('data', onData);
        this.socket.off('error', onError);
      };
      const onError = (error: Error) => {
        cleanup();
        reject(error);
      };
      const onData = (chunk: Buffer) => {
        this.buffer += chunk.toString('utf-8');
        const lines = this.buffer.split(/\r?\n/).filter(Boolean);
        const lastLine = lines[lines.length - 1];
        if (!lastLine || !/^\d{3}\s/.test(lastLine)) {
          return;
        }

        this.buffer = '';
        const code = Number(lastLine.slice(0, 3));
        cleanup();
        if (!expectedCodes.includes(code)) {
          reject(new Error(lines.join(' ')));
          return;
        }
        resolve({ code, lines });
      };

      this.socket.on('data', onData);
      this.socket.once('error', onError);
    });
  }

  private buildMessage(mail: RenderedMail & { from: string; to: string }) {
    const headers = [
      `From: ${mail.from}`,
      `To: ${mail.to}`,
      `Subject: ${this.encodeHeader(mail.subject)}`,
      'MIME-Version: 1.0',
    ];

    if (!mail.html) {
      return [
        ...headers,
        'Content-Type: text/plain; charset=UTF-8',
        'Content-Transfer-Encoding: 8bit',
        '',
        this.escapeData(mail.text),
      ].join('\r\n');
    }

    const boundary = `pomelo-${Date.now()}`;
    return [
      ...headers,
      `Content-Type: multipart/alternative; boundary="${boundary}"`,
      '',
      `--${boundary}`,
      'Content-Type: text/plain; charset=UTF-8',
      'Content-Transfer-Encoding: 8bit',
      '',
      this.escapeData(mail.text),
      `--${boundary}`,
      'Content-Type: text/html; charset=UTF-8',
      'Content-Transfer-Encoding: 8bit',
      '',
      this.escapeData(mail.html),
      `--${boundary}--`,
    ].join('\r\n');
  }

  private encodeHeader(value: string) {
    return /^[\x00-\x7F]*$/.test(value) ? value : `=?UTF-8?B?${Buffer.from(value).toString('base64')}?=`;
  }

  private escapeData(value: string) {
    return value.replace(/\r?\n/g, '\r\n').replace(/^\./gm, '..');
  }
}
