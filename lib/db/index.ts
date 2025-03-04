import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "@/lib/env.mjs";

/**
 * DOCKER COMMAND WITH PG-VECTOR TO START A POSTGRES DATABASE WITH EXTENSION INSTALLED docker run -d --name pgvector_db -p 6500:5432 -e POSTGRES_PASSWORD=mysecretpassword pgvector/pgvector:pg16
 *
 *
 * */

const client = postgres(env.DATABASE_URL);
export const db = drizzle(client);
