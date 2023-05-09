import { Pool } from "pg";

type ConnData = {
  user: string;
  database: string;
  password: string;
  port: number;
  host: string;
};

export const createConnectionProviderDB = (connectionData: ConnData) => {
  const pool = new Pool(connectionData);
  return pool;
};
