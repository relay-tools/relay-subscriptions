
declare type CallValue = ?(
  boolean |
  number |
  string |
  {[key: string]: CallValue} |
  Array<CallValue>
);

declare type Call = {
  name: string;
  type?: string;
  value: CallValue;
};

declare type Directive = {
  args: Array<Call>;
  name: string;
};
