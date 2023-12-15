(function (window) {
  var baseUrl = window.location.protocol + '//' + window.location.host;
  var clientId = '35613c26-6a86-ba04-8ee0-6ced9688c75a';

  var env = window._ENV || {};

  env.infrastructureApiBase = '/infrastructure/api';
  env.infrastructureGraphqlBase = '/infrastructure/graphql';
  env.infrastructureGraphqlSubscriptionBase = 'wss://localhost:5002/graphql';
  env.identityGraphqlBase = '/identity/graphql';

  env.oidc = {
    authority: 'http://localhost:5001/',
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
    scope: 'openid profile',
    // will revoke (reference) access tokens at logout time
    revokeAccessTokenOnSignout: true,
    loadUserInfo: false,
    mergeClaims: true,
    monitorSession: true,
  };

  window._ENV = env;
})(this);
