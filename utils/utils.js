import * as fs from "fs";
import moment from "moment";
import { EXCLUDED_PERSON_LIST, EXCLUDED_PROJECT_LIST } from "./constant.js";
import { channel, person, BASE_URL } from "../data/keys.js";
import { getWorkhoursById, getWorkhoursByProject } from "./api.js";

// ------------------- DISPLAY --------------------
/**
 * display messages base on @param typeOfMessage and @param typeOfStatus
 * @param {string} key 
 * @param {string} typeOfMessage 
 * @param {string} typeOfStatus 
 * @returns {string} message
 */
export const displayTitle = (key, typeOfMessage, typeOfStatus) => {
  return typeOfMessage === "deadline"
    ? typeOfStatus === "over"
      ? `:wave: ${key}! Please note that you have still projects marked as open. Check final invoices and close the project when possible.`
      : `:wave: ${key}! Please note that the deadline for one or several of your projects is approaching.`
    : typeOfMessage === "budget"
      ? typeOfStatus === "over"
        ? `:wave: ${key}! One or several of your projects has run out of remaining resource capacity; please check and apply change management protocol if necessary.`
        : `:wave: ${key}! Please note that one or several of your projects have used 80% of allocated resources. Please review and consider change management if necessary.`
      : `:wave: ${key}! Please note that one or several of your projects have used 80% of allocated resources and the deadline is approaching. Please review and consider change management if necessary.`;
};

export const displayProjectLink = (projectGuid) => {
  return `${BASE_URL}/project/${projectGuid}/production`;
};


/**
 * render message about project's details
 * @param {array} arrayOfProjects
 * @returns 
 */
export const displayProjectDetails = ({
  customer,
  projectOwner,
  businessUnit,
  customerContact,
  deadline,
  calculatedCompletionPercentage,
}) => {
  return [
    {
      type: "mrkdwn",
      text: `*Customer:*\n${customer.name}`,
    },
    {
      type: "mrkdwn",
      text: `*Project Owner:*\n${projectOwner.name}`,
    },
    {
      type: "mrkdwn",
      text: `*Business Unit:*\n${businessUnit.name}`,
    },
    {
      type: "mrkdwn",
      text: `*Contact person:*\n${customerContact.name}`,
    },
    {
      type: "mrkdwn",
      text: `*Deadline:*\n${deadline ? deadline : "No data"}`,
    },
    {
      type: "mrkdwn",
      text: `*Completion percentage:*\n${!!calculatedCompletionPercentage
        ? calculatedCompletionPercentage + "%"
        : "No data"
        }`,
    },
  ];
};

/**
 * 
 * @param {number} hours 
 * @returns 
 */
export const displayPersonWorkedHours = (hours) => {
  const hourObj = hours?.reduce((result, object) => {
    // return { name: object.project.name, time: object.quantity };
    if (!result[object.project.name]) {
      result[object.project.name] = { totalHours: 0 };
    }
    result[object.project.name].totalHours += object.quantity;
    return result;
  }, {});

  let res = [];
  for (let key in hourObj) {
    const message = {
      type: "mrkdwn",
      text: `*${key}:* ${hourObj[key].totalHours.toFixed(1)} hours`,
    };
    res.push(message);
  }
  return res;
};


/**
 * render message about customer's details
 * @param {object} objectOfCustomers
 * @returns {array}
 */
export const displayCustomerDetails = ({
  language: { name: language },
  owner: { name: ownerName },
  headquarterAddress: { addressline, postalCode, city, country },
  timezone: { name: timeZone },
}) => {
  return [
    {
      type: "mrkdwn",
      text: `*Language:*\n${language}`,
    },
    {
      type: "mrkdwn",
      text: `*Project Owner:*\n${ownerName}`,
    },
    {
      type: "mrkdwn",
      text: `*Time zone:*\n${timeZone}`,
    },
    {
      type: "mrkdwn",
      text: `*Headquarter Address:*\n${addressline} ${city} ${postalCode},${country}`,
    },
  ];
};

export const mapObjectToMessage_Budget = (item, type) => {
  let res = [];
  item?.forEach((el) => {
    const message = {
      type: "mrkdwn",
      text: ` *<${displayProjectLink(el.guid)}|${el.name}>* \n *Deadline:* ${el.deadline ? el.deadline : "No data"
        }\n *Resourcing used:*  ${el.sumWorkedHours} / ${el.sumEstimatedHours} ( ${!!el.calculatedCompletionPercentage
          ? el.calculatedCompletionPercentage + "%"
          : "No data"
        } ) \n \n `,
    };
    res.push(message);
  });
  return res;
};

