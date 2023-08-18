import * as log from "log/mod.ts";
import { isDenoDeploy } from "./utils.ts";

log.setup({
  handlers: {
    console: new log.handlers.ConsoleHandler("DEBUG", {
      formatter: (logRecord) => {
        let msg = `${logRecord.levelName} ${logRecord.msg}`;

        logRecord.args.forEach((arg, index) => {
          msg += `, arg${index}: ${arg}`;
        });

        return msg;
      },
    }),
  },
  loggers: {
    default: {
      level: isDenoDeploy ? "INFO" : "DEBUG",
      handlers: ["console"],
    },
  },
});
