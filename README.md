# Relay Subscriptions [![npm][npm-badge]][npm]

Subscription support for [Relay Classic](http://facebook.github.io/relay/).

![PoC](http://g.recordit.co/zZfGNmYJTr.gif)

[![Discord][discord-badge]][discord]

## Documentation

- [Guide](#guide)
- [TodoMVC example](examples/todo)
- [API reference](docs/API.md)

## Guide

### Installation

```sh
$ npm i -S react react-relay babel-relay-plugin
$ npm i -S relay-subscriptions
```

### Network layer ([API](docs/API.md#network-layer))

To use Relay Subscriptions, you need to provide a network layer with subscription support. This network layer needs to implement a `sendSubscription` method that takes a subscription request, calls the observer methods on the request when the subscription updates, and returns a disposable for tearing down the subscription.

A simple network layer that uses [Socket.IO](http://socket.io/) as the underlying transport looks like:

```js
import Relay from 'react-relay/classic';
import io from 'socket.io-client';

export default class NetworkLayer extends Relay.DefaultNetworkLayer {
  constructor(...args) {
    super(...args);

    this.socket = io();
    this.requests = Object.create(null);

    this.socket.on('subscription update', ({ id, data, errors }) => {
      const request = this.requests[id];
      if (errors) {
        request.onError(errors);
      } else {
        request.onNext(data);
      }
    });
  }

  sendSubscription(request) {
    const id = request.getClientSubscriptionId();
    this.requests[id] = request;

    this.socket.emit('subscribe', {
      id,
      query: request.getQueryString(),
      variables: request.getVariables(),
    });

    return {
      dispose: () => {
        this.socket.emit('unsubscribe', id);
      },
    };
  }
}
```

For a full example, see [the network layer](examples/todo/js/NetworkLayer.js) in the TodoMVC example.

If your server uses [GraphQL.js](https://github.com/graphql/graphql-js), [graphql-relay-subscription](https://github.com/taion/graphql-relay-subscription) provides helpers for implementing subscriptions. For a basic example, see [the server](examples/todo/server.js) and [the schema](examples/todo/data/schema.js) in the TodoMVC example.

### Environment ([API](docs/API.md#relaysubscriptionsenvironment))

Instead of using a standard `Relay.Environment`, use a `RelaySubscriptions.Environment`. This environment class adds subscription support to the standard Relay environment.

```js
import RelaySubscriptions from 'relay-subscriptions';

import NetworkLayer from './NetworkLayer';

const environment = new RelaySubscriptions.Environment();
environment.injectNetworkLayer(new NetworkLayer());
```

### Subscriptions ([API](docs/API.md#subscription))

Subclass the `Subscription` class to define subscriptions. This base class is similar to `Relay.Mutation`. A basic subscription looks like:

```js
import Relay from 'react-relay/classic';
import { Subscription } from 'relay-subscriptions';

import Widget from '../components/Widget';

export default class WidgetSubscription extends Subscription {
  static fragments = {
    widget: () => Relay.QL`
      fragment on Widget {
        id
      }
    `,
  };

  getSubscription() {
    return Relay.QL`
      subscription {
        updateWidget(input: $input) {
          widget {
            ${Widget.getFragment('widget')}
          }
        }
      }
    `;
  }

  getConfigs() {
    return [{
      type: 'FIELDS_CHANGE',
      fieldIDs: {
        widget: this.props.widget.id,
      },
    }];
  }

  getVariables() {
    return {
      id: this.props.widget.id,
    };
  }
}
```

Due to an open issue ([#12]), for a `RANGE_ADD` subscription, you must manually request the `__typename` field on the edge in the payload.

For full examples, see [the subscriptions](examples/todo/js/subscriptions) in the TodoMVC example.

### Containers ([API](docs/API.md#relaysubscriptionscreatecontainer))

For components with subscriptions, use `RelaySubscriptions.createContainer` instead of `Relay.createContainer`. Define your Relay fragments normally, including the fragments for any subscriptions you need, then define a `subscriptions` array of functions that create the desired subscriptions from the component's props.

```js
import React from 'react';
import Relay from 'react-relay/classic';
import RelaySubscriptions from 'relay-subscriptions';

import WidgetSubscription from '../subscriptions/WidgetSubscription';

class Widget extends React.Component { /* ... */ }

export default RelaySubscriptions.createContainer(Widget, {
  fragments: {
    widget: () => Relay.QL`
      fragment on Widget {
        # ...
        ${WidgetSubscription.getFragment('widget')}
      }
    `,
  },

  subscriptions: [
    ({ widget }) => new WidgetSubscription({ widget }),
  ],
})
```

If you want to manually manage your subscription, the container also adds a `subscribe` method on `props.relay`, which takes a `Subscription` and an optional observer, and returns a disposable for tearing down the subscription.

## TODO

- [ ] Add tests ([#1])
- [ ] Automatically add `__typename` to query for `RANGE_ADD` subscriptions ([#12])

## Credits
Big thanks to [@taion](https://github.com/taion) for cleaning up my mess, creating a really nice API and these amazing docs :tada: 

[#1]: https://github.com/edvinerikson/relay-subscriptions/issues/1
[#12]: https://github.com/edvinerikson/relay-subscriptions/issues/12

[npm-badge]: https://img.shields.io/npm/v/relay-subscriptions.svg
[npm]: https://www.npmjs.org/package/relay-subscriptions

[discord-badge]: https://img.shields.io/badge/Discord-join%20chat%20%E2%86%92-738bd7.svg
[discord]: https://discord.gg/0ZcbPKXt5bX40xsQ
