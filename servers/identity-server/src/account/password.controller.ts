import url from 'url';
import ejs from 'ejs';
import { pickBy } from 'lodash';
import { Request, Response } from 'express';
import { ModuleRef } from '@nestjs/core';
import { Controller, Get, Post, Query, Body, Req, Res, Logger, Param } from '@nestjs/common';
import { I18n, I18nContext } from 'nestjs-i18n';
import { OidcService } from 'nest-oidc-provider';
import { md5, random, normalizeRoutePath } from '@ace-pomelo/shared-server';
import { UserDataSource } from '@ace-pomelo/infrastructure-datasource';
import { BaseController } from '@/common/controllers/base.controller';
import { renderPrimaryStyle } from '@/common/utils/render-primary-style-tag.util';
import { RedisService } from '@/storage/redis.service';
import { getPasswordModifyTemplate, getPasswordForgotTemplate, getPasswordResetTemplate } from '@/templates';
import { PasswordModifyDto, PasswordForgotDto, PasswordResetDto } from './dto/password.dto';

@Controller('/password')
export class PasswordController extends BaseController {
  logger = new Logger(PasswordController.name, { timestamp: true });

  constructor(
    private readonly moduleRef: ModuleRef,
    private readonly redisService: RedisService,
    private readonly oidcService: OidcService,
    private readonly userDataSource: UserDataSource,
  ) {
    super();
  }

  //#region Modify password

