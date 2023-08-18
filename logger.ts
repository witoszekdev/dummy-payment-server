import * as log from "log/mod.ts";
import { isDenoDeploy } from "./utils.ts";

log.setup({
  handlers: {
    console: new log.handlers.ConsoleHandler("DEBUG"),
  },
  loggers: {
    default: {
      level: isDenoDeploy ? "INFO" : "DEBUG",
    },
  },
});
