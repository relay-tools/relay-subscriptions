// https://github.com/facebook/relay/blob/master/src/traversal/printRelayOSSQuery.js
/* @flow */
// import Map from 'Map';
import RelayQuery from 'react-relay/lib/RelayQuery';

import { encode as base62Encode } from 'base62';
import invariant from 'invariant';

type Variable = {
  value: mixed;
  variableID: string;
};

type PrinterState = {
  fragmentCount: number;
  fragmentNameByHash: {[fragmentHash: string]: string};
  fragmentNameByText: {[fragmentText: string]: string};
  fragmentTexts: Array<string>;
  variableCount: number;
  variableMap: Map<string, Map<mixed, Variable>>;
};

let oneIndent = '';
let newLine = '';

if (process.env.NODE_ENV !== 'production') {
  oneIndent = '  ';
  newLine = '\n';
}

export default function printQuery(node: RelayQuery.Subscription): PrintedQuery {
  const fragmentTexts = [];
  const variableMap = new Map();
  const printerState = {
    fragmentCount: 0,
    fragmentNameByHash: {},
    fragmentNameByText: {},
    fragmentTexts,
    variableCount: 0,
    variableMap,
  };
  let queryText = null;
  if (node instanceof RelayQuery.Subscription) {
    queryText = printSubscription(node, printerState);
  }
  invariant(
    queryText,
    'printQuery(): Unsupported node type.'
  );
  const variables = {};
  variableMap.forEach(variablesForType => {
    variablesForType.forEach(({value, variableID}) => {
      variables[variableID] = value;
    });
  });

  return {
    text: [queryText, ...fragmentTexts].join(newLine.length ? newLine : ' '),
    variables,
  };
}

function printSubscription(
  node: RelayQuery.Mutation,
  printerState: PrinterState
): string {
  const call = node.getCall();
  const inputString = printArgument(
    node.getCallVariableName(),
    call.value,
    node.getInputType(),
    printerState
  );
  invariant(
    inputString,
    'printQuery(): Expected subscription `%s` to have a value for `%s`.',
    node.getName(),
    node.getCallVariableName()
  );
  // Note: children must be traversed before printing variable definitions
  const children = printChildren(node, printerState, oneIndent);
  const subscriptionString =
    node.getName() + printVariableDefinitions(printerState);
  const fieldName = call.name + '(' + inputString + ')';

  return 'subscription ' + subscriptionString + ' {' + newLine +
    oneIndent + fieldName + children + newLine + '}';
}

function printVariableDefinitions({variableMap}: PrinterState): string {
  let argStrings = null;
  variableMap.forEach((variablesForType, type) => {
    variablesForType.forEach(({variableID}) => {
      argStrings = argStrings || [];
      argStrings.push('$' + variableID + ':' + type);
    });
  });
  if (argStrings) {
    return '(' + argStrings.join(',') + ')';
  }
  return '';
}

function printNonNullType(type: string): string {
  if (type.endsWith('!')) {
    return type;
  }
  return type + '!';
}

