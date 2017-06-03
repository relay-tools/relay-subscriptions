/**
 * This file provided by Facebook is for non-commercial testing and evaluation
 * purposes only.  Facebook reserves all rights not expressly granted.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL
 * FACEBOOK BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN
 * ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
 * CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

/* eslint-disable no-console */

import express from 'express';
import graphQLHTTP from 'express-graphql';
import { graphql } from 'graphql';
import { graphqlSubscribe } from 'graphql-relay-subscription';
import path from 'path';
import webpack from 'webpack';
import WebpackDevServer from 'webpack-dev-server';

import { addNotifier } from './data/database';
import { schema } from './data/schema';

const APP_PORT = 3000;
const GRAPHQL_PORT = 8080;

// Expose a GraphQL endpoint
const graphQLApp = express();
graphQLApp.use('/', graphQLHTTP({ schema, pretty: true, graphiql: true }));

const graphQLServer = graphQLApp.listen(GRAPHQL_PORT, () => {
  console.log(
    `GraphQL Server is now running on http://localhost:${GRAPHQL_PORT}`
  );
});

const io = require('socket.io')(graphQLServer, {
  serveClient: false,
});

io.on('connection', socket => {
  const topics = Object.create(null);
  const unsubscribeMap = Object.create(null);

  const removeNotifier = addNotifier(({ topic, data }) => {
    const topicListeners = topics[topic];
    if (!topicListeners) return;

    topicListeners.forEach(({ id, query, variables }) => {
      graphql(
        schema,
        query,
        data,
        null,
        variables
      ).then((result) => {
        socket.emit('subscription update', { id, ...result });
      });
    });
  });

  socket.on('subscribe', ({ id, query, variables }) => {
    function unsubscribe(topic, subscription) {
      const index = topics[topic].indexOf(subscription);
      if (index === -1) return;

      topics[topic].splice(index);

      console.log(
        'Removed subscription for topic %s. Total subscriptions for topic: %d',
        topic,
        topics[topic].length
      );
    }

    function subscribe(topic) {
      topics[topic] = topics[topic] || [];
      const subscription = { id, query, variables };

      topics[topic].push(subscription);

      unsubscribeMap[id] = () => {
        unsubscribe(topic, subscription);
      };

      console.log(
        'New subscription for topic %s. Total subscriptions for topic: %d',
        topic,
        topics[topic].length
      );
    }

    graphqlSubscribe({
      schema,
      query,
      variables,
      context: { subscribe },
    }).then((result) => {
      if (result.errors) {
        console.error('Subscribe failed', result.errors);
      }
    });
  });

  socket.on('unsubscribe', (id) => {
    const unsubscribe = unsubscribeMap[id];
    if (!unsubscribe) return;

    unsubscribe();
    delete unsubscribeMap[id];
    socket.emit('subscription closed', id);
  });

  socket.on('disconnect', () => {
    console.log('Socket disconnect');
    removeNotifier();
  });
});

// Serve the Relay app.
const compiler = webpack({
  entry: [
    'babel-polyfill',
    './js/app.js',
  ],

  output: {
    path: '/',
    filename: 'app.js',
  },

  module: {
    rules: [
      { test: /\.js$/, exclude: /node_modules/, use: 'babel-loader' },
    ],
  },

  devtool: 'sourcemap',
});

const app = new WebpackDevServer(compiler, {
  contentBase: '/public/',
  proxy: {
    '/graphql': `http://localhost:${GRAPHQL_PORT}`,
    '/socket.io': `http://localhost:${GRAPHQL_PORT}`,
  },
  publicPath: '/js/',
  stats: { colors: true },
});

// Serve static resources
app.use('/', express.static(path.join(__dirname, 'public')));
app.listen(APP_PORT, () => {
  console.log(`App is now running on http://localhost:${APP_PORT}`);
});
