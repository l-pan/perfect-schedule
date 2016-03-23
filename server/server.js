import Express from 'express';
import path from 'path';

// Webpack Requirements
import webpack from 'webpack';
import config from '../webpack.config.dev';
import webpackDevMiddleware from 'webpack-dev-middleware';
import webpackHotMiddleware from 'webpack-hot-middleware';

// Initialize the Express App
const app = new Express();
if (process.env.NODE_ENV !== 'production') {
  const compiler = webpack(config);
  app.use(webpackDevMiddleware(compiler, { noInfo: true, publicPath: config.output.publicPath }));
  app.use(webpackHotMiddleware(compiler));
}

// React And Redux Setup
import React from 'react';
import { renderToString } from 'react-dom/server';
import { match, RouterContext } from 'react-router';

// Import required modules
import routes from '../app/config/routes';
import apiRoutes from './routes/api.routes';
import { serverConfig } from './config';

// Populate database with course data
import feedData from './util/feedData';

feedData();

// Apply server public assets and routes
app.use(Express.static(path.resolve(__dirname, '../static')));
app.use('/api', apiRoutes);

// if using a mobile browser
function isMobile(req) {
  const ua = req.header('user-agent');
  return /mobile/i.test(ua);
}

// Render Initial HTML
function renderFullPage(html) {
  const cssPath = process.env.NODE_ENV === 'production' ? '/css/app.min.css' : '/css/app.css';
  return `
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Perfect Schedule | A Free and Opensource Schedule Generator</title>
        <link rel="shortcut icon" href="/img/icon.png" />
        <link rel="stylesheet" href=${cssPath} />
        <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/font-awesome/4.5.0/css/font-awesome.min.css">
      </head>
      <body>
        <div id="root">${html}</div>
        <script src="/dist/bundle.js"></script>
      </body>
    </html>
  `;
}

function renderMobilePage() {
  return `
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Perfect Schedule | A Free and Opensource Schedule Generator</title>
        <link rel="shortcut icon" href="/img/icon.png" />
      </head>
      <body>
        <div id="root"><p>Please view our site on a PC for better user experience</p></div>
      </body>
    </html>
  `;
}
// Server Side Rendering based on routes matched by React-router.
app.use((req, res, next) => {
  match({ routes, location: req.url }, (err, redirectLocation, renderProps) => {
    if (err) {
      return res.status(500).end('Internal server error');
    }

    if (redirectLocation) {
      return res.redirect(302, redirectLocation.pathname + redirectLocation.search);
    }

    if (!renderProps) {
      return next();
    }

    const initialView = renderToString(
      <RouterContext {...renderProps} />
    );

    // use mobile template if use mobile browser
    if (isMobile(req)) {
      return res.status(200).end(renderMobilePage());
    }

    return res.status(200).end(renderFullPage(initialView));
  });
});

// start app
app.listen(serverConfig.port, (error) => {
  if (!error) {
    console.log(`MERN is running on port: ${serverConfig.port}! Build something amazing!`); // eslint-disable-line
  }
});

export default app;
