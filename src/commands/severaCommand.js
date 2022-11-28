import * as fs from "fs";

import moment from "moment";
import {
  paginatedFetch,
  totalCustomers,
  totalHours,
  totalPhases,
  totalProjects,
  totalSeveraUsers,
  totalSlackUsers,
} from "../../utils/api.js";

import {
  displayPersonWorkedHours,
  generateProjectOptions,
} from "../../utils/utils.js";
import Logger from "../../utils/errorLogger.js";

export const getAllProjects = async ({ say, logger }) => {
  try {
    say(
      "All projects will be fetched in seconds. Please wait... :hourglass_flowing_sand:"
    );
    await totalProjects().then(() =>
      say("All projects have been fetched :tada:")
    );
  } catch (error) {
    say("There's an error occured. Please contact the development team");
    logger.error(error, "this is LOGGER");
    const errorLogger = Logger(import.meta.url);
    errorLogger.error(error, "this is WINSTON");
  }
};

export const getAllCustomers = async ({ say }) => {
  try {
    say(
      "All customers will be fetched in seconds. Please wait :hourglass_flowing_sand:"
    );
    await totalCustomers().then(() =>
      say("All customers have been fetched :tada:")
    );
  } catch (error) {
    say("There's an error occured. Please contact the development team");
    console.error("error", error.response);
  }
};
export const getAllPhases = async ({ say }) => {
  try {
    say(
      "All phases will be fetched in seconds. Please wait :hourglass_flowing_sand:"
    );
    await totalPhases().then(() => say("All phases have been fetched :tada:"));
  } catch (error) {
    say("There's an error occured. Please contact the development team");
    console.error("error", error.response);
  }
};
export const getAllHours = async ({ say }) => {
  try {
    say(
      "All hours will be fetched in seconds. Please wait :hourglass_flowing_sand:"
    );
    await totalHours().then(() => say("All hours have been fetched :tada:"));
  } catch (error) {
    say("There's an error occured. Please contact the development team");
    console.error("error", error.response);
  }
};
export const getAllSeveraMembers = async ({ say }) => {
  try {
    say(
      "All Severa members will be fetched in seconds. Please wait :hourglass_flowing_sand:"
    );
    await totalSeveraUsers().then(() =>
      say("All Severa members have been fetched :tada:")
    );
  } catch (error) {
    say("There's an error occured. Please contact the development team");
    console.error("error", error.response);
  }
};

export const getAllSlackMembers = async ({ say }) => {
  try {
    say(
      "All Slack members will be fetched in seconds. Please wait :hourglass_flowing_sand:"
    );
    await totalSlackUsers().then(() =>
      say("All Slack members have been fetched :tada:")
    );
  } catch (error) {
    say("There's an error occured. Please contact the development team");
    console.error("error", error.response);
  }
};

export const getProjectDetails = async ({ command, ack, respond, client }) => {
  const dir = "./json";

  try {
    // Acknowledge command request
    await ack();

    const allProjects = fs.existsSync(dir)
      ? JSON.parse(fs.readFileSync("./json/projects.json"))
      : null;

    if (!command.text || command.text.length < 3)
      return respond(`Please enter a proper name`);

    const selectedProject = allProjects.filter((item) =>
      item.name.toLowerCase().includes(`${command.text.toLocaleLowerCase()}`)
    );

    if (selectedProject.length > 0) {
      await respond(`Fetching *${command.text}*. Just a moment`);

      client.chat.postMessage({
        response_type: "in_channel",
        channel: command.channel_id,
        text: "Hello, here are the options :slightly_smiling_face:",
        blocks: [
          {
            type: "actions",
            block_id: "project_id",
            elements: [
              {
                type: "static_select",
                placeholder: {
                  type: "plain_text",
                  text: "Please select one of the projects :slightly_smiling_face:",
                },
                action_id: "project_action",
                options: generateProjectOptions(selectedProject),
              },
            ],
          },
        ],
      });
    } else {
      await respond(`Invalid project name. Please enter a more specifc name.`);
    }
  } catch (error) {
    respond("There's an error occured. Please contact the development team");

    console.log(error, "ERROR ON");
  }
};
export const getCustomerDetails = async ({ command, ack, respond, client }) => {
  const dir = "./json";

  try {
    // Acknowledge command request
    await ack();

    const allCustomers = fs.existsSync(dir)
      ? JSON.parse(fs.readFileSync("./json/customers.json"))
      : null;
    if (!command.text || command.text.length < 3)
      return respond(`Please enter a proper name`);

    const selectedCustomer = allCustomers.filter((item) =>
      item.name.toLowerCase().includes(`${command.text.toLocaleLowerCase()}`)
    );

    if (selectedCustomer.length > 0) {
      await respond(`Fetching *${command.text}*. Just a moment`);

      client.chat.postMessage({
        response_type: "in_channel",
        channel: command.channel_id,
        text: "Hello, here are the options :slightly_smiling_face:",
        blocks: [
          {
            type: "actions",
            block_id: "customer_id",
            elements: [
              {
                type: "static_select",
                placeholder: {
                  type: "plain_text",
                  text: "Please select one of the customer :slightly_smiling_face:",
                },
                action_id: "customer_action",
                options: generateProjectOptions(selectedCustomer),
              },
            ],
          },
        ],
      });
    } else {
      await respond(`Invalid customer name. Please enter a more specifc name.`);
    }
  } catch (error) {
    respond("There's an error occured. Please contact the development team");
    const errorLogger = Logger(import.meta.url);
    errorLogger.error(error, "WINSTON");
    console.log(error);
  }
};

export const getPersonWorkhours = async ({ command, ack, respond, client }) => {
  const dir = "./json";

  try {
    // Acknowledge command request
    await ack();
    const members = fs.existsSync(dir)
      ? JSON.parse(fs.readFileSync("./json/severaUsers.json"))
      : null;
    const startOfMonth = moment().startOf("month").format("MM-DD-YYYY");
    const today = moment().format("MM-DD-YYYY");

    const [firstN, lastN] = command?.user_name.split(".");

    const foundMember = members.filter(
      ({ firstName, lastName }) =>
        firstName.toLowerCase() === firstN && lastName.toLowerCase() === lastN
    );

    if (foundMember.length === 0)
      await respond(`Invalid member name. Please enter a more specifc name.`);

    const hours = await paginatedFetch(
      `/users/${foundMember[0]?.guid}/workhours?startDate=${startOfMonth}&endDate=${today}`,
      "hours",
      "hour"
    );
    const fields = displayPersonWorkedHours(hours);

    if (hours?.length > 0) {
      client.chat.postMessage({
        response_type: "in_channel",
        channel: command.channel_id,
        text: "Hello, here are the options :slightly_smiling_face:",
        blocks: [
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: `*${foundMember[0].firstName} ${foundMember[0].lastName}*'s worked hours for this phase`,
            },
          },
          {
            type: "section",
            fields: fields,
          },
        ],
      });
    } else {
      await respond(
        `Oops! Looks like you haven't entered any hours for this phase.`
      );
    }
  } catch (error) {
    respond("There's an error occured. Please contact the development team");

    console.log(error);
  }
};
