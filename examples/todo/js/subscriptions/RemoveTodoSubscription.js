import Relay from 'react-relay';
import * as RelaySubscriptions from 'relay-subscriptions';

export default class RemoveTodoSubscription extends RelaySubscriptions.Subscription {
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
        removeTodoSubscription(input: $input) {
          deletedTodoId
          viewer {
            completedCount
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
      type: 'NODE_DELETE',
      parentName: 'viewer',
      parentID: this.props.viewer.id,
      connectionName: 'todos',
      deletedIDFieldName: 'deletedTodoId',
    }];
  }
}
