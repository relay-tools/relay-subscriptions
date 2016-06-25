import React, { PropTypes } from 'react';

export default function SubscriptionContainerHOC(Component) {
  const SubscriptionContainer = (props, { subscriptions }) => (
    <Component
      {...props}
      subscriptions={subscriptions}
    />
  );
  const componentName = Component.displayName || Component.name;
  SubscriptionContainer.displayName = `SubscriptionContainer(${componentName})`;
  SubscriptionContainer.contextTypes = {
    subscriptions: PropTypes.object.isRequired,
  };
  return SubscriptionContainer;
}
