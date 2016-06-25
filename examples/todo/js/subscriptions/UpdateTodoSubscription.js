import Relay from 'react-relay';
import * as RelaySubscriptions from 'relay-subscriptions';

export default class UpdateTodoSubscription extends RelaySubscriptions.Subscription {
  static fragments = {
    todo: () => Relay.QL`
    fragment on Todo {
      id
    }`,
  };
  getSubscription() {
    return Relay.QL`subscription {
      updateTodoSubscription {
        clientMutationId
        todo {
          id
          text
          complete
        }
        viewer {
          id
          completedCount
        }
      }
    }`;
  }
  getVariables() {
    return {};
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
