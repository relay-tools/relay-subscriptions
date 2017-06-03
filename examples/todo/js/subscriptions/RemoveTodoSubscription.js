import Relay from 'react-relay/classic';
import { Subscription } from 'relay-subscriptions';

export default class RemoveTodoSubscription extends Subscription {
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

  getConfigs() {
    return [{
      type: 'NODE_DELETE',
      parentName: 'viewer',
      parentID: this.props.viewer.id,
      connectionName: 'todos',
      deletedIDFieldName: 'deletedTodoId',
    }];
  }

  getVariables() {
    return {};
  }
}
