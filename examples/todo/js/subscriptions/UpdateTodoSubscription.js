import Relay from 'react-relay';
import { Subscription } from 'relay-subscriptions';

import Todo from '../components/Todo';

export default class UpdateTodoSubscription extends Subscription {
  static fragments = {
    todo: () => Relay.QL`
      fragment on Todo {
        id
      }
    `,
  };

  getSubscription() {
    return Relay.QL`
      subscription {
        updateTodoSubscription(input: $input) {
          todo {
            ${Todo.getFragment('todo')}
          }
          viewer {
            id
            completedCount
          }
        }
      }
    `;
  }

  getVariables() {
    return {
      id: this.props.todo.id,
    };
  }

  getConfigs() {
    return [{
      type: 'FIELDS_CHANGE',
      fieldIDs: {
        todo: this.props.todo.id,
      },
    }];
  }
}