  @Get('modify')
  async modify(
    @Query('clientId') clientId: string | undefined,
    @Req() req: Request,
    @Res() res: Response,
    @I18n() i18n: I18nContext,
  ) {
    const session = await this.oidcService.getSession(req, res);
    let client: any,
      clientProperties: Record<string, any> = {};

    // if client_id present
    if (clientId) {
      client = await this.oidcService.provider.Client.find(clientId);
      clientProperties = pickBy(client?.metadata().extra_properties ?? {}, (value, key) => {
        const split = key.split('.');
        return split.length === 1 || (split.length > 1 && split[0] === 'passwordModifyPage');
      }); // passwordPage.xxx
    }

    const primaryColor = clientProperties['primaryColor'] as string;
    const customWrapperTemplate = clientProperties['passwordModifyPage.template']
      ? getPasswordModifyTemplate(clientProperties['passwordModifyPage.template'])
      : clientProperties['template']
      ? getPasswordModifyTemplate(clientProperties['template'])
      : undefined;
    const formLableDisplay = ['1', 'true'].includes(
      (clientProperties['passwordModifyPage.formLableDisplay'] as string) ?? '1',
    );
    const formValidateTooltip = ['1', 'true'].includes(
      (clientProperties['passwordModifyPage.formValidateTooltip'] as string) ?? '0',
    );

    let loginName: string | undefined;
    if (session.accountId) {
      const user = await this.userDataSource.get(['loginName'], Number(session.accountId));
      loginName = user?.loginName;
    }

    const wrapper =
      customWrapperTemplate ||
      `<div class="wrapper-placeholder">
        <%- locales %>
        <div class="wrapper">
          <h1 class="title">${i18n.tv('password.modify.wrapper.title', 'Modify password')}</h1>
          <%- form %>
          <div class="row">
            <div class="${formLableDisplay ? 'col-sm-9 offset-sm-3' : ''}">
              <div class="d-sm-inline-block gap-2 mt-2">
                <button type="submit" class="btn btn-primary w-100" form="password-modify-form">
                  ${i18n.tv('password.modify.wrapper.submit_btn_text', 'Submit')}
                </button>
              </div>
              <div class="d-sm-inline-block gap-2 mt-2">
                <button id="cancle-btn" type="button" class="btn btn-light w-100">
                  ${i18n.tv('password.modify.wrapper.cancel_btn_text', 'Cancel')}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>`;

    const form = `<form id="password-modify-form" action="${req.url}" method="POST" autocomplete="off" novalidate>
        <input type="hidden" name="accountId" value="${session.accountId}" />
        <div class="row mb-3">
        ${
          formLableDisplay
            ? `<label for="username" class="col-sm-3 col-form-label">
                ${i18n.tv('password.modify.form.username_label', 'Username')}
              </label>`
            : ''
        }
          <div class="${formLableDisplay ? 'col-sm-9' : ''}">
            <input
              type="text"
              class="form-control"
              id="username"
              name="username"
              placeholder="${i18n.tv('password.modify.form.username_placeholder', 'Login Name/Email/Phone')}"
              ${!loginName ? `autofocus="on"` : `value="${loginName}" readonly`}
              required
              maxlength="50"
            />
            <div class="invalid-${formValidateTooltip ? 'tooltip' : 'feedback'}">
              ${i18n.tv('password.modify.form.username_invalid', 'Please input username!')}
            </div>
          </div>
        </div>
        <div class="row mb-3">
        ${
          formLableDisplay
            ? `<label for="password" class="col-sm-3 col-form-label">
                ${i18n.tv('password.modify.form.old_password_label', 'Old Password')}
              </label>`
            : ''
        }
          <div class="${formLableDisplay ? 'col-sm-9' : ''}">
            <div style="position: relative">
              <input
                type="password"
                class="form-control password"
                id="oldPassword"
                name="oldPassword"
                placeholder="${i18n.tv('password.modify.form.old_password_placeholder', 'Old Password')}"
                autocomplete="off"
                ${loginName ? `autofocus="on"` : ''}
                required
                minlength="6"
                maxlength="16"
                value=""
              />
              <span toggle="#oldPassword" class="toggle-password eye"></span>
              <div class="invalid-${formValidateTooltip ? 'tooltip' : 'feedback'}">
                ${i18n.tv('password.modify.form.old_password_invalid', 'Please input old password!')}
              </div>
            </div>
          </div>
        </div>
        <div class="row mb-3">
        ${
          formLableDisplay
            ? `<label for="password" class="col-sm-3 col-form-label">
                ${i18n.tv('password.modify.form.new_password_label', 'New Password')}
              </label>`
            : ''
        }
          <div class="${formLableDisplay ? 'col-sm-9' : ''}">
            <div style="position: relative">
              <input
                type="password"
                class="form-control password"
                id="newPassword"
                name="newPassword"
                placeholder="${i18n.tv('password.modify.form.new_password_placeholder', 'New Password')}"
                autocomplete="off"
                ${loginName ? `autofocus="on"` : ''}
                required
                minlength="6"
                maxlength="16"
                value=""
              />
              <span toggle="#newPassword" class="toggle-password eye"></span>
              <div class="invalid-${formValidateTooltip ? 'tooltip' : 'feedback'}">
                ${i18n.tv(
                  'password.modify.form.new_password_invalid',
                  'Please input password(6-16 characters includes numbers and letters)!',
                )}
              </div>
            </div>
          </div>
        </div>
        <div class="row mb-3">
        ${
          formLableDisplay
            ? `<label for="password" class="col-sm-3 col-form-label">
              ${i18n.tv('password.modify.form.confirm_password_label', 'Confirm Password')}
            </label>`
            : ''
        }
          <div class="${formLableDisplay ? 'col-sm-9' : ''}">
            <div style="position: relative">
              <input
                type="password"
                class="form-control password"
                id="confirmPassword"
                name="confirmPassword"
                placeholder="${i18n.tv('password.modify.form.confirm_password_placeholder', 'Confirm Password')}"
                autocomplete="off"
                required
                minlength="6"
                maxlength="16"
                value=""
              />
              <span toggle="#confirmPassword" class="toggle-password eye"></span>
              <div class="invalid-${formValidateTooltip ? 'tooltip' : 'feedback'}">
                ${i18n.tv('password.modify.form.confirm_password_invalid', 'Please input confirm password!')}
              </div>
            </div>
          </div>
        </div>
      </form>
      <div class="toast-container position-absolute p-3 top-0 start-50 translate-middle-x">
        <div id="errorToast" class="toast red lighten-5" role="alert" aria-live="assertive" aria-atomic="true">
          <div class="d-flex">
            <div class="toast-body"></div>
            <button type="button" class="btn-close me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
          </div>
        </div>
      </div>`;

    return res.render('password', {
      primaryStyleVars: primaryColor ? renderPrimaryStyle(primaryColor) : '',
      title: i18n.tv('password.modify.page_title', 'Modify Password'),
      content: ejs.render(wrapper, {
        form,
        locales: this.getLocaleBtns(req, i18n.service.resolveLanguage(i18n.lang)),
        tv: i18n.tv.bind(i18n),
        clientId: client?.clientId,
        clientName: client?.clientName,
        clientProperties,
      }),
    });
  }

