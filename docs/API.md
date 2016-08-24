# API Reference

- [Network layer](#network-layer)
- [RelaySubscriptions.Environment](#relaysubscriptionsenvironment)
- [Subscription](#subscription)
- [RelaySubscriptions.createContainer](#relaysubscriptionscreatecontainer)

## Network layer

You must implement a network layer that connects to a backend with subscription support. This network layer must implement the following additional method:

```js
sendSubscription: (request: SubscriptionRequest) => Disposable
```

The `SubscriptionRequest` object supports:

```js
type SubscriptionRequest {
  getQueryString: () => string;
  getVariables: () => Variables;
  getClientSubscriptionId: () => string;

  onNext: (payload: SubscriptionResult) => void;
  onError: (error: any) => void;
  onCompleted: (value: any) => void;

  getDebugName: () => string;
}
```

The `getQueryString` method returns the GraphQL query string. The `getVariables` method returns the variables for the query. The `getClientSubscriptionId` method returns a client-side ID for the subscription.

Call the `onNext`, `onError`, and `onCompleted` methods when the subscription updates.

The return value is expected to conform to:

```js
type Disposable = {
  dispose: () => void;
}
```

The `dispose` method should tear down the subscription.

## `RelaySubscriptions.Environment`

`RelaySubscriptions.Environment` extends `Relay.Environment` and provides subscription support.

### `subscribe`

This method has the signature:

```js
subscribe: (subscription: Subscription, observer?: Observer) => Disposable
```

This method will make the subscription.

The observer, if provided, is expected to conform to:

```js
type Observer = {
  onNext?: (value: SubscriptionResult) => void;
  onError?: (error: any) => void;
  onCompleted?: (value: any) => void;
}
```

The specified callbacks will be invoked when the subscription updates. The `onNext` callback fires after the store update.

## `Subscription`

Subclass the `Subscription` class to define a subscription. This base class is similar to `Relay.Mutation`, except that you need to implement `getSubscription` instead of `getMutation` and `getFatQuery`.

```js
import { Subscription } from 'relay-subscriptions';

export default class WidgetSubscription extends Subscription {
  /* ... */
}
```

### `constructor`

As with `Relay.Mutation`, you can construct an instance of a subclass of `Subscription` with the `new` keyword and optional props.

```js
new WidgetSubscription({ widget })
```

### Static properties

Define these properties to specify the input data dependencies for the subscription.

#### `fragments`

This static property defines the subscription's data requirements as a object of fragment builders, as with the `fragments` static property on `Relay.Mutation`. These fragments can then be composed elsewhere with `MySubscription.getFragment(fragmentName)`.

```js
static fragments = {
  widget: () => Relay.QL`
    fragment on Widget {
      id
    }
  },
};
```

#### `initialVariables`

If provided, this specifies the default variables for the fragment builders, as with the `initialVariables` static property on `Relay.Mutation`.

#### `prepareVariables`

If provided, this method modifies variables for the fragment builders, as with the `prepareVariables` static method on `Relay.Mutation`.

### Abstract methods

Implement these methods to define the subscription's behavior.

#### `getSubscription`

This method should return the concrete subscription query. The query should use the `$input` variable for the subscription input. Unlike with mutations, this is not a fat query, so it must specify all desired fields. You can compose in fragments from container components here, which can help manage code duplication.

```js
getSubscription() {
  return Relay.QL`
    subscription {
      updateWidget(input: $input) {
        ${Widget.getFragment('widget')}
      }
    }
  `;
}
```

#### `getConfigs`

This method should return the mutation configs, as with the `getConfigs` method on `Relay.Mutation`.

```js
getConfigs() {
  return [{
    type: 'FIELDS_CHANGE',
    fieldIDs: {
      widget: this.props.widget.id,
    },
  }];
}
```

#### `getVariables`

This method should return the subscription input variables, as with the `getVariables` method on `Relay.Mutation`.

```js
getVariables() {
  return {
    id: this.props.widget.id,
  };
}
```

## `RelaySubscriptions.createContainer`

`RelaySubscriptions.createContainer` behaves like `Relay.createContainer`. It provides additional functionality for subscription support.

### Container specification

#### `subscriptions`

The specification for a Relay Subscriptions container accepts an optional `subscriptions` property:

```js
subscriptions?: subscriptionFn[]
```

These subscription functions are expected to have the signature:

```js
type subscriptionFn = (props: Object) => ?Subscription<any>;
```

This function can return a falsy value to indicate that no subscription is desired.

The Relay Subscriptions container will manage these subscriptions. It will establish the subscription after the component mounts, replace any subscriptions that have changed type or variables, and tear down these subscriptions when the component unmounts.

```js
import RelaySubscriptions from 'relay-subscriptions';

/* ... */

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
    ({ pending, widget }) => !pending && new WidgetSubscription({ widget }),
  ],
});
```

### `props.relay`

The Relay Subscriptions container injects an augmented `props.relay` to the component with subscription functionality.

#### `subscribe`

This method invokes the `subscribe` method on the Relay Subscriptions environment. It has the same signature of:

```js
subscribe: (subscription: Subscription, observer?: Observer) => Disposable
```

You can use this to manually manage the subscription.

```js
import RelaySubscriptions from 'relay-subscriptions';

/* ... */

class Widget extends React.Component {
  componentDidMount() {
    const { relay, widget } = this.props;
    this.subscription = relay.subscribe(
      new WidgetSubscription({ widget }),
    );
  }

  componentWillUnmount() {
    this.subscription.dispose();
  }

  /* ... */
}

export default RelaySubscriptions.createContainer(Widget, {
  fragments: {
    widget: () => Relay.QL`
      fragment on Widget {
        # ...
        ${WidgetSubscription.getFragment('widget')}
      }
    `,
  },
});
```
