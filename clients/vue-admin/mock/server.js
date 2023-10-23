/* eslint-disable no-console */
const express = require('express');
const path = require('path');
const glob = require('glob');
const cliColor = require('cli-color');
const ipAddress = process.env.MOCK_IP_ADDRESS || '0.0.0.0';
const port = process.env.MOCK_PORT || 3001;

const app = express();

app.use(express.json());

// allow custom header and CORS
app.all('*', function (req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header(
    'Access-Control-Allow-Headers',
    'Content-Type, Content-Length, Authorization, Accept, X-Requested-With, x-locale',
  );
  res.header('Access-Control-Allow-Methods', 'PUT, POST, GET, DELETE, OPTIONS');

  if (req.method === 'OPTIONS') {
    res.sendStatus(200); /* 让options请求快速返回 */
  } else {
    next();
  }
});

glob(path.resolve(__dirname, 'apis/*.js'), (err, files) => {
  if (err) {
    throw err;
  }

  files.forEach((file) => {
    try {
      const config = require(file);
      Object.keys(config).forEach((methodUrl) => {
        const [method, path] = methodUrl.split(' ').length === 1 ? ['get', methodUrl] : methodUrl.split(' ');
        const callback =
          typeof config[methodUrl] === 'function' ? config[methodUrl] : (req, resp) => resp.send(config[methodUrl]);

        app[method.toLowerCase()]?.(path, callback);
        console.log(file, cliColor.green(`${method} ${path}`));
      });
    } catch (err) {
      console.log(cliColor.red(`Error: ${err.message} in ${file}`));
    }
  });
});

app.listen(port, ipAddress, () => console.log(`Mock Data listening on ${ipAddress}:${port}!`));
