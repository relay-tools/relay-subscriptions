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
import Relay from 'react-relay';
import * as RelaySubscriptions from 'relay-subscriptions';

import AddTodoMutation from '../mutations/AddTodoMutation';
import AddTodoSubscription from '../subscriptions/AddTodoSubscription';
import RemoveTodoSubscription from '../subscriptions/RemoveTodoSubscription';
import TodoListFooter from './TodoListFooter';
import TodoTextInput from './TodoTextInput';

class TodoApp extends React.Component {
  static propTypes = {
    viewer: React.PropTypes.object.isRequired,
    relay: React.PropTypes.object.isRequired,
    subscriptions: React.PropTypes.object.isRequired,
    children: React.PropTypes.node.isRequired,
  };

  componentDidMount() {
    const subscribe = this.props.subscriptions.subscribe;
    this._addSubscription = subscribe(
      new AddTodoSubscription({ viewer: this.props.viewer })
    );
    this._removeSubscription = subscribe(
      new RemoveTodoSubscription({ viewer: this.props.viewer })
    );
  }

  componentWillUnmount() {
    if (this._addSubscription) this._addSubscription.dispose();
    if (this._removeSubscription) this._removeSubscription.dispose();
  }

  _handleTextInputSave = (text) => {
    this.props.relay.commitUpdate(
      new AddTodoMutation({ text, viewer: this.props.viewer })
    );
  };

  render() {
    const hasTodos = this.props.viewer.totalCount > 0;

    return (
      <div>
        <section className="todoapp">
          <header className="header">
            <h1>
              todos
            </h1>
            <TodoTextInput
              autoFocus
              className="new-todo"
              onSave={this._handleTextInputSave}
              placeholder="What needs to be done?"
            />
          </header>

          {this.props.children}

          {hasTodos &&
            <TodoListFooter
              todos={this.props.viewer.todos}
              viewer={this.props.viewer}
            />
          }
        </section>
        <footer className="info">
          <p>
            Double-click to edit a todo
          </p>
          <p>
            Created by the <a href="https://facebook.github.io/relay/">
              Relay team
            </a>
          </p>
          <p>
            Part of <a href="http://todomvc.com">TodoMVC</a>
          </p>
        </footer>
      </div>
    );
  }
}

export default Relay.createContainer(RelaySubscriptions.createSubscriptionContainer(TodoApp), {
  fragments: {
    viewer: () => Relay.QL`
      fragment on User {
        totalCount
        ${AddTodoMutation.getFragment('viewer')}
        ${TodoListFooter.getFragment('viewer')}
        ${AddTodoSubscription.getFragment('viewer')}
        ${RemoveTodoSubscription.getFragment('viewer')}
      }
    `,
  },
});
