(function (window) {
  var baseUrl = window.location.protocol + '//' + window.location.host;
  var clientId = '35613c26-6a86-ba04-8ee0-6ced9688c75a';

  var env = window._ENV || {};

  env.apiBase = 'https://localhost:5002/api';
  env.graphqlBase = 'https://localhost:5002/graphql';
  env.graphqlSubscriptionBase = 'ws://localhost:5002/graphql';

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
    response_type: 'id_token token',
    scope: 'openid profile offline_access',
    // will revoke (reference) access tokens at logout time
    revokeAccessTokenOnSignout: true,
    mergeClaims: true,
    monitorSession: true,
  };

  window._ENV = env;
})(this);
