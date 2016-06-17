export default function updateStoreData(environment, configs, query, payload) {
  const storeData = environment.getStoreData();
  const payloadName = query.getCall().name;
  storeData.handleUpdatePayload(query, payload[payloadName], {
    configs,
  });
}
