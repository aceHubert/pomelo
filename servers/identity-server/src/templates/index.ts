import { LoginForm as LoginForm07 } from './login-form-07.template';
import { LoginForm as LoginForm20 } from './login-form-20.template';

const presetLoginTemplateMap = new Map();
presetLoginTemplateMap.set('login-form-07', LoginForm07);
presetLoginTemplateMap.set('login-form-20', LoginForm20);

export const getLoginTemplate = (presetOrTemplate: string) => {
  return presetLoginTemplateMap.get(presetOrTemplate) ?? presetOrTemplate;
};
