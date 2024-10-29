module.exports = {
  client: {
    identity_service: {
      name: 'identity',
      url: 'http://localhost:5001/graphql',
    },
    bff_service: {
      name: 'bff',
      url: 'http://localhost:5003/graphql',
    },
    includes: ['./src/**/*.ts'],
  },
};
