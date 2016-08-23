/* @flow */

import React from 'react';
import Relay from 'react-relay';
import type { RelayContainerSpec } from 'react-relay/lib/RelayContainer';

function subscribe(Component) {
  const componentName = Component.displayName || Component.name || 'Component';

  return class Subscribe extends React.Component {
    static displayName = `Subscribe(${componentName})`;

    static propTypes = {
      relay: React.PropTypes.object.isRequired,
    };

    static contextTypes = {
      relay: Relay.PropTypes.Environment,
    };

    relayProp: mixed;

    constructor(props, context) {
      super(props, context);

      this.makeRelayProp(props);
    }

    componentWillReceiveProps(nextProps) {
      if (nextProps.relay !== this.props.relay) {
        this.makeRelayProp(nextProps);
      }
    }

    makeRelayProp(props) {
      this.relayProp = {
        ...props.relay,
        subscribe: this.context.relay.subscribe,
      };
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
  spec: RelayContainerSpec
) {
  return Relay.createContainer(subscribe(Component), spec);
}
