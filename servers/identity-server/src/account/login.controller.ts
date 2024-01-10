import ejs from 'ejs';
import { pickBy } from 'lodash';
import { Request, Response } from 'express';
import { ModuleRef } from '@nestjs/core';
import { Controller, Get, Post, Query, Body, Req, Res, HttpStatus } from '@nestjs/common';
import { I18n, I18nContext } from 'nestjs-i18n';
import { md5, normalizeRoutePath } from '@ace-pomelo/shared-server';
import { IdentityResourceDataSource } from '@ace-pomelo/identity-datasource';
import { UserDataSource } from '@ace-pomelo/infrastructure-datasource';
import { KoaContextWithOIDC } from 'oidc-provider';
import { OidcService } from 'nest-oidc-provider';
import { BaseController } from '@/common/controllers/base.controller';
import { renderPrimaryStyle } from '@/common/utils/render-primary-style-tag.util';
import { getLoginTemplate, getConsentTemplate } from '@/templates';
import { LoginDto } from './dto/login.dto';

@Controller('/login')
export class LoginController extends BaseController {
  // private readonly logger = new Logger(LoginController.name);

  constructor(
    private readonly moduleRef: ModuleRef,
    private readonly oidcService: OidcService,
    private readonly identityResourceDataSource: IdentityResourceDataSource,
    private readonly userDataSource: UserDataSource,
  ) {
    super();
  }

  private async ensureInteraction(req: Request, res: Response, returnUrl?: string, redirect = true) {
    try {
      return await this.oidcService.provider.interactionDetails(req, res);
    } catch {
      redirect && res.redirect(returnUrl ?? '/');
      return;
    }
  }

