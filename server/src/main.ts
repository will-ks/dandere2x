/* eslint-disable unicorn/no-process-exit */
import execa from "execa";
import express from "express";
import path from "path";
import * as Path from "path";
import { PythonShell } from "python-shell";
import { fileURLToPath } from "url";

const addGlobalExitHandler = (
  callback: (eventOrExitCodeOrError?: number | string | Error) => void
) => {
  let exiting = false;
  [
    "beforeExit",
    "uncaughtException",
    "unhandledRejection",
    "SIGHUP",
    "SIGINT",
    "SIGQUIT",
    "SIGILL",
    "SIGTRAP",
    "SIGABRT",
    "SIGBUS",
    "SIGFPE",
    "SIGUSR1",
    "SIGSEGV",
    "SIGUSR2",
    "SIGTERM",
  ].forEach((event) =>
    process.on(event, (eventOrExitCodeOrError?: number | string | Error) => {
      if (exiting) {
        return;
      }
      exiting = true;
      callback(eventOrExitCodeOrError);
    })
  );
};
const onExitCallbacks: (() => Promise<void>)[] = [];
const exit = async (exitCode?: number) => {
  console.log("Cleaning up, please wait...");
  await Promise.allSettled(
    onExitCallbacks.map(async (callback) => {
      try {
        await callback();
      } catch (error) {
        console.error(error);
      }
    })
  );
  process.exit(exitCode);
};
addGlobalExitHandler((eventOrExitCodeOrError) => {
  console.log(
    eventOrExitCodeOrError instanceof Error
      ? `Exiting due to error: ${eventOrExitCodeOrError}`
      : "Exiting..."
  );
  exit(
    typeof eventOrExitCodeOrError === "number" &&
      !Number.isNaN(eventOrExitCodeOrError)
      ? eventOrExitCodeOrError
      : undefined
  ).catch((error) => console.error(error));
});

const app = express();

const PORT = 3001;

const messages: string[] = [];

(async () => {
  app.get("/", (_req, res) => {
    res.send("Hello World!");
  });
  app.get("/healthcheck", (_req, res) => {
    res.send("Good");
  });
  app.get("/status", (_req, res) => {
    res.send(messages);
  });
  onExitCallbacks.push(async () => {
    // Cleanup function
    console.log("Shutting down");
  });
  app.post("/start", (_req, res) => {
    res.send("Started");
  });
  app.listen(PORT);
  const { stdout, stderr } = await execa("python3.8", [
    Path.join(__dirname, "../dandere2x/dandere2x/src/main.py"),
    "-p",
    "singleprocess",
    "-ws",
    "./workspace/",
    "-i",
    Path.join(__dirname, "../output.mp4"),
    "-o",
    Path.join(__dirname, "../upscaled.mkv"),
  ]);
  console.log(stdout, stderr);
})();

console.log(`Server started on port ${PORT}`);
