import { interactionPolicy } from 'oidc-provider';
// import { isPhoneNumber } from 'class-validator';

const { Prompt, Check } = interactionPolicy;

export default () =>
  new Prompt(
    { name: 'select_account', requestable: true },
    // new Check('account_confirm', 'account confirm', (ctx) => {
    //   const { oidc } = ctx;
    //   if (!oidc.session) {
    //     return true;
    //   }

    //   if (isPhoneNumber(oidc.session.accountId!)) {
    //     return true;
    //   }

    //   return false;
    // }),
  );
