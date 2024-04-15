import url from 'url';
import ejs from 'ejs';
import { stringify } from 'qs';
import { pickBy } from 'lodash';
import { Request, Response } from 'express';
import { isPhoneNumber } from 'class-validator';
import { ModuleRef } from '@nestjs/core';
import { Inject, Controller, Get, Post, Query, Body, Req, Res, Logger, Param } from '@nestjs/common';
import { I18n, I18nContext } from 'nestjs-i18n';
import { Provider } from 'oidc-provider';
import { OidcService } from 'nest-oidc-provider';
import { random, normalizeRoutePath } from '@ace-pomelo/shared-server';
import { BaseController } from '@/common/controllers/base.controller';
import { renderPrimaryStyle } from '@/common/utils/render-primary-style-tag.util';
import { getPasswordModifyTemplate, getPasswordForgotTemplate, getPasswordResetTemplate } from '@/common/templates';
import { AccountProviderService } from '../account-provider/account-provider.service';
import { AccountOptions } from './interfaces/account-options.interface';
import { PasswordModifyDto, PasswordForgotDto, VerifyPhoneCodeDto, PasswordResetDto } from './dto/password.dto';
import { ACCOUNT_OPTIONS } from './constants';

@Controller('/password')
export class PasswordController extends BaseController {
  logger = new Logger(PasswordController.name, { timestamp: true });

  constructor(
    @Inject(ACCOUNT_OPTIONS) private readonly options: AccountOptions,
    private readonly moduleRef: ModuleRef,
    private readonly accountProviderService: AccountProviderService,
    private readonly oidcService: OidcService,
  ) {
    super();
  }

  private get storage() {
    return this.options.storage;
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
    let client: InstanceType<Provider['Client']> | undefined,
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
      : undefined;
    const formLableDisplay = ['1', 'true'].includes(
      (clientProperties['passwordModifyPage.formLableDisplay'] as string) ?? '1',
    );
    const formValidateTooltip = ['1', 'true'].includes(
      (clientProperties['passwordModifyPage.formValidateTooltip'] as string) ?? '0',
    );

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

    let loginName: string | undefined;
    if (session.accountId) {
      const user = await this.accountProviderService.getAccount(session.accountId);
      loginName = user?.login_name as string;
    }

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
              <span class="toggle-password eye" data-target="#oldPassword" ></span>
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
              <span class="toggle-password eye" data-target="#newPassword" ></span>
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
              <span class="toggle-password eye" data-target="#confirmPassword" ></span>
              <div class="invalid-${formValidateTooltip ? 'tooltip' : 'feedback'}">
                ${i18n.tv('password.modify.form.confirm_password_invalid', 'Please input confirm password!')}
              </div>
            </div>
          </div>
        </div>
      </form>`;

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
        ? await this.accountProviderService.updatePassword(session.accountId, input.oldPassword, input.newPassword)
        : await this.accountProviderService.updatePasswordByUsername(
            input.username,
            input.oldPassword,
            input.newPassword,
          );

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
      client: InstanceType<Provider['Client']> | undefined,
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
                  ${i18n.tv('password.forgot.wrapper.submit_btn_text', 'Next')}
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
              placeholder="${i18n.tv('password.forgot.form.username_placeholder', 'Login Name/Email/Mobild')}"
              autofocus="on"
              required
              maxlength="50"
            />
            <div class="invalid-${formValidateTooltip ? 'tooltip' : 'feedback'}">
              ${i18n.tv('password.forgot.form.username_invalid', 'Please input username!')}
            </div>
          </div>
        </div>
      </form>`;

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
    @Res({ passthrough: true }) res: Response,
    @I18n() i18n: I18nContext,
  ) {
    const verifiedAccount = await this.accountProviderService.getAccountByUsername(input.username);
    if (!verifiedAccount) {
      return this.faild(i18n.tv('password.forgot.error.user_not_found', 'User is not found!'));
    }

    const phoneRegion = await this.accountProviderService.getPhoneRegionCode();

    if (!isPhoneNumber(input.username, phoneRegion) && verifiedAccount.email) {
      const expiresIn = this.emailCodeExpiresIn();
      const code = random(10).toString();

      let params: Record<string, any> = {};

      if (returnUrl) {
        const { query } = url.parse(returnUrl, true);
        params = query;
      }

      await this.storage.set(
        this.passwordResetCodeKeyFor(code),
        { accountId: verifiedAccount.sub, clientId: clientId || params.client_id, returnUrl },
        expiresIn,
      );

      const appConfig = this.moduleRef['container'].applicationConfig;
      const resetUrl = `${req.protocol}://${req.get('host')}${normalizeRoutePath(
        appConfig?.getGlobalPrefix() ?? '',
      )}/password/reset/${code}`;

      // TODO: Send email
      console.log(`找回密码地址：${resetUrl}，${expiresIn / 60}分钟有效！`);

      const encodedEmail = verifiedAccount.email
        .split('@')
        .map((v, i) => (i === 0 ? (v.length > 2 ? `${v.slice(0, 1)}**${v.slice(-1)}` : `${v.slice(0, 1)}***`) : v))
        .join('@');
      return this.success({
        message: i18n.tv(
          'password.forgot.success.send_email_content',
          `Please go to check inbox from your email address "${encodedEmail}" and reset your password follow to the instruction!`,
          {
            args: {
              email: encodedEmail,
            },
          },
        ),
      });
      // return this.faild(i18n.tv('password.forgot.error.user_email_not_found', 'Email is not found!'));
    } else if (verifiedAccount.phone_number) {
      let expiresIn = this.mobileCodeExpiresIn();
      const codeLength = 6;
      const code = String(this.randomMobileCode(codeLength));

      const stored = await this.storage.get<{ code: string; time: number }>(
        this.passwordResetCodeKeyFor(verifiedAccount.phone_number),
      );

      if (stored) {
        expiresIn = Math.floor((stored.time + expiresIn * 1000 - new Date().getTime()) / 1000);
      } else {
        await this.storage.set(
          this.passwordResetCodeKeyFor(verifiedAccount.phone_number),
          { accountId: verifiedAccount.sub, code, time: new Date().getTime() },
          expiresIn,
        );
      }

      res.cookie(this.cookieNameForMobileFinding(), verifiedAccount.phone_number + '|' + codeLength, {
        maxAge: expiresIn * 1000,
        httpOnly: true,
      });

      // TODO: Send SMS
      console.log(`找回密码验证码：${code}，${expiresIn}秒有效！`);

      const appConfig = this.moduleRef['container'].applicationConfig;
      // const edcodedPhone = input.username.replace(/(\+?\d{1,})\d{4}(\d{4})$/, '$1****$2');
      return this.success({
        next: `${normalizeRoutePath(appConfig?.getGlobalPrefix() ?? '')}/password/code-verify?${stringify(req.query)}`,
        // message: i18n.tv(
        //   'password.forgot.success.send_sms_code_content',
        //   `Please go to check SMS on your phone number "${edcodedPhone}"!`,
        //   {
        //     args: {
        //       phone: edcodedPhone,
        //     },
        //   },
        // ),
      });
    } else {
      // TODO: 其它验证方式
      return this.faild(i18n.tv('password.forgot.error.user_email_not_found', 'Email is not found!'));
    }
  }

