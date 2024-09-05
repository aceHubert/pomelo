(function (window) {
  var globalPrefix = process.env.BASE_URL.replace(/\/$/, '');
  var baseUrl = window.location.protocol + '//' + window.location.host;
  var clientId = '3d136433-977f-40c7-8702-a0444a6b2a9f';

  var env = window._ENV || {};

  // env.basicApiBase = baseUrl + '/basic/api';
  env.basicGraphqlBase = baseUrl + '/basic/graphql';
  env.identityGraphqlBase = baseUrl + '/identity/graphql';

  env.oidc = {
    authority: baseUrl + '/oauth2',
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
