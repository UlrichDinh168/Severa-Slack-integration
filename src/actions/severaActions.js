import * as fs from "fs";
import moment from "moment";
import { google } from "googleapis";
import Logger from "../../utils/errorLogger.js";

import {
  totalProjectWorkhoursForInvoincing,
  paginatedFetch,
  googleSpreadSheet,
} from "../../utils/api.js";
import {
  displayProjectDetails,
  displayCustomerDetails,
} from "../../utils/utils.js";
import { getAllProjects } from "../commands/severaCommand.js";

const sheets = google.sheets("v4");

export const getProjectDetailsAction = async ({
  body,
  client,
  ack,
  logger,
  say,
  respond,
}) => {
  const dir = "./json";

  await ack();
  // respond("Please wait a moment...");
  try {
    // Make sure the action isn't from a view (modal or app home)
    const projectGuid = fs.existsSync(dir)
      ? body?.actions[0].selected_option.value
      : null;
    const projects = fs.existsSync(dir)
      ? JSON.parse(fs.readFileSync("./json/projects.json"))
      : null;
    const phases = fs.existsSync(dir)
      ? fs.readFileSync("./json/phases.json", "utf-8")
      : null;

    const currentDate = new Date().getMonth();
    const foundProject = Object.values(projects).find(
      (item) => item.guid === projectGuid
    );
    // LATER USSAGE
    // const estimatedWorkhours = await fetchPhasesOfAProject(projectGuid).then(
    //   (data) => {
    //     return data.filter((item) => {
    //       item.parentPhase.guid === projectGuid && data <= currentDate;
    //     });
    //   }
    // );
    const estimatedWorkhours = JSON.parse(phases).filter((item) => {
      const date = new Date(item.deadline).getMonth();
      return item.project.guid === projectGuid && date === currentDate;
    });

    // workhours for invoicing -> total worked hours in current phase
    const totalWorkedHours = await totalProjectWorkhoursForInvoincing(
      projectGuid
    ).then((data) => {
      return data.reduce((prev, curr) => {
        const date = new Date(curr.eventDate).getMonth();
        if (date == currentDate) return prev + curr.quantity;
        return prev;
      }, 0);
    });

    const phaseCompletion = (
      (totalWorkedHours / estimatedWorkhours[0]?.workHoursEstimate) *
      100
    ).toFixed(2);

    const fields = displayProjectDetails(foundProject);
    fields.push(
      {
        type: "mrkdwn",
        text: `*Total hours in current phase:*\n${totalWorkedHours.toFixed(
          2
        )}h`,
      },
      {
        type: "mrkdwn",
        text: `*Current phase completion:*\n${!isNaN(phaseCompletion) ? phaseCompletion + "%" : "No data"
          }`,
      }
    );
    client.chat.postMessage({
      response_type: "in_channel",
      channel: body?.channel.id,
      text: "Hello, here are the options :slightly_smiling_face:",
      blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `*${foundProject.name}*`,
          },
        },
        {
          type: "section",
          fields: fields,
        },
      ],
    });
  } catch (error) {
    logger.error(error);
    const errorLogger = Logger(import.meta.url);
    errorLogger.error(error, "WINSTON");
    await say(
      `There's an error occurred. Please contact the development team.`
    );
  }
};

// To select specific user for hours
export const getPersonDetailsAction = async ({
  body,
  client,
  ack,
  logger,
  say,
  respond,
}) => {
  await ack();
  // await say("Please wait a moment...");
  try {
    // Make sure the action isn't from a view (modal or app home)
    if (body) {
      const memberGuid = body.actions[0].selected_option.value;
      const startOfMonth = moment().startOf("month").format("MM-DD-YYYY");
      const today = moment().format("MM-DD-YYYY");
      const hours = await paginatedFetch(
        `/users/${memberGuid}/workhours?startDate=${startOfMonth}&endDate=${today}`,
        "hours",
        "hour"
      );
    }
  } catch (error) {
    logger.error("errr", error);
    await say(
      `There's an error occurred. Please contact the development team.`
    );
  }
};
export const getCustomerDetailsAction = async ({
  body,
  client,
  ack,
  logger,
  say,
  respond,
}) => {
  await ack();
  // await say("Please wait a moment...");
  try {
    // Make sure the action isn't from a view (modal or app home)
    if (body) {
      const customerGuid = body?.actions[0].selected_option.value;
      const customers = JSON.parse(fs.readFileSync("./json/customers.json"));

      const foundCustomer = customers.find(
        (item) => item.guid === customerGuid
      );
      const fields = displayCustomerDetails(foundCustomer);

      client.chat.postMessage({
        response_type: "in_channel",
        channel: body.channel.id,
        text: "Hello, here are the options :slightly_smiling_face:",
        blocks: [
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: `*${foundCustomer.name}*`,
            },
          },
          {
            type: "section",
            fields: fields,
          },
        ],
      });
    }
  } catch (error) {
    logger.error("errr", error);
    await say(
      `There's an error occurred. Please contact the development team.`
    );
  }
};

export const triggerAccept = async ({
  body,
  client,
  ack,
  logger,
  say,
  respond,
}) => {
  await ack();
  await say("Please wait a moment...");

  try {
    // Make sure the action isn't from a view (modal or app home)
    const {
      user: { id, name },
      actions,
    } = body;
    googleSpreadSheet();
    await say("Nice!");
  } catch (error) {
    logger.error(error);
    await say(
      `There's an error occurred. Please contact the development team.`
    );
  }
};
