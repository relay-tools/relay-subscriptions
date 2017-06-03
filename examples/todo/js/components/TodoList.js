/**
 * This file provided by Facebook is for non-commercial testing and evaluation
 * purposes only.  Facebook reserves all rights not expressly granted.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL
 * FACEBOOK BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN
 * ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
 * CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

import React from 'react';
import Relay from 'react-relay/classic';

import MarkAllTodosMutation from '../mutations/MarkAllTodosMutation';
import Todo from './Todo';

class TodoList extends React.Component {
  static propTypes = {
    viewer: React.PropTypes.object.isRequired,
    relay: React.PropTypes.object.isRequired,
  };

  _handleMarkAllChange = (e) => {
    const { relay, viewer } = this.props;
    relay.commitUpdate(
      new MarkAllTodosMutation({
        todos: viewer.todos,
        viewer,
        complete: e.target.checked,
      }),
    );
  };

  render() {
    const { viewer, relay } = this.props;
    const numTodos = viewer.totalCount;
    const numCompletedTodos = viewer.completedCount;

    return (
      <section className="main">
        <input
          checked={numTodos === numCompletedTodos}
          className="toggle-all"
          onChange={this._handleMarkAllChange}
          type="checkbox"
        />
        <label htmlFor="toggle-all">
          Mark all as complete
        </label>
        <ul className="todo-list">
          {viewer.todos.edges.map(edge => (
            <Todo
              key={edge.node.id}
              todo={edge.node}
              viewer={viewer}
              pending={relay.hasOptimisticUpdate(edge)}
            />
          ))}
        </ul>
      </section>
    );
  }
}

export default Relay.createContainer(TodoList, {
  initialVariables: {
    status: null,
  },

  prepareVariables({ status }) {
    let nextStatus;
    if (status === 'active' || status === 'completed') {
      nextStatus = status;
    } else {
      // This matches the Backbone example, which displays all todos on an
      // invalid route.
      nextStatus = 'any';
    }
    return {
      status: nextStatus,
    };
  },

  fragments: {
    viewer: () => Relay.QL`
      fragment on User {
        completedCount
        todos(
          status: $status
          first: 2147483647  # max GraphQLInt
        ) {
          edges {
            node {
              id
              ${Todo.getFragment('todo')}
            }
          }
          ${MarkAllTodosMutation.getFragment('todos')}
        }
        totalCount
        ${MarkAllTodosMutation.getFragment('viewer')}
        ${Todo.getFragment('viewer')}
      }
    `,
  },
});
