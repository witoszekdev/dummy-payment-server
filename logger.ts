import * as log from "log/mod.ts";
import { isDenoDeploy } from "./utils.ts";

const getArgStr = (arg: unknown) => {
  if (Array.isArray(arg)) {
    return arg.join(", ");
  }
  if (typeof arg === "object") {
    try {
      return JSON.stringify(arg, null, 2);
    } catch (_e) {
      return arg?.toString() ?? arg;
    }
  }
  return arg;
};

log.setup({
  handlers: {
    console: new log.handlers.ConsoleHandler("DEBUG", {
      formatter: (logRecord) => {
        let msg = `${logRecord.levelName} ${logRecord.msg}`;

        logRecord.args.forEach((arg, index) => {
          msg += `, arg${index}: ${getArgStr(arg)}`;
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
