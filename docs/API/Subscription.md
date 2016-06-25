# RelaySubscriptions.Subscription
RelaySubscriptions makes use of the `Relay.Mutation` api.
If you are familiar with the mutation api this shouldn't be any new things.
Except the `getSubscription` method which replaced `getMutation`.

# Overview

### Properties
`static fragments`  
_Declare this subscription's data dependencies here_  
`static initialVariables`  
_A default set of variables to make available to this subscription's fragment builders_  
`static prepareVariables`  
_A method to modify the variables based on the runtime environment, previous variables, or the meta route_

### Methods
`constructor(props)`  
`abstract getConfigs()`  
`abstract getSubscription()`  
`abstract getVariables()`  
`static getFragment(fragmentName[, variableMapping])`  

# Properties
## fragments (static property)
```js
static fragments: RelayMutationFragments<$Keys<Tp>>

// Type of RelayMutationFragments
type RelayMutationFragments<Tk> = {
  [key: Tk]: FragmentBuilder;
};

// Type of FragmentBuilder
type FragmentBuilder = (variables: Variables) => RelayConcreteNode;
```
We declare our subscription' data dependencies here, just as we would with a container.

### Example
```js
class UpdateTodoSubscription extends RelaySubscriptions.Subscription {
  static fragments = {
    todo: () => Relay.QL`
      fragment on Todo {
        id
        text
        complete
      }
    `,
  };
}
```

## initialVariables (static property)
`static initialVariables: {[name: string]: mixed};`  
The defaults we specify here will become available to our fragment builders:
### Example
```js
class AddTodoSubscription extends RelaySubscriptions.Subscription {
  static initialVariables = {orderby: 'priority'};
  static fragments = {
    todos: () => Relay.QL`
      # The variable defined above is available here as $orderby
      fragment on Viewer { todos(orderby: $orderby) { ... } }
    `,
  };
  /* ... */
}
```

## prepareVariables (static property)
```js
static prepareVariables: ?(
  prevVariables: {[name: string]: mixed},
  route: RelayMetaRoute,
) => {[name: string]: mixed}

// Type of `route` argument
type RelayMetaRoute = {
  name: string;
}
```
If we provide to a subscription a method that conforms to the signature described above, it will be given the opportunity to modify the fragment builders' variables, based on the previous variables (or the initialVariables if no previous ones exist), the meta route, and the runtime environment. Whatever variables this method returns will become available to this subscription's fragment builders.
### Example
```js
class BuySongSubscription extends RelaySubscriptions.Subscription {
  static initialVariables = {format: 'mp3'};
  static prepareVariables = (prevVariables) => {
    var overrideVariables = {};
    var formatPreference = localStorage.getItem('formatPreference');
    if (formatPreference) {
      overrideVariables.format = formatPreference;  // Lossless, hopefully
    }
    return {...prevVariables, overrideVariables};
  };
  /* ... */
}
```

# Methods
## constructor

Create a subscription instance using the `new` keyword, optionally passing it some props. Note that `this.props` is not available inside the constructor function, but are set for all the methods mentioned below (getConfigs, getVariables, etc). This restriction is due to the fact that subscription props may depend on data from the RelayEnvironment, which isn't known until the subscription is applied with `subscribe` provided by `SubscriptionProvider` and `SubscriptionContainer`.

### Example
```js
const flightsUpdateSub = new FlightsUpdateSubscription({airport: 'yvr'});
this.props.subscriptions.subscribe(flightsUpdateSub);
```

## getConfigs (abstract method)
`abstract getConfigs(): Array<{[key: string]: mixed}>`  
Implement this required method to give Relay instructions on how to use the response payload from each subscription to update the client-side store.

### Example
```js
class LikeStorySubscription extends RelaySubscriptions.Subscription {
  getConfigs() {
    return [{
      type: 'FIELDS_CHANGE',
      fieldIDs: {
        story: this.props.story.id,
      },
    }];
  }
}
```

## getSubscription (abstract method)
`abstract getSubscription(): GraphQL.Subscription`  
Implement this required method to return a GraphQL subscription operation that represents the subscription to subscribe to.

### Example
```js
class LikeStorySubscription extends RelaySubscriptions.Subscription {
  getSubscription() {
    return Relay.QL`subscription {
      likeStorySubscribe {
        story {
          likes {
            likeSentence
            count
          }
        }
      }
    }`;
  }
}
```

## getVariables (abstract method)
`abstract getVariables(): {[name: string]: mixed}`  
Implement this required method to prepare variables to be used as input to the subscription.

## Example
```js
class DestroyShipSubscription extends RelaySubscriptions.Subscription {
  getVariables() {
    return {
      factionId: this.props.faction.id,
    };
  }
}
```

## getFragment (static method)
```js
static getFragment(
  fragmentName: $Keys<Tp>,
  variableMapping?: Variables
): RelayFragmentReference

// Type of the variableMapping argument
type Variables = {[name: string]: mixed};
```
Gets a fragment reference for use in a parent's query fragment.

### Example
```js
class StoryComponent extends React.Component {
  /* ... */
  static fragments = {
    story: () => Relay.QL`
      fragment on Story {
        id,
        text,
        ${LikeStorySubscription.getFragment('story')},
      }
    `,
  };
}
```
You can also pass variables to the subscription's fragment builder from the outer fragment that contains it.
```js
class Movie extends React.Component {
  /* ... */
  static fragments = {
    movie: () => Relay.QL`
      fragment on Movie {
        posterImage(lang: $lang) { url },
        trailerVideo(format: $format, lang: $lang) { url },
        ${MovieUpdateSubscription.getFragment('movie', {
          format: variables.format,
          lang: variables.lang,
        })},
      }
    `,
  };
}
```
