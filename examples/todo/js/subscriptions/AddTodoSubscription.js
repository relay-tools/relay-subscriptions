import Relay from 'react-relay';
import RelaySubscriptions from 'relay-subscriptions';

export default class AddTodoSubscription extends RelaySubscriptions.Subscription {
  static fragments = {
    viewer: () => Relay.QL`
      fragment on User {
        id
      }
    `,
  };

  getSubscription() {
    return Relay.QL`
      subscription {
        addTodoSubscription(input: $input) {
          todoEdge {
            __typename
            node {
              id
              text
              complete
            }
          }
          viewer {
            id
            totalCount
          }
        }
      }
    `;
  }

  getVariables() {
    return {};
  }

  getConfigs() {
    return [{
      type: 'RANGE_ADD',
      parentName: 'viewer',
      parentID: this.props.viewer.id,
      connectionName: 'todos',
      edgeName: 'todoEdge',
      rangeBehaviors: () => 'append',
    }];
  }
}
