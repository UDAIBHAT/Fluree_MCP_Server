function getConnectionInfo(req) {
  const header = (key) => req.headers[key.toLowerCase()];
  const params = req.body?.params || {};

  const dbUrl = header('dburl') || params.dbUrl;
  const network = header('network') || params.network;
  const ledger = header('ledger') || params.ledger;

  return { dbUrl, network, ledger };
}

// Helper: validate required fields
function validateConnectionInfo({ dbUrl, network, ledger }) {
  const missing = [];
  if (!dbUrl) missing.push("dbUrl");
  if (!network) missing.push("network");
  if (!ledger) missing.push("ledger");
  return missing;
}

export { getConnectionInfo, validateConnectionInfo };   