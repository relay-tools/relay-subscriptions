/* @flow */

import printQuery from 'react-relay/lib/printRelayQuery';
import RelayQuery from 'react-relay/lib/RelayQuery';

import type {
  PrintedQuery,
  SubscriptionObserver,
  SubscriptionResult,
  Variables,
} from './types';

export default class SubscriptionRequest {
  _printedQuery: ?PrintedQuery;
  _subscription: RelayQuery.Subscription;
  _observer: SubscriptionObserver;

  constructor(
    subscription: RelayQuery.Subscription,
    observer: SubscriptionObserver,
  ) {
    this._printedQuery = null;
    this._subscription = subscription;
    this._observer = observer;
  }

  getDebugName(): string {
    return this._subscription.getName();
  }

  getVariables(): Variables {
    return this._getPrintedQuery().variables;
  }

  getQueryString(): string {
    return this._getPrintedQuery().text;
  }

  _getPrintedQuery(): PrintedQuery {
    if (!this._printedQuery) {
      this._printedQuery = printQuery(this._subscription);
    }

    return this._printedQuery;
  }

  getClientSubscriptionId(): string {
    return this._subscription.getVariables().input.clientSubscriptionId;
  }

  onNext(payload: SubscriptionResult) {
    this._observer.onNext(payload);
  }

  onError(error: any) {
    this._observer.onError(error);
  }

  onCompleted(value: any) {
    this._observer.onCompleted(value);
  }
}
