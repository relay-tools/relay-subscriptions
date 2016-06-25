/* @flow */
import { Environment } from 'react-relay';

export type Variables = {[name: string]: mixed};
export type RelayConcreteNode = {[name: string]: mixed};
export type RelayEnvironment = typeof Environment;
export type SubscriptionResult = {[name: string]: mixed};

export type Subscription = {
  dispose(): void;
};

export type PrintedQuery = {
  text: string;
  variables: Variables;
};

export type MutationConfig = {
  type: string;
  [name: string]: mixed;
};
