import echo from './echo.js';
import flureeTransact from './flureeTransact.js';
import flureeNetworkStatus from "./flureeNetworkStatus.js";
import flureeQuery from './flureeQuery.js';
import flureeMultiQuery from "./multi_query.js";
import flureeBlockQuery from "./block_query.js";
import flureeHistoryQuery from "./history_query.js";
import flureeGenKeys from "./flureeGenKeys.js";

export default [
  echo,
  flureeNetworkStatus,
  flureeQuery,
  flureeTransact,
  flureeBlockQuery,
  flureeHistoryQuery,
  flureeMultiQuery,
  flureeGenKeys
]; 