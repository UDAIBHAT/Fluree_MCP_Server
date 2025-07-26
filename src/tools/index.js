import echo from './echo.js';
import flureeTransact from './flureeTransact.js';
import flureeNetworkStatus from "./flureeNetworkStatus.js";
import flureeQuery from './flureeQuery.js';
import flureeMultiQuery from "./multi_query.js";
import flureeBlockQuery from "./block_query.js";
import flureeHistoryQuery from "./history_query.js";
import flureeGenKeys from "./flureeGenKeys.js";
import flureeBlockRangeWithTxn from "./flureeBlock-range-with-txn.js";
import flureeSchemaCreate from "./flureeSchemaCreate.js";
import flureeSchemaUpdate from "./flureeSchemaUpdate.js";
import flureeSchemaValidate from "./flureeSchemaValidate.js";
import flureeSchemaExport from "./flureeSchemaExport.js";
import flureeSchemaImport from "./flureeSchemaImport.js";
import flureeDbDiagnostic from "./flureeDbDiagnostic.js";

export default [
  echo,
  flureeNetworkStatus,
  flureeQuery,
  flureeTransact,
  flureeBlockQuery,
  flureeHistoryQuery,
  flureeMultiQuery,
  flureeGenKeys,
  flureeBlockRangeWithTxn,
  flureeSchemaCreate,
  flureeSchemaUpdate,
  flureeSchemaValidate,
  flureeSchemaExport,
  flureeSchemaImport,
  flureeDbDiagnostic
];