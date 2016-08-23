/* @flow */

export type Variables = {[name: string]: mixed};
export type RelayConcreteNode = {[name: string]: mixed};

export type MutationConfig = {
  type: string;
  [name: string]: mixed;
};

export type PrintedQuery = {
  text: string;
  variables: Variables;
};

export type SubscriptionResult = {[name: string]: mixed};

export type SubscriptionObserver = {
  onNext?: (value: SubscriptionResult) => void;
  onError?: (error: any) => void;
  onCompleted?: (value: any) => void;
}

export type SubscriptionRequestObserver = {
  onNext: (value: SubscriptionResult) => void;
  onError: (error: any) => void;
  onCompleted: (value: any) => void;
}

export type SubscriptionDisposable = {
  dispose: () => void;
}
