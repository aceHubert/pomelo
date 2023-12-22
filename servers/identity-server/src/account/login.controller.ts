import ejs from 'ejs';
import { get, pickBy, omit } from 'lodash';
import { Request, Response } from 'express';
import { Provider } from 'oidc-provider';
import { Controller, Get, Post, Body, Logger, Req, Res, HttpStatus } from '@nestjs/common';
import { I18n, I18nContext } from 'nestjs-i18n';
import { IdentityResourceDataSource } from '@ace-pomelo/identity-datasource';
import { UserDataSource } from '@ace-pomelo/infrastructure-datasource';
import { Oidc, InteractionHelper } from 'nest-oidc-provider';
import { BaseController } from '@/common/controllers/base.controller';
import { renderPrimaryStyle } from '@/common/utils/render-primary-style-tag.util';
import { getLoginTemplate } from '@/templates';
import { LoginDto } from './dto/login.dto';

@Controller('/login')
export class LoginController extends BaseController {
  private readonly logger = new Logger(LoginController.name);

  constructor(
    private readonly provider: Provider,
    private readonly identityResourceDataSource: IdentityResourceDataSource,
    private readonly userDataSource: UserDataSource,
  ) {
    super();
  }

  @Get(':uid')
  async login(
    @Oidc.Interaction() interaction: InteractionHelper,
    @Req() req: Request,
    @Res() res: Response,
    @I18n() i18n: I18nContext,
  ) {
    const { prompt, params, uid } = await interaction.details();

    const client = await this.provider.Client.find(params.client_id as string);
    const extraProperties = client?.metadata().extra_properties ?? {};

    const primaryColor = get(extraProperties, 'primaryColor');
    const clientMetadata = {
      ...client,
      ...pickBy(extraProperties, (value, key) => key.startsWith(`${prompt.name}Page.`)), // loginPage.xxx or consentPage.xxx
    };

    let wrapper, form;
    if (prompt.name === 'login') {
      const customWrapperTemplate = clientMetadata['loginPage.template'] as string;
      const formLableDisplay = ['1', 'true'].includes((clientMetadata['loginPage.formLableDisplay'] as string) ?? '1');
      const formValidateTooltip = ['1', 'true'].includes(
        (clientMetadata['loginPage.formValidateTooltip'] as string) ?? '0',
      );

      wrapper = customWrapperTemplate
        ? getLoginTemplate(customWrapperTemplate)
        : `<div class="wrapper-placeholder">
        <div class="wrapper">
          <%- locales %>
          <h1 class="title">${i18n.tv('login.wrapper.title', 'Sign In')}</h1>
          <p class="text--secondary">
          ${i18n.tv('login.wrapper.subtitle', `to <strong>${new URL(params.redirect_uri as string).host}</strong>`, {
            args: {
              host: new URL(params.redirect_uri as string).host,
            },
          })}</p>
          <%- form %>
          <div class="row mb-3">
            <div class="col-sm-10 offset-sm-2">
              <div id="error" class="alert alert-danger d-none"></div>
              <div class="d-sm-inline-block gap-2">
                <button type="submit" class="btn btn-primary w-100" form="login-form">
                  ${i18n.tv('login.wrapper.submit_btn_text', 'Sign In')}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>`;

      form = `<form id="login-form" action="/login/${uid}" method="POST" autocomplete="off" novalidate>
        <div class="row mb-3">
        ${
          formLableDisplay
            ? `<label for="username" class="col-sm-2 col-form-label">
                ${i18n.tv('login.form.username_label', 'Username')}
              </label>`
            : ''
        }
          <div class="${formLableDisplay ? 'col-sm-10' : ''}">
            <input
              type="text"
              class="form-control"
              id="username"
              name="username"
              placeholder="${i18n.tv('login.form.username_placeholder', 'User Name')}"
              ${!params.login_hint ? `autofocus="on"` : `value="${params.login_hint}"`}
              required
              maxlength="50"
            />
            <div class="invalid-${formValidateTooltip ? 'tooltip' : 'feedback'}">
              ${i18n.tv('login.form.username_invalid', 'Please input username!')}
            </div>
          </div>
        </div>
        <div class="row mb-3">
         ${
           formLableDisplay
             ? `<label for="password" class="col-sm-2 col-form-label">
                ${i18n.tv('login.form.password_label', 'Password')}
              </label>`
             : ''
         }
          <div class="${formLableDisplay ? 'col-sm-10' : ''}">
            <input
              type="password"
              class="form-control"
              id="password"
              name="password"
              placeholder="${i18n.tv('login.form.password_placeholder', 'Password')}"
              autocomplete="off"
              ${params.login_hint ? `autofocus="on"` : ''}
              required
              minlength="6"
              maxlength="16"
              value=""
            />
            <span toggle="#password" class="icon-field eye toggle-password"></span>
            <div class="invalid-${formValidateTooltip ? 'tooltip' : 'feedback'}">
              ${i18n.tv('login.form.password_invalid', 'Please input password(6-16 characters)!')}
            </div>
          </div>
        </div>
        <div class="row mb-3">
          <div class="d-flex ${formLableDisplay ? 'col-sm-10 offset-sm-2' : ''}">
            <div class="form-check">
              <input class="form-check-input" type="checkbox" value="" id="rememberMe" />
              <label class="form-check-label" for="rememberMe">
                ${i18n.tv('login.form.remember_me_label', 'Remember Me?')}
              </label>
            </div>
            <span class="ml-auto"><a href="#" class="forgot-pass">
            ${i18n.tv('login.form.forgot_password_label', 'Forgot Password')}
            </a></span>
          </div>
        </div>
        <div class="row mb-3">
        <div id="error"></div>
        </div>
      </form>`;
    } else {
      const missingScopes = new Set(prompt.details.missingOIDCScope as string[]);
      const resourceMap = new Map<string, string>();
      await this.identityResourceDataSource.getList(['name', 'displayName', 'description']).then((result) => {
        result.forEach(({ name, displayName, description }) => {
          resourceMap.set(name, description || displayName || name);
        });
      });

      if (!resourceMap.has('openid')) {
        resourceMap.set('openid', 'Your account identifier');
      }

      if (!resourceMap.has('offline_access')) {
        resourceMap.set('offline_access', 'Keep connected to your account');
      }

      const customWrapperTemplate = get(extraProperties, 'consentPage.template');

      wrapper =
        customWrapperTemplate ||
        `<div class="wrapper-placeholder">
          <div class="wrapper">
            <%- locales %>
            <div class="mb-2 pb-2 border-bottom">
              <h1 class="title">Confirm</h1>
              <p class="text--secondary mb-0">to sign in to <strong><%= new URL(params.redirect_uri).host %></strong></p>
            </div>
            <p><strong><%= clientMetadata.clientName %></strong> want to access your account.</p>
            <%- form %>
            <div class="text-end mt-4">
              <a href="/login/${uid}/abort" class="btn btn-light">Cancel</a>
              <button type="submit" class="btn btn-primary" form="consent-form">Continue</button>
            </div>
          </div>
        </div>`;

      form = `<form id="consent-form" action="/login/${uid}/confirm" method="POST" autocomplete="off">
      ${
        missingScopes.size > 0
          ? `<p><strong>Requested access:</strong></p>
              <ul>
              ${[...missingScopes]
                .map((scope: string) => `<li>${resourceMap.has(scope) ? resourceMap.get(scope) : scope}</li>`)
                .join(' ')}
              </ul>`
          : ''
      }
      </form>`;
    }
    res.render(prompt.name, {
      primaryStyleVars: primaryColor ? renderPrimaryStyle(primaryColor) : '',
      content: ejs.render(wrapper, {
        form,
        locales: this.getLocaleBtns(req, i18n.service.resolveLanguage(i18n.lang)),
        tv: i18n.tv.bind(i18n),
        details: prompt.details,
        clientMetadata: omit(
          clientMetadata,
          'loginPage.template',
          'loginPage.formLableDisplay',
          'loginPage.formValidateTooltip',
        ),
        params,
        uid,
      }),
    });
  }

  @Post(':uid')
  async loginCheck(
    @Oidc.Interaction() interaction: InteractionHelper,
    @Body() input: LoginDto,
    @I18n() i18n: I18nContext,
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

    // sync locale to user
    this.userDataSource.updateMetaByKey(verifiedUser.id, 'locale', i18n.lang);

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