export const mapObjectToMessage_Deadline = (item, type) => {
  let res = [];
  item?.forEach((el) => {
    const message = {
      type: "mrkdwn",
      text: ` *<${displayProjectLink(el.guid)}| ${el.name}>*\n *Deadline:* ${el.deadline ? el.deadline : "No data"
        }\n *Resourcing used:*  ${el.sumWorkedHours} / ${el.sumEstimatedHours
        } ( ${!!el.calculatedCompletionPercentage
          ? el.calculatedCompletionPercentage + "%"
          : "No data"
        } ) \n \n
      `,
    };
    res.push(message);
  });
  return res;
};

// ---------------- GENERATE OPTIONS --------------------
export const generateNameOptions = (array) => {
  return array.map((item) => {
    const data = {
      text: {
        type: "plain_text",
        text: `${item.firstName} ${item.lastName}`,
      },
      value: `${item.guid}`,
    };
    return data;
  });
};

export const generateProjectOptions = (array) => {
  return array.map((item) => {
    const data = {
      text: {
        type: "plain_text",
        text: `${item.name.length >= 71 ? item.name.slice(0, 70) : item.name}`,
      },
      value: `${item.guid}`,
    };
    return data;
  });
};

// ------------------ GROUPING -------------------
export const displayOverBudgetProjects = (projects) => {
  const projectObj = projects.reduce(
    (
      result,
      { projectOwner, name, customer, deadline, calculatedCompletionPercentage }
    ) => {
      if (!result[projectOwner.name]) {
        result[projectOwner.name] = {
          customer: customer,
          deadline: deadline,
          calculatedCompletionPercentage: calculatedCompletionPercentage,
        };
      }
      return result;
    },
    {}
  );
  let res = [];
  for (let key in projectObj) {
    const message = {
      type: "mrkdwn",
      text: `*${key}:* ${projectObj[key]}`,
    };
    res.push(message);
  }
  return res;
};

/**
 * 
 * @param {array} arrayOfProjects 
 * @returns {object} group
 */
export const groupProjectsByPM = async (arrayOfProjects) => {
  let group = {};

  const dir = "./json";
  const estimatedHours = fs.existsSync(dir)
    ? JSON.parse(fs.readFileSync("./json/phases.json", "utf-8"))
    : null;

  for (let item of arrayOfProjects) {
    const {
      guid,
      projectOwner: { name: POName },
      name,
      customer: { name: customerName },
      deadline,
      calculatedCompletionPercentage,
    } = item;
    const totalWorkhours = await getWorkhoursByProject(guid);
    const sumWorkedHours = totalWorkhours?.reduce((acc, cur) => {
      return acc + cur.quantity;
    }, 0);

    const filteredEstimatedHours = estimatedHours?.filter(
      (item) => item.project.guid === guid
    );

    const sumEstimatedHours = filteredEstimatedHours?.reduce((acc, cur) => {
      return acc + cur.workHoursEstimate;
    }, 0);

    group[POName] = group[POName] || [];
    group[POName].push({
      guid,
      name,
      POName,
      customerName,
      deadline,
      calculatedCompletionPercentage,
      sumEstimatedHours,
      sumWorkedHours: Number.isInteger(sumWorkedHours)
        ? sumWorkedHours
        : sumWorkedHours.toFixed(1),
    });
  }
  return group;
};

// export const groupProjectsByPM = async (listOfProjects) => {
//   // function timeout(ms) {
//   //   return new Promise((resolve) => setTimeout(resolve, ms));
//   // }

//   // async function sleep(fn, time, ...args) {
//   //   await timeout(time);
//   //   return fn(...args);
//   // }
//   const result = await fetchAndAddHoursToProjects(listOfProjects);
//   return result;
// };

/**
 * group arrayOfProjects into smaller groups based on conditions
 * @param {array} array 
 * @returns {array} array of array of projects
 */
