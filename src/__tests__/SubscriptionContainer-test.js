jest.unmock('../SubscriptionContainer');

import React from 'react';
import { shallow } from 'enzyme';
import createSubscriptionContainer from '../SubscriptionContainer';


describe('SubscriptionContainer', () => {
  let Child = null;
  let Container = null;
  beforeEach(() => {
    Child = () => <span />;
    Container = createSubscriptionContainer(Child);
  });

  it('provides "subscriptions" to the children as a prop', () => {
    const wrapper = shallow(<Container />, { context: { subscriptions: {} } });
    expect(wrapper.find(Child).props().subscriptions).toEqual(jasmine.any(Object));
  });

  it('passes props to children', () => {
    const wrapper = shallow(<Container foo="bar" />);
    expect(wrapper.find(Child).props().foo).toEqual('bar');
  });
});
