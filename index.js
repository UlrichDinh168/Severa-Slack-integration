import pkg from "@slack/bolt";
import { scheduleJob } from "node-schedule";
import {
  botToken as token,
  signingSecret,
  appToken,
  port,
} from "./data/keys.js";
import { log } from "./setup/logger.js";
import {
  getProjectDetails,
  getCustomerDetails,
  getPersonWorkhours,
  getAllProjects,
  getAllHours,
  getAllPhases,
  getAllCustomers,
  getAllSlackMembers,
  getAllSeveraMembers,
} from "./src/commands/severaCommand.js";
import {
  cleanupProjects,
  workhourNotification,
  postMessageToSlack,
} from "./src/messages/severaMessage.js";
import {
  getProjectDetailsAction,
  getCustomerDetailsAction,
  triggerAccept,
} from "./src/actions/severaActions.js";
import { greeting, displayDate } from "./src/messages/slackMessage.js";
import {
  totalCustomers,
  totalProjects,
  totalSlackUsers,
  totalSeveraUsers,
  totalHours,
  totalPhases,
} from "./utils/api.js";
import { postCsvToChannel } from "./utils/index.js";

const { App } = pkg;

export const Slackbot = new App({
  token,
  signingSecret,
  socketMode: true,
  appToken,
  extendedErrorHandler: true,
});

// COMMANDS
Slackbot.command("/project", getProjectDetails);
Slackbot.command("/customer", getCustomerDetails);
// Slackbot.command("/member", getMemberDetails);
Slackbot.command("/hour", getPersonWorkhours);

// ACTIONS
Slackbot.action(
  { action_id: "project_action", block_id: "project_id" },
  getProjectDetailsAction
);
Slackbot.action(
  { action_id: "customer_action", block_id: "customer_id" },
  getCustomerDetailsAction
);
Slackbot.action(
  "accept_button",
  // { action_id: "accept_button", block_id: "plank_id" },
  triggerAccept
);
Slackbot.action(
  { action_id: "decline_button", block_id: "plank_id" },
  getCustomerDetailsAction
);

// MESSAGES
Slackbot.message(/get projects/, getAllProjects);
Slackbot.message(/get workhours/, getAllHours);
Slackbot.message(/get all phases/, getAllPhases);
Slackbot.message(/get customers/, getAllCustomers);
Slackbot.message(/get slack members/, getAllSlackMembers);
Slackbot.message(/get severa users/, getAllSeveraMembers);

Slackbot.event("app_mention", greeting);
Slackbot.message(/date/, displayDate);

/**
 * Fetch all ultility functions.
 */
const fetchAllUltilityFunctions = () => {
  const date = new Date();
  console.log(date.toLocaleString());
  totalSlackUsers();
  totalSeveraUsers();
  totalProjects();
  // totalHours();
  totalPhases();
  totalCustomers();
};


/**
 * Fetch all users daily.
 */
scheduleJob("50 * * * *", function () {
  console.log("Fetch data hourly");
  fetchAllUltilityFunctions()
});


/**
 * Fetch projects - hours - phases - customers every 30mins.
 */
scheduleJob("* 0 9 * * 0", function () {
  totalSlackUsers();
  totalSeveraUsers();
});


// deadlineNotificationot);
let arrayOfProjectsOverBudget = [];

/**
 * Scheduled fetch.
 * Prepare files and grouping 10 mins before firing.
 */
scheduleJob("0 15 10 * * 1", async function () {
  console.log("Mapped!");
  // await fetchAllUltilityFunctions();
  arrayOfProjectsOverBudget = await cleanupProjects();
  return await postMessageToSlack(
    Slackbot,
    arrayOfProjectsOverBudget,
    postCsvToChannel
  );
});

/**
 * Schedule fetch
 * Post work hours notification to Slack
 */
scheduleJob("0 10 10 * * 1", function () {
  console.log("Yet another bizzare fact");
  workhourNotification(Slackbot);
});


Slackbot.error(({ error }) => {
  log.error(error);
});

// --------------- END -----------------
// Initialises app in development
(async () => {
  const date = new Date();
  await Slackbot.start(port);
  console.log(
    `Started slack bot 🚀 - PORT: ${port} - ${date.toLocaleString()}`
  );
})();





// ====================== TESTING ======================
/**
 * Testing post deadline, budget notification
 * Uncommenting lines below to test
 */
const first = async () => {
  console.log("1");
  // await fetchAllUltilityFunctions();
  return (arrayOfProjectsOverBudget = await cleanupProjects());
};

const second = async () => {
  return await first().then((response) => {
    console.log("2");
    return postMessageToSlack(
      Slackbot,
      arrayOfProjectsOverBudget,
      postCsvToChannel
    );
  });
};

// fetchAllUltilityFunctions()
// second();
// workhourNotification(Slackbot);

