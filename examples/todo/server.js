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
import { parse, subscribe } from 'graphql';
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

class AsyncQueue {
  constructor(unsubscribe) {
    this.unsubscribe = unsubscribe;

    this.values = [];
    this.createPromise();

    this.iterable = this.createIterable();
  }

  createPromise() {
    this.promise = new Promise((resolve) => {
      this.resolvePromise = resolve;
    });
  }

  async * createIterable() {
    try {
      while (true) { // eslint-disable-line no-constant-condition
        await this.promise; // eslint-disable-line no-unused-expressions

        for (const value of this.values) {
          yield value;
        }

        this.values.length = 0;
        this.createPromise();
      }
    } finally {
      this.unsubscribe();
    }
  }

  push(value) {
    this.values.push(value);
    this.resolvePromise();
  }
}

const io = require('socket.io')(graphQLServer, {
  serveClient: false,
});

io.on('connection', socket => {
  const topics = Object.create(null);
  const subscriptions = Object.create(null);

  const removeNotifier = addNotifier(({ topic, data }) => {
    const topicQueues = topics[topic];
    if (!topicQueues) {
      return;
    }

    topicQueues.forEach(queue => {
      queue.push(data);
    });
  });

  socket.on('subscribe', async ({ id, query, variables }) => {
    function unsubscribe(topic, queue) {
      const topicQueues = topics[topic];

      const index = topicQueues.indexOf(queue);
      if (index === -1) {
        return;
      }

      topicQueues.splice(index, 1);
      console.log('removed subscription for %s', topic);
    }

    function createSubscription(topic) {
      if (!topics[topic]) {
        topics[topic] = [];
      }

      const queue = new AsyncQueue(() => {
        unsubscribe(topic, queue);
      });

      topics[topic].push(queue);
      console.log('added subscription for %s', topic);

      return queue.iterable;
    }

    const subscription = await subscribe(
      schema,
      parse(query),
      null,
      { subscribe: createSubscription },
      variables,
    );

    if (subscription.errors) {
      console.error('subscribe failed', subscription.errors);
      return;
    }

    subscriptions[id] = subscription;

    for await (const result of subscription) { // eslint-disable-line semi
      socket.emit('subscription update', { id, ...result });
    }
  });

  socket.on('unsubscribe', (id) => {
    const subscription = subscriptions[id];
    if (!subscription) {
      return;
    }

    subscription.return();
    delete subscriptions[id];
    socket.emit('subscription closed', id);
  });

  socket.on('disconnect', () => {
    console.log('socket disconnect');
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
