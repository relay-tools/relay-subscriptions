jest.mock('react-relay/lib/RelayContainer', () => ({
  create: (Component) => {
    Component.isRelayContainer = true; // eslint-disable-line no-param-reassign
    return Component;
  },
}));

import { mount } from 'enzyme';
import React from 'react';

import RelaySubscriptions from '../../';

describe('createContainer', () => {
  it('should support relay.subscribe', () => {
    const environment = new RelaySubscriptions.Environment();
    spyOn(environment, 'subscribe');

    const dummySubscription = new RelaySubscriptions.Subscription();

    class Widget extends React.Component {
      static propTypes = {
        relay: React.PropTypes.object.isRequired,
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
        relay: environment,
      },
    });
    expect(environment.subscribe).toHaveBeenCalledWith(dummySubscription);
  });
});
