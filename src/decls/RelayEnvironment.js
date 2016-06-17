declare interface RelayEnvironmentInterface {
  forceFetch(
    querySet: RelayQuerySet,
    onReadyStateChange: ReadyStateChangeCallback
  ): Abortable;
  getFragmentResolver(
    fragment: RelayQuery.Fragment,
    onNext: () => void
  ): FragmentResolver;
  getStoreData(): RelayStoreData;
  primeCache(
    querySet: RelayQuerySet,
    onReadyStateChange: ReadyStateChangeCallback
  ): Abortable;
  read(
    node: RelayQuery.Node,
    dataID: DataID,
    options?: StoreReaderOptions
  ): ?StoreReaderData;
}