  @Get()
  async login(
    @Query('returnUrl') returnUrl: string | undefined,
    @Req() req: Request,
    @Res() res: Response,
    @I18n() i18n: I18nContext,
  ) {
    const interaction = await this.ensureInteraction(req, res, returnUrl);
    if (!interaction) return;

    const { prompt, params } = interaction;
    let client: KoaContextWithOIDC['oidc']['entities']['Client'],
      clientProperties: Record<string, any> = {};

    // if client_id present
    if (params.client_id) {
      client = await this.oidcService.provider.Client.find(params.client_id as string);
      clientProperties = pickBy(client?.metadata().extra_properties ?? {}, (value, key) => {
        const split = key.split('.');
        return split.length === 1 || (split.length > 1 && split[0] === `${prompt.name}Page`);
      }); // loginPage.xxx or consentPage.x;
    }

    let wrapper: string, form: string;

    const appConfig = this.moduleRef['container'].applicationConfig;
    const primaryColor = clientProperties['primaryColor'] as string;

    if (prompt.name === 'login') {
      const customWrapperTemplate = clientProperties['loginPage.template']
        ? getLoginTemplate(clientProperties['loginPage.template'])
        : clientProperties['template']
        ? getLoginTemplate(clientProperties['template'])
        : undefined;
      const formLableDisplay = ['1', 'true'].includes(
        (clientProperties['loginPage.formLableDisplay'] as string) ?? '1',
      );
      const formValidateTooltip = ['1', 'true'].includes(
        (clientProperties['loginPage.formValidateTooltip'] as string) ?? '0',
      );

      wrapper =
        customWrapperTemplate ||
        `<div class="wrapper-placeholder">
            <%- locales %>
            <div class="wrapper">
              <h1 class="title">${i18n.tv('login.wrapper.title', 'Sign In')}</h1>
              ${
                params.redirect_uri
                  ? `<p class="text--secondary">
                      ${i18n.tv(
                        'login.wrapper.subtitle',
                        `to <strong>${new URL(params.redirect_uri as string).host}</strong>`,
                        {
                          args: {
                            host: new URL(params.redirect_uri as string).host,
                          },
                        },
                      )}</p>`
                  : ''
              }
              <%- form %>
              <div class="row mb-3">
                <div class="${formLableDisplay ? 'col-sm-9 offset-sm-3' : ''}">
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

      form = `<form id="login-form" action="${req.url}" method="POST" autocomplete="off" novalidate>
        <div class="row mb-3">
        ${
          formLableDisplay
            ? `<label for="username" class="col-sm-3 col-form-label">
                ${i18n.tv('login.form.username_label', 'Username')}
              </label>`
            : ''
        }
          <div class="${formLableDisplay ? 'col-sm-9' : ''}">
            <input
              type="text"
              class="form-control"
              id="username"
              name="username"
              placeholder="${i18n.tv('login.form.username_placeholder', 'Login Name/Email/Phone')}"
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
             ? `<label for="password" class="col-sm-3 col-form-label">
                ${i18n.tv('login.form.password_label', 'Password')}
              </label>`
             : ''
         }
          <div class="${formLableDisplay ? 'col-sm-9' : ''}">
            <div style="position: relative">
              <input
                type="password"
                class="form-control password"
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
              <span toggle="#password" class="toggle-password eye"></span>
              <div class="invalid-${formValidateTooltip ? 'tooltip' : 'feedback'}">
                ${i18n.tv('login.form.password_invalid', 'Please input password(6-16 characters)!')}
              </div>
            </div>
          </div>
        </div>
        <div class="row mb-3">
          <div class="d-flex ${formLableDisplay ? 'col-sm-9 offset-sm-3' : ''}">
            <div class="form-check">
              <input class="form-check-input" type="checkbox" value="on" id="remember" name="remember" />
              <label class="form-check-label" for="remember">
                ${i18n.tv('login.form.remember_me_label', 'Remember Me?')}
              </label>
            </div>
            <span class="ml-auto"><a href="${`${normalizeRoutePath(
              appConfig?.getGlobalPrefix() ?? '',
            )}/password/forgot${
              returnUrl ? `?returnUrl=${encodeURIComponent(returnUrl)}` : ''
            }`}" class="forgot-password">
            ${i18n.tv('login.form.forgot_password_label', 'Forgot Password')}
            </a></span>
          </div>
        </div>
        ${
          client?.policyUri
            ? `<div class="row mb-3">
                <div class="${formLableDisplay ? 'col-sm-9 offset-sm-3' : ''}">
                  <div class="form-check">
                    <input class="form-check-input" type="checkbox" value="on" id="userPolicy" name="userPolicy" />
                    <label class="form-check-label" for="userPolicy">
                      ${i18n.tv('login.form.user_policy_label', 'I agree to the')}
                      <a href="${client.policyUri}" class="ml-1" target="_blank">${i18n.tv(
                'login.form.user_policy_link_text',
                'User Privacy Agreement',
              )}</a>
                    </label>
                  </div>
                </div>
              </div>`
            : ''
        }
        <div class="row mb-3">
          <div class="${formLableDisplay ? 'col-sm-9 offset-sm-3' : ''}">
            <div id="error"></div>
          </div>
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
      const customWrapperTemplate = clientProperties['consentPage.template']
        ? getConsentTemplate(clientProperties['consentPage.template'])
        : clientProperties['template']
        ? getConsentTemplate(clientProperties['template'])
        : undefined;

      wrapper =
        customWrapperTemplate ||
        `<div class="wrapper-placeholder">
          <%- locales %>
          <div class="wrapper">
            <div class="mb-2 pb-2 border-bottom">
              <h1 class="title">Confirm</h1>
              ${
                params.redirect_uri
                  ? `<p class="text--secondary">
                      ${i18n.tv(
                        'login.wrapper.subtitle',
                        `to <strong>${new URL(params.redirect_uri as string).host}</strong>`,
                        {
                          args: {
                            host: new URL(params.redirect_uri as string).host,
                          },
                        },
                      )}</p>`
                  : ''
              }
            </div>
            <p><strong>${client?.clientName}</strong> want to access your account.</p>
            <%- form %>
            <div class="text-end mt-4">
              <a href="/login/abort" class="btn btn-light">Cancel</a>
              <button type="submit" class="btn btn-primary" form="consent-form">Continue</button>
            </div>
          </div>
        </div>`;

      form = `<form id="consent-form" action="${normalizeRoutePath(appConfig?.getGlobalPrefix() ?? '')}/login/confirm${
        returnUrl ? `?returnUrl=${encodeURIComponent(returnUrl)}` : ''
      }" method="POST" autocomplete="off">
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
        clientId: client?.clientId,
        clientName: client?.clientName,
        clientProperties,
        params,
      }),
    });
  }

  @Post()
  async loginCheck(
    @Query('returnUrl') returnUrl: string | undefined,
    @Body() input: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @I18n() i18n: I18nContext,
  ) {
    const interaction = await this.ensureInteraction(req, res, returnUrl, false);
    // ajax return (refresh session)
    if (!interaction) {
      return this.success({
        next: returnUrl ?? '/',
        message: i18n.tv('login.check.session_missing', 'session not found!'),
      });
    }

    const { params } = interaction;
    let client: KoaContextWithOIDC['oidc']['entities']['Client'];

    // if client_id present
    if (params.client_id) {
      client = await this.oidcService.provider.Client.find(params.client_id as string);
    }

    if (client?.policyUri && !input.userPolicy) {
      return this.faild(i18n.tv('login.check.user_policy_invalid', 'Please read and agree to the User Policy!'));
    }

    const verifiedUser = await this.userDataSource.verifyUser(input.username, md5(input.password).toString());
    if (!verifiedUser) {
      return this.faild(
        i18n.tv('login.confirm.incorrect_username_or_password', 'username or password incorrect!'),
        HttpStatus.BAD_REQUEST,
      );
    }

    // sync locale to user
    this.userDataSource.updateMetaByKey(verifiedUser.id, 'locale', i18n.lang);

    const redirectUrl = await this.oidcService.provider.interactionResult(
      req,
      res,
      {
        login: {
          accountId: String(verifiedUser.id),
          remember: input.remember,
        },
      },
      { mergeWithLastSubmission: false },
    );

    return this.success({
      next: redirectUrl,
    });
  }

  @Post('confirm')
  async loginConfirm(
    @Query('returnUrl') returnUrl: string | undefined,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const interaction = await this.ensureInteraction(req, res, returnUrl);
    if (!interaction) return;

    const { prompt, params, session } = interaction;

    let grantId = interaction.grantId,
      grant = grantId ? await this.oidcService.provider.Grant.find(grantId) : null;

    if (!grant) {
      grant = new this.oidcService.provider.Grant({
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

    await this.oidcService.provider.interactionFinished(
      req,
      res,
      {
        consent: {
          grantId,
        },
      },
      { mergeWithLastSubmission: true },
    );
  }

  @Get('abort')
  async loginAbort(
    @Body('returnUrl') returnUrl: string | undefined,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const interaction = await this.ensureInteraction(req, res, returnUrl);
    if (!interaction) return;

    const result = {
      error: 'access_denied',
      error_description: 'End-user aborted interaction',
    };

    await this.oidcService.provider.interactionFinished(req, res, result, { mergeWithLastSubmission: false });
  }
}
