/* @flow */

import isEqual from 'lodash/isEqual';
import PropTypes from 'prop-types';
import React from 'react';
import Relay from 'react-relay/classic';
import type { RelayContainerSpec } from 'react-relay/lib/RelayContainer';

import type Subscription from './Subscription';
import type { SubscriptionDisposable } from './types';

type subscriptionFn = (props: Object) => ?Subscription<any>;

type ActiveSubscription = {
  subscription: Subscription<any>,
  disposable: SubscriptionDisposable,
}

function disposeActiveSubscription(activeSubscription) {
  if (!activeSubscription) {
    return;
  }

  activeSubscription.disposable.dispose();
}

function subscribe(
  Component: ReactClass<any>,
  subscriptionsSpec: ?Array<subscriptionFn>,
) {
  const componentName = Component.displayName || Component.name || 'Component';

  return class Subscribe extends React.Component {
    static displayName = `Subscribe(${componentName})`;

    static propTypes = {
      relay: PropTypes.object.isRequired,
    };

    static contextTypes = {
      relay: Relay.PropTypes.ClassicRelay,
    };

    relayProp: mixed;
    activeSubscriptions: Array<?ActiveSubscription>;

    constructor(props, context) {
      super(props, context);

      this.relayProp = this.makeRelayProp(props);
      this.activeSubscriptions = [];
    }

    componentDidMount() {
      if (subscriptionsSpec) {
        subscriptionsSpec.forEach((createSubscription) => {
          this.activeSubscriptions.push(
            this.makeActiveSubscription(createSubscription(this.props)),
          );
        });
      }
    }

    componentWillReceiveProps(nextProps) {
      if (nextProps.relay !== this.props.relay) {
        this.relayProp = this.makeRelayProp(nextProps);
      }

      if (subscriptionsSpec) {
        subscriptionsSpec.forEach((createSubscription, index) => {
          const activeSubscription = this.activeSubscriptions[index];
          const nextSubscription = createSubscription(nextProps);

          if (!this.areSubscriptionsEqual(
            activeSubscription,
            nextSubscription,
          )) {
            disposeActiveSubscription(activeSubscription);
            this.activeSubscriptions[index] =
              this.makeActiveSubscription(nextSubscription);
          }
        });
      }
    }

    componentWillUnmount() {
      if (subscriptionsSpec) {
        this.activeSubscriptions.forEach(disposeActiveSubscription);
      }
    }

    makeRelayProp(props) {
      return {
        ...props.relay,
        subscribe: this.context.relay.environment.subscribe,
      };
    }

    makeActiveSubscription(subscription) {
      if (!subscription) {
        return null;
      }

      return {
        subscription,
        disposable: this.context.relay.environment.subscribe(subscription),
      };
    }

    areSubscriptionsEqual(activeSubscription, nextSubscription) {
      if (!nextSubscription && !activeSubscription) {
        // Both old and new are falsy.
        return true;
      }

      if (!nextSubscription || !activeSubscription) {
        // Only one of the pair is falsy.
        return false;
      }

      const subscription = activeSubscription.subscription;

      if (nextSubscription.constructor !== subscription.constructor) {
        // Subscriptions are of different types.
        return false;
      }

      // Need to bind subscription to Relay environment to get variables.
      nextSubscription.bindEnvironment(this.context.relay.environment);

      // Check if variables match.
      return isEqual(
        nextSubscription.getVariables(),
        subscription.getVariables(),
      );
    }

    render() {
      return (
        <Component
          {...this.props}
          relay={this.relayProp}
        />
      );
    }
  };
}

export default function createContainer(
  Component: ReactClass<any>,
  spec: RelayContainerSpec & { subscriptions?: subscriptionFn[] },
) {
  return Relay.createContainer(
    subscribe(Component, spec.subscriptions),
    spec
  );
}