export const groupProjectsByCriteria = (array) => {
  const today = moment();
  const oneWeekBefore = moment().add(7, "d");
  // 4 cases of the parent arrays
  const arrayOverDeadline_overBudget = [];
  const arrayOverDeadline_withinBudget = [];

  const arrayOneWeekDeadline_overBudget = [];
  const arrayOneWeekDeadline_withinBudget = [];

  const arrayOverDeadline = [];
  const arrayOverBudget = [];
  const arrayWithinDeadline = [];
  const arrayWithinBudget = [];
  array.forEach((item) => {
    if (item.projectOwner.name === "Admin* -") return;
    if (EXCLUDED_PROJECT_LIST.includes(item.name)) return;

    // ONE CONDITION
    if (moment(item.deadline) <= today) arrayOverDeadline.push(item);
    if (moment(item.deadline) > today && moment(item.deadline) <= oneWeekBefore)
      arrayWithinDeadline.push(item);
    if (item.calculatedCompletionPercentage >= 100) arrayOverBudget.push(item);
    if (
      item.calculatedCompletionPercentage >= 80 &&
      item.calculatedCompletionPercentage < 100 &&
      item.calculatedCompletionPercentage !== null)
      arrayWithinBudget.push(item);

    // TWO CONDITIONS
    // over deadline && over budget ---- (deadline <= today) && (budget > 100%)
    if (
      moment(item.deadline) <= today &&
      item.calculatedCompletionPercentage >= 100
    )
      arrayOverDeadline_overBudget.push(item);
    // over deadline && within budget ---- (deadline <= today) && (80% < budget < 100%)
    if (
      moment(item.deadline) <= today &&
      item.calculatedCompletionPercentage < 100 &&
      moment(item.deadline) <= today &&
      item.calculatedCompletionPercentage > 80
    )
      arrayOverDeadline_withinBudget.push(item);
    // within deadline && within budget ---- (today < deadline < oneWeekBefore) && (80% < budget < 100%)
    if (
      moment(item.deadline) > today &&
      moment(item.deadline) <= oneWeekBefore &&
      item.calculatedCompletionPercentage < 100 &&
      item.calculatedCompletionPercentage >= 80
    )
      arrayOneWeekDeadline_withinBudget.push(item);
    // within deadline && over budget ---- (today < deadline < oneWeekBefore) && (budget > 100%)
    if (
      moment(item.deadline) > today &&
      moment(item.deadline) < oneWeekBefore &&
      item.calculatedCompletionPercentage >= 100
    )
      arrayOneWeekDeadline_overBudget.push(item);
  });
  const arrayOverBudgetOnly = arrayOverBudget.filter(
    (item) =>
      !arrayOverDeadline_overBudget.includes(item) &&
      !arrayOneWeekDeadline_overBudget.includes(item)
  );

  const arrayOverDeadlineOnly = arrayOverDeadline.filter(
    (item) =>
      !arrayOverDeadline_overBudget.includes(item) &&
      !arrayOverDeadline_withinBudget.includes(item)
  );

  const arrayWithinBudgetOnly = arrayWithinBudget.filter(
    (item) =>
      !arrayOneWeekDeadline_withinBudget.includes(item) &&
      !arrayOverDeadline_withinBudget.includes(item)
  );

  const arrayWithinDeadlineOnly = arrayWithinDeadline.filter(
    (item) =>
      !arrayOneWeekDeadline_withinBudget.includes(item) &&
      !arrayOneWeekDeadline_overBudget.includes(item)
  );

  const hardDeadlineWarningProjects = [
    ...arrayOverDeadline_overBudget,
    ...arrayOverDeadline_withinBudget,
    ...arrayOverDeadlineOnly,
  ];
  const hardBudgetWarningProjects = [
    ...arrayOneWeekDeadline_overBudget,
    ...arrayOverBudgetOnly,
  ];

  // arrayOverDeadline_overBudget, // hard deadline warning
  // arrayOverDeadline_withinBudget, // hard deadline warning
  // arrayOverDeadlineOnly, // hard deadline warning

  // arrayOneWeekDeadline_overBudget, // hard budget warning
  // arrayOverBudgetOnly, // hard budget warning

  // arrayOverBudget,
  // arrayOverDeadline,
  // arrayWithinBudget,
  // arrayWithinDeadline,

  // arrayWithinBudgetOnly, // soft budget warning
  // arrayWithinDeadlineOnly, // soft deadline warning

  return [
    hardDeadlineWarningProjects,
    hardBudgetWarningProjects,
    arrayWithinBudgetOnly,
    arrayWithinDeadlineOnly,
    arrayOneWeekDeadline_withinBudget, // soft deadline + budget warning
  ];
};

// --------------------- SLACK INTERACTION --------------------------

/**
 * post message to Slack based on conditions
 * @param {any} app 
 * @param {string} key 
 * @param {array} array 
 * @param {string} typeOfMessage 
 * @param {string} typeOfStatus 
 * @returns 
 */