  @Post('modify')
  async modifyCheck(
    @Query('clientId') clientId: string | undefined,
    @Query('returnUrl') returnUrl: string | undefined,
    @Body() input: PasswordModifyDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @I18n() i18n: I18nContext,
  ) {
    const session = await this.oidcService.getSession(req, res);
    if (session.accountId && session.accountId !== input.accountId) {
      return this.faild(
        i18n.tv('password.modify.error.account_id_not_match', 'Account id not match current sign-in user!'),
      );
    }

    try {
      session.accountId
        ? await this.userDataSource.updateLoginPwd(
            Number(session.accountId),
            md5(input.oldPassword),
            md5(input.newPassword),
          )
        : await this.userDataSource.updateLoginPwd(input.username, md5(input.oldPassword), md5(input.newPassword));

      // if client_id present
      if (!returnUrl && clientId) {
        const client = await this.oidcService.provider.Client.find(clientId);
        returnUrl = client?.initiateLoginUri;
      }

      return this.success({
        next: returnUrl || '/',
      });
    } catch (e: any) {
      return this.faild(e.message);
    }
  }

  //#endregion

  //#region Forgot password

  @Get('forgot')
  async forgot(
    @Query('clientId') clientId: string | undefined,
    @Query('returnUrl') returnUrl: string | undefined,
    @Req() req: Request,
    @Res() res: Response,
    @I18n() i18n: I18nContext,
  ) {
    let params: Record<string, any> = {},
      client: any,
      clientProperties: Record<string, any> = {};

    if (returnUrl) {
      const { query } = url.parse(returnUrl, true);
      params = query;
    }

    // if client_id present
    if (clientId || params.client_id) {
      client = await this.oidcService.provider.Client.find(clientId || params.client_id);
      clientProperties = pickBy(client?.metadata().extra_properties ?? {}, (value, key) => {
        const split = key.split('.');
        return split.length === 1 || (split.length > 1 && split[0] === 'passwordForgotPage');
      }); // passwordPage.xxx
    }

    const customWrapperTemplate = clientProperties['passwordForgotPage.template']
      ? getPasswordForgotTemplate(clientProperties['passwordForgotPage.template'])
      : clientProperties['template']
      ? getPasswordForgotTemplate(clientProperties['template'])
      : undefined;
    const formLableDisplay = ['1', 'true'].includes(
      (clientProperties['passwordForgotPage.formLableDisplay'] as string) ?? '1',
    );
    const formValidateTooltip = ['1', 'true'].includes(
      (clientProperties['passwordForgotPage.formValidateTooltip'] as string) ?? '0',
    );
    const primaryColor = clientProperties['primaryColor'] as string;

    const wrapper =
      customWrapperTemplate ||
      `<div class="wrapper-placeholder">
        <%- locales %>
        <div class="wrapper">
          <h1 class="title">${i18n.tv('password.forgot.wrapper.title', 'Find password')}</h1>
          <%- form %>
          <div class="row">
            <div class="${formLableDisplay ? 'col-sm-9 offset-sm-3' : ''}">
              <div class="d-sm-inline-block gap-2 mt-2">
                <button type="submit" class="btn btn-primary w-100" form="password-forgot-form">
                  ${i18n.tv('password.forgot.wrapper.submit_btn_text', 'Submit')}
                </button>
              </div>
              <div class="d-sm-inline-block gap-2 mt-2">
                <button id="cancle-btn" type="button" class="btn btn-light w-100">
                  ${i18n.tv('password.forgot.wrapper.cancel_btn_text', 'Cancel')}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>`;

    const form = `<form id="password-forgot-form" action="${req.url}" method="POST" autocomplete="off" novalidate>
        <div class="row mb-3">
        ${
          formLableDisplay
            ? `<label for="username" class="col-sm-3 col-form-label">
                ${i18n.tv('password.forgot.form.username_label', 'Username')}
              </label>`
            : ''
        }
          <div class="${formLableDisplay ? 'col-sm-9' : ''}">
            <input
              type="text"
              class="form-control"
              id="username"
              name="username"
              placeholder="${i18n.tv('password.forgot.form.username_placeholder', 'Login Name/Email')}"
              autofocus="on"
              required
              maxlength="50"
            />
            <div class="invalid-${formValidateTooltip ? 'tooltip' : 'feedback'}">
              ${i18n.tv('password.forgot.form.username_invalid', 'Please input username!')}
            </div>
          </div>
        </div>
      </form>
      <div class="toast-container position-absolute p-3 top-0 start-50 translate-middle-x">
        <div id="errorToast" class="toast red lighten-5" role="alert" aria-live="assertive" aria-atomic="true">
          <div class="d-flex">
            <div class="toast-body"></div>
            <button type="button" class="btn-close me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
          </div>
        </div>
      </div>`;

    return res.render('password', {
      primaryStyleVars: primaryColor ? renderPrimaryStyle(primaryColor) : '',
      title: i18n.tv('password.forgot.page_title', 'Find Password'),
      content: ejs.render(wrapper, {
        form,
        locales: this.getLocaleBtns(req, i18n.service.resolveLanguage(i18n.lang)),
        tv: i18n.tv.bind(i18n),
        clientId: client?.clientId,
        clientName: client?.clientName,
        clientProperties,
      }),
    });
  }

