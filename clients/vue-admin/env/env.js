(function (window) {
  var globalPrefix = process.env.BASE_URL.replace(/\/$/, '');
  var baseUrl = window.location.protocol + '//' + window.location.host;
  var baseWsUrl = baseUrl.replace(/^http/, 'ws');
  var clientId = '35613c26-6a86-ba04-8ee0-6ced9688c75a';

  var env = window._ENV || {};

  // env.infrastructureApiBase = baseUrl + '/infrastructure/api';
  env.infrastructureGraphqlBase = baseUrl + '/infrastructure/graphql';
  env.infrastructureGraphqlSubscriptionBase = baseWsUrl + '/infrastructure/graphql';
  env.identityGraphqlBase = baseUrl + '/identity/graphql';

  env.oidc = {
    authority: baseUrl + '/oauth',
    client_id: clientId,
    redirect_uri: baseUrl + globalPrefix + '/signin.html',
    post_logout_redirect_uri: baseUrl + globalPrefix,
    // Add expiration nofitication time
    accessTokenExpiringNotificationTime: 10,
    // Setup to renew token access automatically
    automaticSilentRenew: true,
    silent_redirect_uri: baseUrl + globalPrefix + '/signin-silent.html',
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