function printChildren(
  node: RelayQuery.Node,
  printerState: PrinterState,
  indent: string
): string {
  const childrenText = [];
  const children = node.getChildren();
  let fragments;
  for (let ii = 0; ii < children.length; ii++) {
    const child = children[ii];
    if (child instanceof RelayQuery.Field) {
      let fieldText = child.getSchemaName();
      const fieldCalls = child.getCallsWithValues();
      if (fieldCalls.length) {
        fieldText = child.getSerializationKey() + ':' + fieldText;
        const argTexts = [];
        for (let jj = 0; jj < fieldCalls.length; jj++) {
          const {name, value} = fieldCalls[jj];
          const argText = printArgument(
            name,
            value,
            child.getCallType(name),
            printerState
          );
          if (argText) {
            argTexts.push(argText);
          }
        }
        if (argTexts.length) {
          fieldText += '(' + argTexts.join(',') + ')';
        }
      }
      fieldText += printDirectives(child);
      if (child.getChildren().length) {
        fieldText += printChildren(child, printerState, indent + oneIndent);
      }
      childrenText.push(fieldText);
    } else if (child instanceof RelayQuery.Fragment) {
      if (child.getChildren().length) {
        const {
          fragmentNameByHash,
          fragmentNameByText,
          fragmentTexts,
        } = printerState;

        // Avoid walking fragments if we have printed the same one before.
        const fragmentHash = child.getCompositeHash();

        let fragmentName;
        if (fragmentNameByHash.hasOwnProperty(fragmentHash)) {
          fragmentName = fragmentNameByHash[fragmentHash];
        } else {
          // Avoid reprinting a fragment that is identical to another fragment.
          const fragmentText =
            child.getType() +
            printDirectives(child) +
            printChildren(child, printerState, '');
          if (fragmentNameByText.hasOwnProperty(fragmentText)) {
            fragmentName = fragmentNameByText[fragmentText];
          } else {
            fragmentName = 'F' + base62Encode(printerState.fragmentCount++);
            fragmentNameByHash[fragmentHash] = fragmentName;
            fragmentNameByText[fragmentText] = fragmentName;
            fragmentTexts.push(
              'fragment ' + fragmentName + ' on ' + fragmentText
            );
          }
        }
        if (!fragments || !fragments.hasOwnProperty(fragmentName)) {
          fragments = fragments || {};
          fragments[fragmentName] = true;
          childrenText.push('...' + fragmentName);
        }
      }
    } else {
      invariant(
        false,
        'printRelayOSSQuery(): Expected a field or fragment, got `%s`.',
        child.constructor.name
      );
    }
  }
  if (!childrenText) {
    return '';
  }
  return childrenText.length ? ' {' + newLine + indent + oneIndent +
    childrenText.join(',' + newLine + indent + oneIndent) + newLine +
    indent + '}' : '';
}

function printDirectives(node) {
  let directiveStrings;
  node.getDirectives().forEach(directive => {
    let dirString = '@' + directive.name;
    if (directive.args.length) {
      dirString +=
        '(' + directive.args.map(printDirective).join(',') + ')';
    }
    directiveStrings = directiveStrings || [];
    directiveStrings.push(dirString);
  });
  if (!directiveStrings) {
    return '';
  }
  return ' ' + directiveStrings.join(' ');
}

function printDirective({name, value}) {
  invariant(
    typeof value === 'boolean' ||
    typeof value === 'number' ||
    typeof value === 'string',
    'printRelayOSSQuery(): Relay only supports directives with scalar values ' +
    '(boolean, number, or string), got `%s: %s`.',
    name,
    value
  );
  return name + ':' + JSON.stringify(value);
}

function printArgument(
  name: string,
  value: mixed,
  type: ?string,
  printerState: PrinterState
): ?string {
  if (value == null) {
    return value;
  }
  let stringValue;
  if (type != null) {
    const variableID = createVariable(name, value, type, printerState);
    stringValue = '$' + variableID;
  } else {
    stringValue = JSON.stringify(value);
  }
  return name + ':' + stringValue;
}

function createVariable(
  name: string,
  value: mixed,
  type: string,
  printerState: PrinterState
): string {
  invariant(
    value != null,
    'printQuery: Expected a non-null value for variable `%s`.',
    name
  );
  const valueKey = JSON.stringify(value);
  const nonNullType = printNonNullType(type);
  let variablesForType = printerState.variableMap.get(nonNullType);
  if (!variablesForType) {
    variablesForType = new Map();
    printerState.variableMap.set(nonNullType, variablesForType);
  }
  const existingVariable = variablesForType.get(valueKey);
  if (existingVariable) {
    return existingVariable.variableID;
  } else {
    const variableID = name + '_' + base62Encode(printerState.variableCount++);
    variablesForType.set(valueKey, {
      value,
      variableID,
    });
    return variableID;
  }
}
