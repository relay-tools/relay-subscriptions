# Relay Subscriptions
I created this in like 12 hours or something, don't expect this to work out of the box.

Most of the code need to be implemented in user-space because most of it is implementation details.
This library helps you print the query and update the store for you.  

The easiest way to get started is to check the example code in this repo. Please note that server implementation isn't good and I haven't spent much time on it because that's the part which will be different for everyone.  

`Todo.js` and `TodoApp.js` is the components that uses subscriptions and `Root.js` is the component that sends the subscriptions to the server.  

There are some initial [API docs](docs/API.md) too.

### Installing
`npm i --save relay-subscriptions`

`SubscriptionProvider` is like RootContainer in Relay, it is handling store updates and subscriptions.  
`SubscriptionContainer` is like `Relay.createContainer`, it provides `this.props.subscriptions.subscribe` to components.

Things to do  
* [ ] Figure out how this actually works.
* [ ] Writing tests
* [ ] Writing documentation
* [ ] Cleanup

![PoC](http://g.recordit.co/zZfGNmYJTr.gif)
