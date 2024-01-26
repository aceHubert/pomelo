(function (window) {
  var baseUrl = window.location.protocol + '//' + window.location.host;
  var clientId = '35613c26-6a86-ba04-8ee0-6ced9688c75a';

  var env = window._ENV || {};

  // env.infrastructureApiBase = 'https://apis.pomelo.acehubert.com/infrastructure/api';
  env.infrastructureGraphqlBase = 'https://apis.pomelo.acehubert.com/infrastructure/graphql';
  env.infrastructureGraphqlSubscriptionBase = 'wss://apis.pomelo.acehubert.com/infrastructure/graphql';
  env.identityGraphqlBase = 'https://apis.pomelo.acehubert.com/identity/graphql';

  env.oidc = {
    authority: 'https://auth.pomelo.acehubert.com/',
    client_id: clientId,
    redirect_uri: baseUrl + '/signin.html',
    post_logout_redirect_uri: baseUrl,
    // Add expiration nofitication time
    accessTokenExpiringNotificationTime: 10,
    // Setup to renew token access automatically
    automaticSilentRenew: true,
    silent_redirect_uri: baseUrl + '/signin-silent.html',
    // these two will be done dynamically from the buttons clicked, but are
    // needed if you want to use the silent_renew
    response_type: 'code',
    scope: 'openid profile offline_access',
    // will revoke (reference) access tokens at logout time
    revokeAccessTokenOnSignout: true,
    mergeClaims: true,
    monitorSession: true,
  };

  window._ENV = env;
})(this);
