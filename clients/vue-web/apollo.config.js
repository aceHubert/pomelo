module.exports = {
  client: {
    service: {
      name: 'bff',
      url: 'http://localhost:5002/graphql',
    },
    // identity_service: {
    //   name: 'identity',
    //   url: 'http://localhost:5001/graphql',
    // },
    includes: ['./src/**/*.ts'],
  },
};
