import ejs from 'ejs';
import { get } from 'lodash';
import { Response } from 'express';
import { Provider } from 'oidc-provider';
import { Controller, Get, Post, Body, Logger, Res, HttpStatus } from '@nestjs/common';
import { UserDataSource } from '@ace-pomelo/infrastructure-datasource';
import { BaseController } from '@ace-pomelo/shared-server';
import { Oidc, InteractionHelper } from 'nest-oidc-provider';
import { getLoginTemplate } from '../templates';
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

    const customWrapperTemplate = get(client?.metadata().extra_properties, 'loginPage.template');
    const formLableDisplay = get(client?.metadata().extra_properties, 'loginPage.formLableDisplay');
    const formValidateTooltip = get(client?.metadata().extra_properties, 'loginPage.formValidateTooltip');

    const wrapper = customWrapperTemplate
      ? getLoginTemplate(customWrapperTemplate)
      : `<div class="wrapper-placeholder">
        <div class="wrapper">
          <h1 class="title">Sign In</h1>
          <p class="text--secondary">to <strong><%= new URL(params.redirect_uri).host %></strong></p>
          <%- form %>
          <div class="row mb-3">
            <div class="col-sm-10 offset-sm-2">
              <div id="error" class="alert alert-danger d-none"></div>
              <div class="d-sm-inline-block gap-2">
                <button type="submit" class="btn btn-primary w-100" form="login-form">Sign in</button>
              </div>
            </div>
          </div>
        </div>
      </div>`;

    const form = ` <form id="login-form" action="/login/${uid}" method="POST" autocomplete="off" novalidate>
        <div class="row mb-3">
        ${formLableDisplay !== false ? '<label for="username" class="col-sm-2 col-form-label">Username</label>' : ''}
          <div class="${formLableDisplay !== false ? 'col-sm-10' : ''}">
            <input
              type="text"
              class="form-control"
              id="username"
              name="username"
              placeholder="User Name"
              autofocus
              required
              maxlength="50"
            />
            <div class="invalid-${formValidateTooltip === true ? 'tooltip' : 'feedback'}">Please input username.</div>
          </div>
        </div>
        <div class="row mb-3">
         ${formLableDisplay !== false ? '<label for="password" class="col-sm-2 col-form-label">Password</label>' : ''}
          <div class="${formLableDisplay !== false ? 'col-sm-10' : ''}">
            <input
              type="password"
              class="form-control"
              id="password"
              name="password"
              placeholder="Password"
              autocomplete="off"
              required
              minlength="6"
              maxlength="16"
              value=""
            />
            <span toggle="#password" class="icon-field eye toggle-password"></span>
            <div class="invalid-${
              formValidateTooltip === true ? 'tooltip' : 'feedback'
            }">Please input password(6-16 characters).</div>
          </div>
        </div>
        <div class="row mb-3">
          <div class="d-flex ${formLableDisplay !== false ? 'col-sm-10 offset-sm-2' : ''}">
            <div class="form-check">
              <input class="form-check-input" type="checkbox" value="" id="rememberMe" />
              <label class="form-check-label" for="rememberMe"> Remember Me? </label>
            </div>
            <span class="ml-auto"><a href="#" class="forgot-pass">Forgot Password</a></span>
          </div>
        </div>
      </form>`;

    res.render(prompt.name, {
      content: ejs.render(wrapper, {
        form,
        details: prompt.details,
        clientId: client?.clientId,
        clientName: client?.clientName,
        params,
        uid,
      }),
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
