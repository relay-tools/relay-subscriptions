jest.unmock('../SubscriptionContainer');

import { shallow } from 'enzyme';
import React from 'react';

import createSubscriptionContainer from '../SubscriptionContainer';

describe('SubscriptionContainer', () => {
  let Child;
  let Container;

  beforeEach(() => {
    Child = () => <span />;
    Container = createSubscriptionContainer(Child);
  });

  it('provides "subscriptions" to the children as a prop', () => {
    const wrapper = shallow(<Container />, { context: { subscriptions: {} } });
    expect(wrapper.find(Child).props().subscriptions).toEqual(jasmine.any(Object));
  });

  it('passes props to children', () => {
    const wrapper = shallow(<Container foo="bar" />, { context: { subscriptions: {} } });
    expect(wrapper.find(Child).props().foo).toEqual('bar');
  });
});