export const messageFunction = async (
  app,
  key,
  array,
  typeOfMessage,
  typeOfStatus
) => {
  const dir = "./json";

  const listOfSlackUsers = fs.existsSync(dir)
    ? fs.readFileSync("./json/slackUsers.json", "utf8")
    : null;

  const foundPM = JSON.parse(listOfSlackUsers).find((item) => {
    if (item === null) return;
    return item.real_name.includes(key);
  });

  if (foundPM === undefined) {
    console.log(foundPM, key, "found");
    return;
  }

  let fields;
  switch (typeOfMessage) {
    case "deadline":
      fields = mapObjectToMessage_Deadline;
      break;
    case "budget":
      fields = mapObjectToMessage_Budget;
      break;
    default:
      fields = mapObjectToMessage_Budget;
      break;
  }

  // ------------ WORKHOUR --------------
  if (typeOfMessage === "workhour") {
    // TODO: refactor + move to another function
    return await app.client.chat.postMessage({
      response_type: "in_channel",
      channel: `${person ? person : foundPM?.id
        }`,
      // channel: foundPM?.id,

      text: "Work hours allocation",
      blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `:wave: ${key}! Seems you haven't logged in your hours for last week; please make sure to do so as soon as convenient.`,
          },
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `:mc-heart-2021: MC Bot`,
          },
        },
        {
          type: "divider",
        },
      ],
    });
  }

  // If projects reach 100% => inform both PMs, Operation Management Team.
  // TODO: refactor + move to another function
  if (typeOfStatus === "over") {
    try {
      // Post message to Operation Management Team channel.
      await app.client.chat.postMessage({
        response_type: "in_channel",
        channel: `${channel}`, // <-- CHANGE
        text: "Work hours allocation",
        blocks: [
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: `Monitor alerts for *${key}*`,
            },
          },
          {
            type: "section",
            fields: fields(array),
          },
          {
            type: "divider",
          },
        ],
      });
    } catch (error) {
      console.log(error, "OVER-ERROR");
    }
  }
  // TODO: refactor + move to another function
  // Post message to project managers in the list.
  await app.client.chat.postMessage({
    response_type: "in_channel",
    channel: `${person ? person : foundPM?.id
      }`,
    // channel:  foundPM?.id,
    text: "Work hours allocation",
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: displayTitle(key, typeOfMessage, typeOfStatus),
        },
      },
      {
        type: "section",
        fields: fields(array),
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `:mc-heart-2021: MC Bot`,
        },
      },
      {
        type: "divider",
      },
    ],
  });
};

const groupProjectsByPM_workhours = (array) =>
  array.reduce((group, { id, name }) => {
    group[name] = group[name] || [];
    group[name].push({ id });
    return group;
  }, []);

export const workhourMessage = async () => {
  const dir = "./json";
  let arrayOfIds = [];

  const allSeveraMembers = fs.existsSync(dir)
    ? JSON.parse(fs.readFileSync("./json/severaUsers.json", "utf-8"))
    : null;

  allSeveraMembers.map(({ guid, firstName, lastName }) => {
    if (EXCLUDED_PERSON_LIST.includes(guid)) return;

    arrayOfIds.push({ id: guid, name: `${firstName} ${lastName}` });
  });


  const fetchWorkhourById = async () => {
    let result = [];
    for (const item of arrayOfIds) {
      const { id, name } = item;
      const data = await getWorkhoursById(id);
      if (data.length === 0) result.push(item);
    }
    return groupProjectsByPM_workhours(result);
  };

  const res = await fetchWorkhourById();
  return res;
};

// --------------- UTILITIES -----------------
// export const sliceIntoChunks = (arr, chunkSize, key) => {
//   const res = [];
//   for (let i = 0; i < arr.length; i += chunkSize) {
//     let chunk = [];
//     chunk[key] = arr.slice(i, i + chunkSize);
//     res.push(chunk);
//   }
//   return res;
// };

/**
 * divide array into chunks of child arrays
 * @param {array} arr 
 * @param {number} chunkSize 
 * @param {number} key 
 * @returns {array}
 */
export const sliceIntoChunks = (arr, chunkSize, key) => {
  const res = [];
  for (let i = 0; i < arr.length; i += chunkSize) {
    const store = arr.slice(i, i + chunkSize);
    res.push(store);
  }
  return res;
};


export const pause = (time, response) => {
  return new Promise(function (resolve, reject) {
    setTimeout(function () { resolve(response); }, time);
  });
};

// --------------------------------------------- END -----------------------------------------------
// =================================================================================================
export const plankNotification = (app) => {
  app.client.chat.postMessage({
    response_type: "in_channel",
    channel: "U02MH50794G",
    // channel: foundPM.id,
    text: "It's plank time ladies and gentlemen :fireworks:",
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: "A",
        },
        accessory: {
          type: "image",
          image_url:
            "https://api.slack.com/img/blocks/bkb_template_images/approvalsNewDevice.png",
          alt_text: "computer thumbnail",
        },
      },
      {
        type: "actions",
        elements: [
          {
            type: "button",
            text: {
              type: "plain_text",
              emoji: true,
              text: "Approve",
            },
            style: "primary",
            action_id: "accept_button",
            value: "accept",
          },
          {
            type: "button",
            text: {
              type: "plain_text",
              emoji: true,
              text: "Deny",
            },
            style: "danger",
            value: "click_me_123",
          },
        ],
      },
    ],
  });
};
