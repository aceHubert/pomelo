module.exports = {
  client: {
    service: {
      name: 'basic-bff',
      url: 'http://localhost:5003/graphql',
    },
    includes: ['./src/**/*.ts'],
  },
};
