import dotenv from "dotenv";
dotenv.config({
    path: "./.env",
  });


  
const Port = process.env.PORT_NO || 3001 ;





export{
    Port,
};