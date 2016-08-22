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
    this._socket.on('connect', () => {
      this.setState({ isConnected: true });
    });
    this._socket.on('error', error => {
      this.setState({ isConnected: false });
      this._subscriptions.forEach(subscriptionRequest => {
        subscriptionRequest.onError(error);
      });
    });
  }

  componentWillUnmount() {
    this._socket.disconnect();
    this._subscriptions.forEach(subscriptionRequest => {
      subscriptionRequest.dispose();
    });
  }

  _subscriptions = [];

  subscribe = (subscriptionRequest, topic) => {
    const clientId = Math.random().toString(36).substr(0, 9);

    // when something disposes the subscription we kill it on the server too.
    subscriptionRequest.setDisposable({
      dispose: () => {
        console.log('requesting disposal of %s:%s', subscriptionRequest.getDebugName(), clientId);
        this._socket.emit('close subscription', { topic, id: clientId });
      },
    });
    // Keep a central reference to all subscriptions
    this._subscriptions.push(subscriptionRequest);

    // register the subscription on the server
    this._socket.emit('new subscription', {
      topic,
      id: clientId,
      query: subscriptionRequest.getQueryString(),
      variables: subscriptionRequest.getVariables(),
    });

    // receives subscription payloads
    this._socket.on(`subscription:${clientId}`, ({ type, data, errors }) => {
      if (type === 'response') {
        if (errors) {
          subscriptionRequest.onError(errors);
        } else {
          subscriptionRequest.onNext(data);
        }
      } else if (type === 'closed') {
        console.log('%s:%s is completed', subscriptionRequest.getDebugName(), clientId);
        subscriptionRequest.onCompleted();
        this._subscriptions.splice(this._subscriptions.indexOf(subscriptionRequest), 1);
      } else {
        console.log('Unknown type: %s', type);
      }
    });
  }

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
