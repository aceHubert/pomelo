(function (window) {
  var baseUrl = window.location.protocol + '//' + window.location.host;
  var clientId = '3d136433-977f-40c7-8702-a0444a6b2a9f';

  var env = window._ENV || {};

  // env.basicApiBase = 'http://localhost:9080/pomelo/basic/api';
  env.basicGraphqlBase = 'http://localhost:9080/pomelo/basic/graphql';
  env.basicGraphqlSubscriptionBase = 'ws://localhost:9080/pomelo/basic/graphql';
  env.identityGraphqlBase = 'http://localhost:9080/pomelo/identity/graphql';

  env.oidc = {
    authority: 'http://localhost:5002/',
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
