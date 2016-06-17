
type NextChildren = Array<any>;

declare module RelayQuery {
  declare class RelayQueryNode {
    constructor: Function; // for flow
    __calls__: ?Array<Call>;
    __children__: ?Array<RelayQueryNode>;
    __concreteNode__: any;
    __fieldMap__: ?{[key: string]: RelayQueryField};
    __hasDeferredDescendant__: ?boolean;
    __hasValidatedConnectionCalls__: ?boolean;
    __route__: RelayMetaRoute;
    __serializationKey__: ?string;
    __storageKey__: ?string;
    __variables__: Variables;
    static create(concreteNode: mixed, route: RelayMetaRoute, variables: Variables): RelayQueryNode;
    constructor(concreteNode: any, route: RelayMetaRoute, variables: Variables): void;
    canHaveSubselections(): boolean;
    isGenerated(): boolean;
    isRefQueryDependency(): boolean;
    clone(children: NextChildren): ?RelayQueryNode;
    getChildren(): Array<RelayQueryNode>;
    isIncluded(): boolean;
    getDirectives(): Array<Directive>;
    getField(field: RelayQueryField): ?RelayQueryField;
    getFieldByStorageKey(storageKey: string): ?RelayQueryField;
    getType(): string;
    getRoute(): RelayMetaRoute;
    getVariables(): Variables;
    hasDeferredDescendant(): boolean;
    isAbstract(): boolean;
    isRequisite(): boolean;
    equals(that: RelayQueryNode): boolean;
    isEquivalent(that: RelayQueryNode): boolean;
    createNode(concreteNode: any): RelayQueryNode;
    getConcreteQueryNode(): any;
  }
  declare class RelayQueryOperation extends RelayQueryNode {
    __callVariableName__: string;
    constructor(concreteNode: any, route: RelayMetaRoute, variables: Variables): void;
    canHaveSubselections(): boolean;
    getName(): string;
    getResponseType(): string;
    getType(): string;
    getInputType(): string;
    getCall(): Call;
    getCallVariableName(): string;
    isAbstract(): boolean;
  }

  declare class RelayQuerySubscription extends RelayQueryOperation {
    static create(
      concreteNode: mixed,
      route: RelayMetaRoute,
      variables: Variables
    ): RelayQuerySubscription;
    getPublishedPayloadType(): string;
    equals(that: RelayQueryNode): boolean;
  }

  declare class RelayQueryField extends RelayQueryNode {
    __debugName__: ?string;
    __isRefQueryDependency__: boolean;
    __rangeBehaviorCalls__: ?Array<Call>;
    __shallowHash__: ?string;

    static create(concreteNode: mixed, route: RelayMetaRoute, variables: Variables): RelayQueryField;

    /**
     * Helper to construct a new field with the given attributes and 'empty'
     * route/variables.
     */
    /* static build({
      alias?: ?string;
      directives?: ?Array<Directive>;
      calls?: ?Array<Call>;
      children?: ?NextChildren;
      fieldName: string;
      metadata?: ?ConcreteFieldMetadata;
      type: string;
    }): RelayQueryField;*/
    constructor(concreteNode: ConcreteField, route: RelayMetaRoute, variables: Variables): void;
    canHaveSubselections(): boolean;
    isAbstract(): boolean;
    isFindable(): boolean;
    isGenerated(): boolean;
    isConnection(): boolean;
    isConnectionWithoutNodeID(): boolean;
    isPlural(): boolean;
    isRefQueryDependency(): boolean;
    isRequisite(): boolean;
    getDebugName(): string;
    getSchemaName(): string;
    getRangeBehaviorCalls(): Array<Call>;
    getSerializationKey(): string;
    getShallowHash(): string;
    getStorageKey(): string;
    getApplicationName(): string;
    getInferredRootCallName(): ?string;
    getInferredPrimaryKey(): ?string;
    getCallsWithValues(): Array<Call>;
    getCallType(callName: string): ?string;
    equals(that: RelayQueryNode): boolean;
    cloneAsRefQueryDependency(): RelayQueryField;
    cloneFieldWithCalls(children: NextChildren, calls: Array<Call>): ?RelayQueryField;
    _isCoreArg(arg: Call): boolean;
  }
}
