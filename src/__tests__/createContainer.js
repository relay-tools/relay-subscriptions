jest.mock('react-relay/lib/RelayContainer', () => ({
  create: (Component) => {
    Component.isRelayContainer = true; // eslint-disable-line no-param-reassign
    return Component;
  },
}));

import { mount } from 'enzyme';
import PropTypes from 'prop-types';
import React from 'react';

import RelaySubscriptions from '..';

describe('createContainer', () => {
  it('should support relay.subscribe', () => {
    const environment = new RelaySubscriptions.Environment();
    spyOn(environment, 'startSubscription');

    const dummySubscription = new RelaySubscriptions.Subscription();

    class Widget extends React.Component {
      static propTypes = {
        relay: PropTypes.object.isRequired,
      };

      componentDidMount() {
        this.props.relay.subscribe(dummySubscription);
      }

      render() {
        return null;
      }
    }

    const WidgetContainer = RelaySubscriptions.createContainer(Widget, {});
    expect(WidgetContainer.isRelayContainer).toBe(true);

    mount(<WidgetContainer relay={{}} />, {
      context: {
        relay: {
          environment,
          variables: {},
        },
      },
    });
    expect(environment.startSubscription).toHaveBeenCalledWith(dummySubscription);
  });
});
