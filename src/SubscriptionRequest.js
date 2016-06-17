import invariant from 'invariant';
import printQuery from './printQuery';

export type Subscription = {
  dispose(): void;
};

export default class SubscriptionRequest {
  _active: boolean;
  _disposable: ?Subscription;
  _disposed: boolean;
  _observers: Array<Function>;
  _observersCount: number;
  _printedQuery: ?PrintedQuery;
  _subscription: RelayQuery.Subscription;

  constructor(subscription: RelayQuery.Subscription) {
    this._active = true;
    this._disposable = null;
    this._disposed = false;
    this._observers = [];
    this._observersCount = 0;
    this._printedQuery = null;
    this._subscription = subscription;
  }

  getDebugName(): string {
    return this._subscription.getName();
  }

  getVariables(): Variables {
    if (!this._printedQuery) {
      this._printedQuery = printQuery(this._subscription);
    }
    return this._printedQuery.variables;
  }

  getQueryString(): string {
    if (!this._printedQuery) {
      this._printedQuery = printQuery(this._subscription);
    }
    return this._printedQuery.text;
  }

  subscribe(observer: Function): Subscription {
    invariant(
      this._active,
      'SubscriptionRequest: Cannot subscripe to disposed subscription.'
    );

    const observerIndex = this._observers.length;
    this._observers.push(observer);
    this._observersCount += 1;

    return {
      dispose: () => {
        invariant(
          this._observers[observerIndex],
          'SubscriptionRequest: Subscriptions may only be disposed once',
        );
        delete this._observers[observerIndex];
        this._observersCount -= 1;
        if (this._observersCount === 0) {
          this.dispose();
        }
      },
    };
  }

  dispose() {
    this._active = false;
    if (!this._disposed) {
      this._disposed = true;
      if (this._disposable) {
        this._disposable.dispose();
      }
    }
  }

  setDisposable(dispoable: Subscription): void {
    invariant(
      !this._disposable,
      'SubscriptionRequest: attempting to set dispoable more than once'
    );

    this._disposable = dispoable;

    if (this._disposed) {
      this._disposable.dispose();
    }
  }

  onNext(result: SubscriptionResult): void {
    if (this._active) {
      try {
        this._observers.forEach(observer => {
          if (observer.onNext) observer.onNext(result);
        });
      } catch (e) {
        this.dispose();
        throw e;
      }
    }
  }

  onError(error: any): void {
    if (this._active) {
      this._active = false;
      try {
        this._observers.forEach(observer => {
          if (observer.onError) observer.onError(error);
        });
      } finally {
        this.dispose();
      }
    }
  }

  onCompleted(): void {
    if (this._active) {
      this._active = false;
      try {
        this._observers.forEach(observer => {
          if (observer.onCompleted) observer.onCompleted();
        });
      } finally {
        this.dispose();
      }
    }
  }

  getSubscription(): RelayQuery.Subscription {
    return this._subscription;
  }
}
