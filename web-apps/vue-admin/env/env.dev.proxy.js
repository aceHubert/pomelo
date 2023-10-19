(function (window) {
  var baseUrl = window.location.protocol + '//' + window.location.host;
  var clientId = '35613c26-6a86-ba04-8ee0-6ced9688c75a';

  var env = window._ENV || {};

  env.apiBase = '/api';
  env.graphqlBase = '/graphql';
  env.graphqlSubscriptionBase = 'ws://localhost:5010/graphql';

  env.oidc = {
    authority: 'https://demo.login.ihealthinkcare.com/',
    // authority: 'http://localhost:5000/',
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
    scope: 'openid profile base sp res points cp umsg',
    // will revoke (reference) access tokens at logout time
    revokeAccessTokenOnSignout: true,
    mergeClaims: true,
    monitorSession: false,
  };

  window._ENV = env;
})(this);
