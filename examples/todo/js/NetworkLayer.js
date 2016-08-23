/* eslint-disable no-console */

import invariant from 'invariant';
import Relay from 'react-relay';
import io from 'socket.io-client';

export default class NetworkLayer extends Relay.DefaultNetworkLayer {
  constructor(...args) {
    super(...args);

    this._socket = io();
    this._observers = {};

    this._socket.on('subscription update', ({ id, data, errors }) => {
      const observer = this._observers[id];
      if (!observer) return;

      if (errors) {
        observer.onError(errors);
      } else {
        observer.onNext(data);
      }
    });

    this._socket.on('subscription closed', (id) => {
      const observer = this._observers[id];
      if (!observer) {
        return;
      }

      console.log(`Subscription ${id} is completed`);
      observer.onCompleted();
      delete this._observers[id];
    });

    this._socket.on('error', (error) => {
      Object.values(this._observers).forEach((observer) => {
        observer.onError(error);
      });
    });
  }

  sendSubscription(request) {
    const id = request.getClientSubscriptionId();

    return {
      subscribe: (observer) => {
        invariant(
          !this._observers[id],
          `Subscription ${id} already has an observer.`
        );

        this._observers[id] = observer;

        this._socket.emit('subscribe', {
          id,
          query: request.getQueryString(),
          variables: request.getVariables(),
        });

        return {
          dispose: () => {
            console.log(`disposing ${request.getDebugName()}:${id}`);
            this._socket.emit('unsubscribe', id);
          },
        };
      },
    };
  }

  disconnect() {
    this._socket.disconnect();

    this._observers.forEach(observer => {
      observer.onCompleted();
    });
  }
}