  @Post('forgot')
  async forgotCheck(
    @Query('clientId') clientId: string | undefined,
    @Query('returnUrl') returnUrl: string | undefined,
    @Body() input: PasswordForgotDto,
    @Req() req: Request,
    @I18n() i18n: I18nContext,
  ) {
    const user = await this.userDataSource.getEmail(input.username);
    if (!user?.email) {
      return this.faild(i18n.tv('password.forgot.error.user_email_not_found', 'Email not found!'));
    }

    // TODO: Mobile phone find password

    const code = random(10);

    let params: Record<string, any> = {};

    if (returnUrl) {
      const { query } = url.parse(returnUrl, true);
      params = query;
    }

    await this.redisService.set(
      this.passwordResetCodeKeyFor(code),
      { accountId: String(user.id), clientId: clientId || params.client_id, returnUrl },
      60 * 30,
    ); // 30 minutes

    const appConfig = this.moduleRef['container'].applicationConfig;
    const resetUrl = `${req.protocol}://${req.get('host')}${normalizeRoutePath(
      appConfig?.getGlobalPrefix() ?? '',
    )}/password/reset/${code}`;

    // TODO: Send email
    console.log(resetUrl);

    return this.success({
      message: i18n.tv(
        'password.forgot.success.send_email_content',
        `Please go to check inbox from your email address "${user.email}" and reset your password follow to the instruction!`,
        {
          args: {
            email: user.email,
          },
        },
      ),
    });
  }

