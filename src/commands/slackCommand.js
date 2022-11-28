// // import { Slackbot } from "../../index.js";
// import pkg from "@slack/bolt";

// const { App, ExpressReceiver, LogLevel } = pkg;
// export const Slackbot = new App({
//   token,
//   signingSecret,
//   // receiver,
//   // logLevel: LogLevel.DEBUG,
//   socketMode: true, // enable the following to use socket mode
//   appToken,
// });
// Slackbot.command("/hello", async ({ command, ack, say }) => {
//   try {
//     await ack();
//     say("Hello there, how are you today? :D ");
//   } catch (error) {
//     console.error("error", error);
//   }
// });
// const port = 8080;

// (async () => {
//   await Slackbot.start(port);
//   console.log(`Started slack bot 🚀 - PORT: ${port}`);
// })();
