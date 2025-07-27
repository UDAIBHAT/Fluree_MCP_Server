function getConnectionInfo(req) {
  const header = (key) => req.headers[key.toLowerCase()];
  const query = req.query || {};
  const params = req.body?.params || {};

  // // DEBUG: view all sources
  // console.log("HEADERS:", req.headers);
  // console.log("QUERY:", query);
  // console.log("BODY PARAMS:", params);

  const dbUrl =
    header("dburl") || query.dburl || params.dbUrl;
  const network =
    header("network") || query.network || params.network;
  const ledger =
    header("ledger") || query.ledger || params.ledger;

  return { dbUrl, network, ledger };
}

// Helper: validate required fields
function validateConnectionInfo({ dbUrl, network, ledger }) {
  const missing = [];
  if (!dbUrl) missing.push("dburl");
  if (!network) missing.push("network");
  if (!ledger) missing.push("ledger");
  return missing;
}

export { getConnectionInfo, validateConnectionInfo };   