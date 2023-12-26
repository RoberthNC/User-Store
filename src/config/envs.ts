import "dotenv/config";
import { get } from "env-var";

export const envs = {
  JWT_SEED: get("JWT_SEED").required().asString(),
  MAILER_EMAIL: get("MAILER_EMAIL").required().asString(),
  MAILER_SECRET_KEY: get("MAILER_SECRET_KEY").required().asString(),
  MAILER_SERVICE: get("MAILER_SERVICE").required().asString(),
  PORT: get("PORT").required().asPortNumber(),
  SEND_EMAIL: get("SEND_EMAIL=false").default("false").asBool(),
  WEBSERVICE_URL: get("WEBSERVICE_URL").required().asString(),
};
