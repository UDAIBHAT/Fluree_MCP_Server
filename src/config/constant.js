import dotenv from "dotenv";
dotenv.config({
    path: "./.env",
  });

const Port = process.env.PORT_NO  ;
const FLUREE_DB_URL = process.env.FLUREE_DB_URL ;
const FLUREE_NETWORK = process.env.FLUREE_NETWORK ;
const FLUREE_LEDGER = process.env.FLUREE_LEDGER ;

export{
    Port,
    FLUREE_DB_URL,
    FLUREE_NETWORK,
    FLUREE_LEDGER,
};