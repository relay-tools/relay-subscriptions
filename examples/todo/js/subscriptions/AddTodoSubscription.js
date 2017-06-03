import Relay from 'react-relay/classic';
import { Subscription } from 'relay-subscriptions';

import Todo from '../components/Todo';

export default class AddTodoSubscription extends Subscription {
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
              ${Todo.getFragment('todo')}
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

  getVariables() {
    return {};
  }
}
