/* eslint-disable no-console */

import React, { Component, PropTypes } from 'react';
import { SubscriptionProvider } from 'relay-subscriptions';
import io from 'socket.io-client';

// most of this is implementation details. You can solve this however you want
export default class Root extends Component {
  static propTypes = {
    environment: PropTypes.object.isRequired,
    children: PropTypes.element,
  };

  componentDidMount() {
    this._socket = io();

    // receives subscription payloads
    this._socket.on('subscription update', ({ id, data, errors }) => {
      const subscriptionRequest = this._subscriptionRequests[id];
      if (!subscriptionRequest) return;

      if (errors) {
        subscriptionRequest.onError(errors);
      } else {
        subscriptionRequest.onNext(data);
      }
    });

    this._socket.on('subscription closed', (id) => {
      const subscriptionRequest = this._subscriptionRequests[id];
      if (!subscriptionRequest) return;

      console.log('%s:%s is completed', subscriptionRequest.getDebugName(), id);
      subscriptionRequest.onCompleted();
      delete this._subscriptionRequests[id];
    });

    this._socket.on('error', (error) => {
      Object.values(this._subscriptionRequests).forEach((subscriptionRequest) => {
        subscriptionRequest.onError(error);
      });
    });
  }

  componentWillUnmount() {
    this._socket.disconnect();

    this._subscriptions.forEach(subscriptionRequest => {
      subscriptionRequest.onCompleted();
    });
  }

  _subscriptionRequests = {};

  subscribe = (subscriptionRequest) => {
    const id = subscriptionRequest.getClientSubscriptionId();

    // when something disposes the subscription we kill it on the server too.
    subscriptionRequest.setDisposable({
      dispose: () => {
        console.log('requesting disposal of %s:%s', subscriptionRequest.getDebugName(), id);
        this._socket.emit('close subscription', id);
      },
    });

    // Keep a central reference to all subscriptions
    this._subscriptionRequests[id] = subscriptionRequest;

    // register the subscription on the server
    this._socket.emit('new subscription', {
      id,
      query: subscriptionRequest.getQueryString(),
      variables: subscriptionRequest.getVariables(),
    });
  };

  render() {
    return (
      <SubscriptionProvider
        environment={this.props.environment}
        subscribe={this.subscribe}
      >
        {this.props.children}
      </SubscriptionProvider>
    );
  }
}
