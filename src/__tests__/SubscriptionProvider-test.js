jest.unmock('../SubscriptionProvider');

import { shallow } from 'enzyme';
import React from 'react';

import SubscriptionProvider from '../SubscriptionProvider';

describe('SubscriptionProvider', () => {
  it('warns when no environment is supplied', () => {
    const wrapper = shallow(
      <SubscriptionProvider subscribe={() => {}}>
        <p />
      </SubscriptionProvider>
    );

    const error = new Error(
      'SubscriptionProvider: RelayEnvironment could not be found. ' +
      'Please render the SubscriptionProvider under a RelayRenderer ' +
      'or provide the `environment` prop'
    );
    error.name = 'Invariant Violation';

    const instance = wrapper.instance();
    expect(() => instance.getEnvironment()).toThrow(error);
  });

  it('does not warn when environment is supplied as prop', () => {
    const wrapper = shallow(
      <SubscriptionProvider
        subscribe={() => {}}
        environment={{}}
      >
        <p />
      </SubscriptionProvider>
    );

    const instance = wrapper.instance();
    expect(() => instance.getEnvironment()).not.toThrow();
  });
});