  @Get('code-verify')
  async codeVerify(
    @Query('clientId') clientId: string | undefined,
    @Query('returnUrl') returnUrl: string | undefined,
    @Req() req: Request,
    @Res() res: Response,
    @I18n() i18n: I18nContext,
  ) {
    const [phoneNumber, codeLength = 6] = (req.cookies[this.cookieNameForMobileFinding()] ?? '').split('|');
    let expiresIn = this.mobileCodeExpiresIn();
    const appConfig = this.moduleRef['container'].applicationConfig;

    const redirect = () => {
      res.redirect(`${normalizeRoutePath(appConfig?.getGlobalPrefix() ?? '')}/password/forgot?${stringify(req.query)}`);
    };
    if (!phoneNumber) {
      return redirect();
    } else {
      const stored = await this.storage.get<{ code: string; time: number }>(this.passwordResetCodeKeyFor(phoneNumber));
      if (!stored) {
        return redirect();
      } else {
        expiresIn = Math.floor((stored.time + expiresIn * 1000 - new Date().getTime()) / 1000);
        if (expiresIn <= 5) {
          await this.storage.del(this.passwordResetCodeKeyFor(phoneNumber));
          return redirect();
        }
      }
    }

    let client: InstanceType<Provider['Client']> | undefined,
      clientProperties: Record<string, any> = {};

    let params: Record<string, any> = {};

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

    const customWrapperTemplate = clientProperties['passwordForgotPage.codeVerifytemplate']
      ? getPasswordForgotTemplate(clientProperties['passwordForgotPage.codeVerifytemplate'])
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
        <h1 class="title">${i18n.tv('password.code_verify.wrapper.title', 'Code Verify')}</h1>
        <%- form %>
        <div class="row">
          <div class="${formLableDisplay ? 'col-sm-9 offset-sm-3' : ''}">
            <div class="d-sm-inline-block gap-2">
              <button type="submit" class="btn btn-primary w-100" form="password-code-verify-form">
                ${i18n.tv('password.code_verify.wrapper.submit_btn_text', 'Next')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>`;

    const form = `<form id="password-code-verify-form" action="${req.url}" method="POST" autocomplete="off" novalidate>
        <input type="hidden" name="phone" value="${phoneNumber}" />
        <div class="row mb-3">
        ${
          formLableDisplay
            ? `<label for="code" class="col-sm-3 col-form-label">
                ${i18n.tv('password.code_verify.form.code_label', 'Code')}
              </label>`
            : ''
        }
          <div class="${formLableDisplay ? 'col-sm-9' : ''}">
            <input
              type="text"
              class="form-control"
              id="code"
              name="code"
              placeholder="${i18n.tv('password.code_verify.form.code_placeholder', 'Input Code', {
                args: {
                  length: codeLength,
                },
              })}"
              autofocus="on"
              required
              maxlength="${codeLength}"
              minlength="${codeLength}"
            />
            <div class="invalid-${formValidateTooltip ? 'tooltip' : 'feedback'}">
              ${i18n.tv('password.code_verify.form.code_invalid', 'Please input correct code!')}
            </div>
            <div class="text--secondary">
              <small id="expiresIn"></small>
              <script>
                var count = ${expiresIn};
                var timer;
                function countdown() {
                  count--;
                  document.getElementById('expiresIn').innerText = '${i18n.tv(
                    'password.code_verify.form.code_expires_countdown',
                    'The code will expire in %s second(s)',
                  )}'.replace(/%s/g, count);
                  if (count <= 0) {
                    timer && clearInterval(timer);
                    window.location.href = '${normalizeRoutePath(
                      appConfig?.getGlobalPrefix() ?? '',
                    )}/password/forgot?${stringify(req.query)}';
                  }
                  return countdown;
                };
                timer && clearInterval(timer);
                timer = setInterval(countdown(), 1000);
              </script>
            </div>
          </div>
        </div>
      </form>`;

    return res.render('password', {
      primaryStyleVars: primaryColor ? renderPrimaryStyle(primaryColor) : '',
      title: i18n.tv('password.verify_code.page_title', 'Verify Code'),
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

  @Post('code-verify')
  async codeVerifyCheck(
    @Query('clientId') clientId: string | undefined,
    @Query('returnUrl') returnUrl: string | undefined,
    @Body() input: VerifyPhoneCodeDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @I18n() i18n: I18nContext,
  ) {
    const stored = await this.storage.get<{ accountId: string; code: string }>(
      this.passwordResetCodeKeyFor(input.phone),
    );
    if (!stored) {
      return this.faild(i18n.tv('password.verify.error.code_invalid', 'The code is invalid!'));
    }

    if (stored.code !== input.code) {
      return this.faild(i18n.tv('password.verify.error.code_dismatch', 'The code is incorrect!'));
    }

    const code = random(10).toString();

    let params: Record<string, any> = {};

    if (returnUrl) {
      const { query } = url.parse(returnUrl, true);
      params = query;
    }

    const expiresIn = 60 * 30; // 30 minutes
    await this.storage.set(
      this.passwordResetCodeKeyFor(code),
      { accountId: stored.accountId, clientId: clientId || params.client_id, returnUrl },
      expiresIn,
    );

    this.storage.del(this.passwordResetCodeKeyFor(input.phone));
    res.cookie(this.cookieNameForMobileFinding(), '', { maxAge: 0 });

    const appConfig = this.moduleRef['container'].applicationConfig;
    const resetUrl = `${req.protocol}://${req.get('host')}${normalizeRoutePath(
      appConfig?.getGlobalPrefix() ?? '',
    )}/password/reset/${code}`;

    return this.success({
      next: resetUrl,
    });
  }

  @Get('reset/:code')
  async reset(@Param('code') code: string, @Req() req: Request, @Res() res: Response, @I18n() i18n: I18nContext) {
    const stored = await this.storage.get<{ accountId: string; clientId?: string; returnUrl?: string }>(
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
      client: InstanceType<Provider['Client']> | undefined,
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
            <span class="toggle-password eye" data-target="#newPassword" ></span>
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
              placeholder="${i18n.tv('password.reset.form.confirm_password_placeholder', 'Confirm Password')}"
              autocomplete="off"
              required
              minlength="6"
              maxlength="16"
              value=""
            />
            <span class="toggle-password eye" data-target="#confirmPassword" ></span>
            <div class="invalid-${formValidateTooltip ? 'tooltip' : 'feedback'}">
              ${i18n.tv('password.reset.form.confirm_password_invalid', 'Please input confirm password!')}
            </div>
          </div>
        </div>
      </div>
    </form>`;

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
  async resetCheck(@Param('code') code: string, @Body() input: PasswordResetDto, @I18n() i18n: I18nContext) {
    const stored = await this.storage.get<{ accountId: string; clientId?: string; returnUrl?: string }>(
      this.passwordResetCodeKeyFor(code),
    );
    if (!stored) {
      return this.faild(i18n.tv('password.reset.error.code_invalid', 'The link is invalid!'));
    }

    try {
      const { accountId, clientId } = stored;
      await this.accountProviderService.resetPassword(accountId, input.password);
      await this.storage.del(this.passwordResetCodeKeyFor(code));

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

  private passwordResetCodeKeyFor(input: string) {
    return `passwordReset:${input}`;
  }

  private randomMobileCode(length: number) {
    return Math.floor(Math.pow(10, length - 1) + Math.random() * (Math.pow(10, length) - Math.pow(10, length - 1) - 1));
  }

  private cookieNameForMobileFinding() {
    return `f_phone`;
  }

  private mobileCodeExpiresIn() {
    return 60 * 2; // 2 minutes
  }

  private emailCodeExpiresIn() {
    return 60 * 30; // 30 minutes
  }

  //#endregion
}
