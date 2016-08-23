/* @flow */

import printQuery from 'react-relay/lib/printRelayQuery';
import RelayQuery from 'react-relay/lib/RelayQuery';

import type { PrintedQuery, Variables } from './types';

export default class SubscriptionRequest {
  _printedQuery: ?PrintedQuery;
  _subscription: RelayQuery.Subscription;

  constructor(subscription: RelayQuery.Subscription) {
    this._printedQuery = null;
    this._subscription = subscription;
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
}
