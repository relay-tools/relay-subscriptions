/* @flow */

import invariant from 'invariant';
import RelayMetaRoute from 'react-relay/lib/RelayMetaRoute';
import { Mutation as RelayMutation } from 'react-relay';


import type {
  RelayEnvironment,
  Variables,
  RelayConcreteNode,
  MutationConfig,
} from './types';

export default class Subscription<Tp: Object> {
  static name: string;
  static initialVariables: Variables;
  static prepareVariables: ?(
    prevVariables: Variables,
    route: RelayMetaRoute
  ) => Variables;

  props: Tp;
  _unresolvedProps: Tp;
  _environment: RelayEnvironment;
  _didShowFakeDataWarning: boolean;
  _didValidateConfig: boolean;

  constructor(props: Tp) {
    this._didShowFakeDataWarning = false;
    this._didValidateConfig = false;
    this._unresolvedProps = props;
  }

  static getFragment(fragmentName: string, variableMapping): any {
    return RelayMutation.getFragment.call(
      this,
      fragmentName,
      variableMapping
    );
  }

  bindEnvironment(environment: RelayEnvironment): void {
    RelayMutation.prototype.bindEnvironment.call(this, environment);
  }

  getSubscription(): RelayConcreteNode {
    invariant(
      false,
      '%s: Expected abstract method `getSubscription` to be implemented',
      this.constructor.name
    );
  }

  getConfigs(): Array<MutationConfig> {
    invariant(
      false,
      '%s: Expected abstract method `getConfigs` to be implemented',
      this.constructor.name
    );
  }

  getVariables(): Variables {
    invariant(
      false,
      '%s: Expected abstract method `getVariables` to be implemented',
      this.constructor.name
    );
  }

  _resolveProps(): void {
    RelayMutation.prototype._resolveProps.call(this);
  }
}
