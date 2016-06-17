// @flow

import RelayFragmentPointer from 'react-relay/lib/RelayFragmentPointer';
import RelayFragmentReference from 'react-relay/lib/RelayFragmentReference';
import RelayMetaRoute from 'react-relay/lib/RelayMetaRoute';
import RelayQuery from 'react-relay/lib/RelayQuery';
import RelayRecord from 'react-relay/lib/RelayRecord';
import buildRQL from 'react-relay/lib/buildRQL';
import forEachObject from 'fbjs/lib/forEachObject';
import invariant from 'invariant';
import warning from 'warning';

export default class Subscription<Tp: Object> {
  props: Tp;
  _unresolvedProps: Tp;
  _environment: RelayEnvironmentInterface;
  constructor(props: Tp) {
    this._unresolvedProps = props;
  }

  bindEnvironment(environment: RelayEnvironmentInterface): void {
    if (!this._environment) {
      this._environment = environment;
      this._resolveProps();
    } else {
      invariant(
        environment === this._environment,
        '%s: Subscription instance cannot be used in different Relay environments.',
        this.constructor.name
      );
    }
  }

  getSubscription(): RelayConcreteNode {
    invariant(
      false,
      '%s: Expected abstract method `getSubscription` to be implemented',
      this.constructor.name
    );
  }

  getConfigs(): Array<SubscriptionConfig> {
    invariant(
      false,
      '%s: Expected abstract method `getConfigs` to be implemented',
      this.constructor.name
    );
  }

  getVariables(): {[name: string]: mixed} {
    invariant(
      false,
      '%s: Expected abstract method `getVariables` to be implemented',
      this.constructor.name
    );
  }

  _resolveProps(): void {
    const fragments = this.constructor.fragments;
    const initialVariables = this.constructor.initialVariables || {};

    const props = this._unresolvedProps;
    const resolvedProps = {...props};
    forEachObject(fragments, (fragmentBuilder, fragmentName) => {
      const propValue = props[fragmentName];
      warning(
        propValue !== undefined,
        'RelayMutation: Expected data for fragment `%s` to be supplied to ' +
        '`%s` as a prop. Pass an explicit `null` if this is intentional.',
        fragmentName,
        this.constructor.name
      );

      if (propValue == null) {
        return;
      }
      if (typeof propValue !== 'object') {
        warning(
          false,
          'RelayMutation: Expected data for fragment `%s` supplied to `%s` ' +
          'to be an object.',
          fragmentName,
          this.constructor.name
        );
        return;
      }

      const fragment = RelayQuery.Fragment.create(
        buildMutationFragment(
          this.constructor.name,
          fragmentName,
          fragmentBuilder,
          initialVariables
        ),
        RelayMetaRoute.get(`$RelayMutation_${this.constructor.name}`),
        initialVariables
      );

      if (fragment.isPlural()) {
        invariant(
          Array.isArray(propValue),
          'RelayMutation: Invalid prop `%s` supplied to `%s`, expected an ' +
          'array of records because the corresponding fragment is plural.',
          fragmentName,
          this.constructor.name
        );
        const dataIDs = propValue.map((item, ii) => {
          invariant(
            typeof item === 'object' && item != null,
            'RelayMutation: Invalid prop `%s` supplied to `%s`, ' +
            'expected element at index %s to have query data.',
            fragmentName,
            this.constructor.name,
            ii
          );
          const dataID = RelayRecord.getDataIDForObject(item);
          invariant(
            dataID,
            'RelayMutation: Invalid prop `%s` supplied to `%s`, ' +
            'expected element at index %s to have query data.',
            fragmentName,
            this.constructor.name,
            ii
          );
          return dataID;
        });

        resolvedProps[fragmentName] = dataIDs.map(
          dataID => this._environment.read(fragment, dataID)
        );
      } else {
        invariant(
          !Array.isArray(propValue),
          'RelayMutation: Invalid prop `%s` supplied to `%s`, expected a ' +
          'single record because the corresponding fragment is not plural.',
          fragmentName,
          this.constructor.name
        );
        const dataID = RelayRecord.getDataIDForObject(propValue);
        if (dataID) {
          resolvedProps[fragmentName] = this._environment.read(
            fragment,
            dataID
          );
        }
      }
    });
    this.props = resolvedProps;
  }
}

/**
 * Wrapper around `buildRQL.Fragment` with contextual error messages.
 */
function buildMutationFragment(
  mutationName: string,
  fragmentName: string,
  fragmentBuilder: RelayQLFragmentBuilder,
  variables: Variables
): ConcreteFragment {
  const fragment = buildRQL.Fragment(
    fragmentBuilder,
    variables
  );
  invariant(
    fragment,
    'Relay.QL defined on mutation `%s` named `%s` is not a valid fragment. ' +
    'A typical fragment is defined using: Relay.QL`fragment on Type {...}`',
    mutationName,
    fragmentName
  );
  return fragment;
}
