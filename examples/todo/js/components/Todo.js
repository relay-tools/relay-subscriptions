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

import classnames from 'classnames';
import React from 'react';
import Relay from 'react-relay';
import * as RelaySubscriptions from 'relay-subscriptions';

import ChangeTodoStatusMutation from '../mutations/ChangeTodoStatusMutation';
import RemoveTodoMutation from '../mutations/RemoveTodoMutation';
import RenameTodoMutation from '../mutations/RenameTodoMutation';
import UpdateTodoSubscription from '../subscriptions/UpdateTodoSubscription';
import TodoTextInput from './TodoTextInput';

class Todo extends React.Component {
  static propTypes = {
    viewer: React.PropTypes.object.isRequired,
    todo: React.PropTypes.object.isRequired,
    relay: React.PropTypes.object.isRequired,
    subscriptions: React.PropTypes.object.isRequired,
  };

  state = {
    isEditing: false,
  };

  componentDidMount() {
    if (!this.props.relay.hasOptimisticUpdate(this.props.todo)) {
      this._updateSubscription = this.props.subscriptions.subscribe(
        new UpdateTodoSubscription({ todo: this.props.todo })
      );
    }
  }

  componentWillUnmount() {
    if (this._updateSubscription) this._updateSubscription.dispose();
  }

  _handleCompleteChange = (e) => {
    const complete = e.target.checked;
    this.props.relay.commitUpdate(
      new ChangeTodoStatusMutation({
        complete,
        todo: this.props.todo,
        viewer: this.props.viewer,
      })
    );
  };

  _handleDestroyClick = () => {
    this._removeTodo();
  };

  _handleLabelDoubleClick = () => {
    this._setEditMode(true);
  };

  _handleTextInputCancel = () => {
    this._setEditMode(false);
  };

  _handleTextInputDelete = () => {
    this._setEditMode(false);
    this._removeTodo();
  };

  _handleTextInputSave = (text) => {
    this._setEditMode(false);
    this.props.relay.commitUpdate(
      new RenameTodoMutation({ todo: this.props.todo, text })
    );
  };

  _removeTodo() {
    this.props.relay.commitUpdate(
      new RemoveTodoMutation({ todo: this.props.todo, viewer: this.props.viewer })
    );
  }

  _setEditMode = (shouldEdit) => {
    this.setState({ isEditing: shouldEdit });
  };

  renderTextInput() {
    return (
      <TodoTextInput
        className="edit"
        commitOnBlur
        initialValue={this.props.todo.text}
        onCancel={this._handleTextInputCancel}
        onDelete={this._handleTextInputDelete}
        onSave={this._handleTextInputSave}
      />
    );
  }

  render() {
    return (
      <li
        className={classnames({
          completed: this.props.todo.complete,
          editing: this.state.isEditing,
        })}
      >
        <div className="view">
          <input
            checked={this.props.todo.complete}
            className="toggle"
            onChange={this._handleCompleteChange}
            type="checkbox"
          />
          <label onDoubleClick={this._handleLabelDoubleClick}>
            {this.props.todo.text}
          </label>
          <button
            className="destroy"
            onClick={this._handleDestroyClick}
          />
        </div>
        {this.state.isEditing && this.renderTextInput()}
      </li>
    );
  }
}

export default Relay.createContainer(RelaySubscriptions.createSubscriptionContainer(Todo), {
  fragments: {
    todo: () => Relay.QL`
      fragment on Todo {
        id
        complete
        text
        ${ChangeTodoStatusMutation.getFragment('todo')}
        ${RemoveTodoMutation.getFragment('todo')}
        ${RenameTodoMutation.getFragment('todo')}
        ${UpdateTodoSubscription.getFragment('todo')}
      }
    `,
    viewer: () => Relay.QL`
      fragment on User {
        ${ChangeTodoStatusMutation.getFragment('viewer')}
        ${RemoveTodoMutation.getFragment('viewer')}
      }
    `,
  },
});
