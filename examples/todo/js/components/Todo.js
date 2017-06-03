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

import classNames from 'classnames';
import React from 'react';
import Relay from 'react-relay/classic';
import RelaySubscriptions from 'relay-subscriptions';

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
  };

  state = {
    isEditing: false,
  };

  _handleCompleteChange = (e) => {
    const { relay, todo, viewer } = this.props;
    relay.commitUpdate(
      new ChangeTodoStatusMutation({
        todo,
        viewer,
        complete: e.target.checked,
      }),
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
    const { relay, todo } = this.props;
    relay.commitUpdate(
      new RenameTodoMutation({ todo, text }),
    );
  };

  _removeTodo() {
    const { relay, todo, viewer } = this.props;
    relay.commitUpdate(
      new RemoveTodoMutation({ todo, viewer }),
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
        className={classNames({
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

export default RelaySubscriptions.createContainer(Todo, {
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

  subscriptions: [
    ({ pending, todo }) => !pending && new UpdateTodoSubscription({ todo }),
  ],
});
