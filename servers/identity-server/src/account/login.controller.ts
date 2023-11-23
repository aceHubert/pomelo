import { Response } from 'express';
import { Provider } from 'oidc-provider';
import { Controller, Get, Post, Body, Logger, Res, HttpStatus } from '@nestjs/common';
import { UserDataSource } from '@ace-pomelo/datasource';
import { BaseController } from '@ace-pomelo/shared-server';
import { Oidc, InteractionHelper } from 'nest-oidc-provider';
import { LoginDto } from './dto/login.dto';

@Controller('/login')
export class LoginController extends BaseController {
  private readonly logger = new Logger(LoginController.name);

  constructor(private readonly provider: Provider, private readonly userDataSource: UserDataSource) {
    super();
  }

  @Get(':uid')
  async login(@Oidc.Interaction() interaction: InteractionHelper, @Res() res: Response) {
    const { prompt, params, uid } = await interaction.details();

    const client = await this.provider.Client.find(params.client_id as string);

    res.render(prompt.name, {
      details: prompt.details,
      clientId: client?.clientId,
      clientName: client?.clientName,
      params,
      uid,
    });
  }

  @Post(':uid')
  async loginCheck(
    @Oidc.Interaction() interaction: InteractionHelper,
    @Body()
    input: LoginDto,
  ) {
    const { prompt, params, uid } = await interaction.details();

    if (prompt.name !== 'login') {
      return this.faild('invalid prompt name', HttpStatus.BAD_REQUEST);
    }

    const verifiedUser = await this.userDataSource.verifyUser(input.username, input.password);
    if (!verifiedUser) {
      return this.faild('username or password incorrect!', HttpStatus.BAD_REQUEST);
    }

    this.logger.debug(`Login UID: ${uid}`);
    this.logger.debug(`Login user: ${input.username}`);
    this.logger.debug(`Client ID: ${params.client_id}`);

    const redirectUrl = await interaction.result(
      {
        login: {
          accountId: String(verifiedUser.id),
          remember: input.remember,
        },
      },
      { mergeWithLastSubmission: false },
    );

    return this.success({
      status: HttpStatus.PERMANENT_REDIRECT,
      location: redirectUrl,
    });
  }

  @Post(':uid/confirm')
  async confirmLogin(@Oidc.Interaction() interaction: InteractionHelper) {
    const interactionDetails = await interaction.details();
    const { prompt, params, session } = interactionDetails;
    let { grantId } = interactionDetails;
    let grant = grantId ? await this.provider.Grant.find(grantId) : null;

    if (!grant) {
      grant = new this.provider.Grant({
        accountId: session?.accountId,
        clientId: params.client_id as string,
      });
    }

    if (prompt.details.missingOIDCScope) {
      const scopes = prompt.details.missingOIDCScope as string[];
      grant.addOIDCScope(scopes.join(' '));
    }

    if (prompt.details.missingOIDCClaims) {
      grant.addOIDCClaims(prompt.details.missingOIDCClaims as string[]);
    }

    if (prompt.details.missingResourceScopes) {
      for (const [indicator, scopes] of Object.entries(prompt.details.missingResourceScopes)) {
        grant.addResourceScope(indicator, scopes.join(' '));
      }
    }

    grantId = await grant.save();

    await interaction.finished(
      {
        consent: {
          grantId,
        },
      },
      { mergeWithLastSubmission: true },
    );
  }

  @Get(':uid/abort')
  async abortLogin(@Oidc.Interaction() interaction: InteractionHelper) {
    const result = {
      error: 'access_denied',
      error_description: 'End-user aborted interaction',
    };

    await interaction.finished(result, { mergeWithLastSubmission: false });
  }
}
