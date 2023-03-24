const casual = require('casual');

casual.define('users', () => {
  return Array.from({ length: 10 }).map((v, index) => ({
    id: index + 1,
    firstName: casual.first_name,
    lastName: casual.last_name,
    city: casual.city,
  }));
});

const users = casual.users;

module.exports = {
  '/users': users,
  '/user/:id': (req, resp) => {
    const user = users.find((user) => String(user.id) === String(req.params.id));
    resp.send(user);
  },
  'post /user': (req, resp) => {
    const user = { ...req.body, id: users.length + 1 };
    users.push(user);
    resp.send(user);
  },
  'patch /user/:id': (req, resp) => {
    let user = users.find((user) => String(user.id) === String(req.params.id));
    if (user) {
      user = { ...user, ...req.body };
      resp.send(user);
    } else {
      resp.send(false);
    }
  },
  'delete /user/:id': (req, resp) => {
    const index = users.findIndex((user) => String(user.id) === String(req.params.id));
    if (index >= 0) {
      users.splice(index, 1);
      resp.send(true);
    } else {
      resp.send(false);
    }
  },
};