  @Get('reset/:code')
  async reset(@Param('code') code: string, @Req() req: Request, @Res() res: Response, @I18n() i18n: I18nContext) {
    const stored = await this.redisService.get<{ accountId: string; clientId?: string; returnUrl?: string }>(
      this.passwordResetCodeKeyFor(code),
    );

    if (!stored) {
      const errorWrapper = `<div class="wrapper-placeholder">
        <%- locales %>
        <div class="wrapper">
          <h1 class="title">${i18n.tv('password.reset.wrapper.title', 'Reset password')}</h1>
          <div class="mt-8">
            <%- error %>
          </div>
        </div>
      </div>`;

      return res.render('password', {
        primaryStyleVars: '',
        title: i18n.tv('password.reset.page_title', 'Reset Password'),
        content: ejs.render(errorWrapper, {
          error: `<p>
            <strong>${i18n.tv('password.reset.error.title', 'Error: ')}</strong>
            <span class="error--text">${i18n.tv('password.reset.error.code_invalid', 'The link is invalid!')}</span>
          </p>`,
          locales: this.getLocaleBtns(req, i18n.service.resolveLanguage(i18n.lang)),
          tv: i18n.tv.bind(i18n),
        }),
      });
    }

    const { accountId, clientId, returnUrl } = stored;
    let params: Record<string, any> = {},
      client: any,
      clientProperties: Record<string, any> = {};

    if (returnUrl) {
      const { query } = url.parse(returnUrl, true);
      params = query;
    }

    // if client_id present
    if (clientId || params.client_id) {
      client = await this.oidcService.provider.Client.find(clientId || params.client_id);
      clientProperties = pickBy(client?.metadata().extra_properties ?? {}, (value, key) => {
        const split = key.split('.');
        return split.length === 1 || (split.length > 1 && split[0] === 'passwordResetPage');
      }); // passwordPage.xxx
    }

    const primaryColor = clientProperties['primaryColor'] as string;
    const customWrapperTemplate = clientProperties['passwordResetPage.template']
      ? getPasswordResetTemplate(clientProperties['passwordResetPage.template'])
      : clientProperties['template']
      ? getPasswordResetTemplate(clientProperties['template'])
      : undefined;
    const formLableDisplay = ['1', 'true'].includes(
      (clientProperties['passwordResetPage.formLableDisplay'] as string) ?? '1',
    );
    const formValidateTooltip = ['1', 'true'].includes(
      (clientProperties['passwordResetPage.formValidateTooltip'] as string) ?? '0',
    );
    const wrapper =
      customWrapperTemplate ||
      `<div class="wrapper-placeholder">
        <%- locales %>
        <div class="wrapper">
          <h1 class="title">${i18n.tv('password.reset.wrapper.title', 'Reset password')}</h1>
          <%- form %>
          <div class="row">
            <div class="${formLableDisplay ? 'col-sm-9 offset-sm-3' : ''}">
              <div class="d-sm-inline-block gap-2 mt-2">
                <button type="submit" class="btn btn-primary w-100" form="password-reset-form">
                  ${i18n.tv('password.reset.wrapper.submit_btn_text', 'Reset')}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>`;

    const form = `<form id="password-reset-form" action="${req.url}" method="POST" autocomplete="off" novalidate>
      <input type="hidden" name="accountId" value="${accountId}" />
      <div class="row mb-3">
      ${
        formLableDisplay
          ? `<label for="password" class="col-sm-3 col-form-label">
              ${i18n.tv('password.reset.form.new_password_label', 'New Password')}
            </label>`
          : ''
      }
        <div class="${formLableDisplay ? 'col-sm-9' : ''}">
          <div style="position: relative">
            <input
              type="password"
              class="form-control password"
              id="newPassword"
              name="newPassword"
              placeholder="${i18n.tv('password.reset.form.new_password_placeholder', 'New Password')}"
              autocomplete="off"
              autofocus="on"
              required
              minlength="6"
              maxlength="16"
              value=""
            />
            <span toggle="#newPassword" class="toggle-password eye"></span>
            <div class="invalid-${formValidateTooltip ? 'tooltip' : 'feedback'}">
              ${i18n.tv(
                'password.reset.form.new_password_invalid',
                'Please input password(6-16 characters includes numbers and letters)!',
              )}
            </div>
          </div>
        </div>
      </div>
      <div class="row mb-3">
      ${
        formLableDisplay
          ? `<label for="password" class="col-sm-3 col-form-label">
            ${i18n.tv('password.reset.form.confirm_password_label', 'Confirm Password')}
          </label>`
          : ''
      }
        <div class="${formLableDisplay ? 'col-sm-9' : ''}">
          <div style="position: relative">
            <input
              type="password"
              class="form-control password"
              id="confirmPassword"
              name="confirmPassword"
              placeholder="${i18n.tv('password.reset.form.conform_password_placeholder', 'Confirm Password')}"
              autocomplete="off"
              required
              minlength="6"
              maxlength="16"
              value=""
            />
            <span toggle="#confirmPassword" class="toggle-password eye"></span>
            <div class="invalid-${formValidateTooltip ? 'tooltip' : 'feedback'}">
              ${i18n.tv('password.reset.form.confirm_password_invalid', 'Please input confirm password!')}
            </div>
          </div>
        </div>
      </div>
    </form>
    <div class="toast-container position-absolute p-3 top-0 start-50 translate-middle-x">
        <div id="errorToast" class="toast red lighten-5" role="alert" aria-live="assertive" aria-atomic="true">
          <div class="d-flex">
            <div class="toast-body"></div>
            <button type="button" class="btn-close me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
          </div>
        </div>
      </div>`;

    return res.render('password', {
      primaryStyleVars: primaryColor ? renderPrimaryStyle(primaryColor) : '',
      title: i18n.tv('password.reset.page_title', 'Reset Password'),
      content: ejs.render(wrapper, {
        form,
        locales: this.getLocaleBtns(req, i18n.service.resolveLanguage(i18n.lang)),
        tv: i18n.tv.bind(i18n),
        clientId: client?.clientId,
        clientName: client?.clientName,
        clientProperties,
      }),
    });
  }

  @Post('reset/:code')
  async checkReset(@Param('code') code: string, @Body() input: PasswordResetDto, @I18n() i18n: I18nContext) {
    const stored = await this.redisService.get<{ accountId: string; clientId?: string; returnUrl?: string }>(
      this.passwordResetCodeKeyFor(code),
    );
    if (!stored) {
      return this.faild(i18n.tv('password.reset.error.code_invalid', 'The link is invalid!'));
    }

    try {
      const { accountId, clientId } = stored;
      await this.userDataSource.resetLoginPwd(Number(accountId), md5(input.password));
      await this.redisService.del(this.passwordResetCodeKeyFor(code));

      let returnUrl = stored.returnUrl;
      if (!returnUrl && clientId) {
        const client = await this.oidcService.provider.Client.find(clientId);
        returnUrl = client?.initiateLoginUri;
      }

      return this.success({
        next: returnUrl || '/',
      });
    } catch (e: any) {
      return this.faild(e.message);
    }
  }

  private passwordResetCodeKeyFor(code: string) {
    return `passwordReset:${code}`;
  }

  //#endregion
}
