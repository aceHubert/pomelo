import { Injectable, ExecutionContext } from '@nestjs/common';
import { isString, isUndefined } from '@nestjs/common/utils/shared.utils';
import { I18nResolver, I18nResolverOptions } from 'nestjs-i18n';
import {
  ServerTCP,
  CustomTransportStrategy,
  TcpSocket,
  TcpContext,
  IncomingRequest,
  WritePacket,
  PacketId,
} from '@nestjs/microservices';
import { NO_MESSAGE_HANDLER } from '@nestjs/microservices/constants';
import { getContextObject } from '@ace-pomelo/shared/server';

export interface PacketLocale {
  lang?: string;
  [x: string]: any;
}

export class I18nTcpContext extends TcpContext {
  private readonly request: IncomingRequest & PacketLocale;
  constructor(args: [TcpSocket, string, IncomingRequest & PacketLocale]) {
    super(args.slice(0, 2) as [TcpSocket, string]);
    this.request = args[2];
  }

  getRequest(): IncomingRequest & PacketLocale {
    return this.request;
  }
}

export class I18nServerTcp extends ServerTCP implements CustomTransportStrategy {
  public async handleMessage(socket: TcpSocket, rawMessage: unknown) {
    const packet = await this.deserializer.deserialize(rawMessage);
    const pattern = !isString(packet.pattern) ? JSON.stringify(packet.pattern) : packet.pattern;

    const tcpContext = new I18nTcpContext([socket, pattern, packet as IncomingRequest]);
    if (isUndefined((packet as IncomingRequest).id)) {
      return this.handleEvent(pattern, packet, tcpContext);
    }
    const handler = this.getHandlerByPattern(pattern);
    if (!handler) {
      const status = 'error';
      const noHandlerPacket = this.serializer.serialize({
        id: (packet as IncomingRequest).id,
        status,
        err: NO_MESSAGE_HANDLER,
      });
      return socket.sendMessage(noHandlerPacket);
    }
    const response$ = this.transformToObservable(await handler(packet.data, tcpContext));

    response$ &&
      this.send(response$, (data) => {
        Object.assign(data, { id: (packet as IncomingRequest).id });
        const outgoingResponse = this.serializer.serialize(data as WritePacket & PacketId);
        socket.sendMessage(outgoingResponse);
      });
  }
}

@Injectable()
export class I18nTcpResolver implements I18nResolver {
  constructor(
    @I18nResolverOptions()
    private keys: string[] = ['lang'],
  ) {}

  async resolve(context: ExecutionContext): Promise<string | string[] | undefined> {
    let lang: string | undefined;

    const ctx = getContextObject(context);
    if (ctx instanceof I18nTcpContext) {
      const req = ctx.getRequest();
      for (const key of this.keys) {
        const value = req[key];
        if (!!value) {
          lang = value as string;
          break;
        }
      }
    }

    return lang;
  }
}
