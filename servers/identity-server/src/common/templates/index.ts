import { LoginForm as LoginForm07 } from './login-form-07.template';
import { LoginForm as LoginForm20 } from './login-form-20.template';

function getHtmlTemplate(content: string) {
  const matcher = content.match(/^<([A-Z_-]+)>([\s\S]*)<\/([A-Z_-]+)>$/);

  if (matcher?.length && matcher[1] === matcher[3] && matcher[1] === 'HTML') {
    return matcher[2];
  }
  return;
}

const presetLoginTemplateMap = new Map();
presetLoginTemplateMap.set('template-07', LoginForm07);
presetLoginTemplateMap.set('template-20', LoginForm20);

/**
 * auto detect login template
 * @param presetOrTemplate preset template or template content(<HTML>{content}</HTML>)
 */
export function getLoginTemplate(presetOrTemplate: string) {
  return presetLoginTemplateMap.get(presetOrTemplate) ?? getHtmlTemplate(presetOrTemplate);
}

const presetConsentTemplateMap = new Map();

/**
 * auto detect consent template
 * @param presetOrTemplate preset template or template content(<HTML>{content}</HTML>)
 */
export function getConsentTemplate(presetOrTemplate: string) {
  return presetConsentTemplateMap.get(presetOrTemplate) ?? getHtmlTemplate(presetOrTemplate);
}

const presetSelectAccountTemplateMap = new Map();

/**
 * auto detect select_account template
 * @param presetOrTemplate preset template or template content(<HTML>{content}</HTML>)
 */
export function getSelectAccountTemplate(presetOrTemplate: string) {
  return presetSelectAccountTemplateMap.get(presetOrTemplate) ?? getHtmlTemplate(presetOrTemplate);
}

const presetPasswordModifyTemplateMap = new Map();

/**
 * auto detect password modify template
 * @param presetOrTemplate preset template or template content(<HTML>{content}</HTML>)
 */
export function getPasswordModifyTemplate(presetOrTemplate: string) {
  return presetPasswordModifyTemplateMap.get(presetOrTemplate) ?? getHtmlTemplate(presetOrTemplate);
}

const presetPasswordForgotTemplateMap = new Map();

/**
 * auto detect password forgot template
 * @param presetOrTemplate preset template or template content(<HTML>{content}</HTML>)
 */
export function getPasswordForgotTemplate(presetOrTemplate: string) {
  return presetPasswordForgotTemplateMap.get(presetOrTemplate) ?? getHtmlTemplate(presetOrTemplate);
}

const presetPasswordResetTemplateMap = new Map();

/**
 * auto detect password reset template
 * @param presetOrTemplate preset template or template content(<HTML>{content}</HTML>)
 */
export function getPasswordResetTemplate(presetOrTemplate: string) {
  return presetPasswordResetTemplateMap.get(presetOrTemplate) ?? getHtmlTemplate(presetOrTemplate);
}
