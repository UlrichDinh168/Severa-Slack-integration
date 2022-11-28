import * as fs from "fs";
import { Slackbot } from "../index.js";
import moment from "moment";
import { channel, person } from "../data/keys.js";

import {
  messageFunction,
  sliceIntoChunks,
  displayProjectLink,
} from "./utils.js";
import { createArrayCsvWriter } from "csv-writer";

export const messageToPM = async (
  app,
  listOfProjects,
  typeOfMessage = null,
  typeOfStatus = null
) => {
  return Object.keys(listOfProjects).forEach((key, index) => {
    // if (key !== "Duong Dinh") return;
    // setTimeout to limit the sends to 1message/1s
    // else it's gonna break Slack
    setTimeout(() => {
      if (listOfProjects[key].length > 10) {
        const st = sliceIntoChunks(listOfProjects[key], 10);
        return st.forEach((item) => {
          messageFunction(app, key, item, typeOfMessage, typeOfStatus);
        });
      }
      messageFunction(
        app,
        key,
        listOfProjects[key],
        typeOfMessage,
        typeOfStatus
      );
    }, 1000 * (index + 1));
  });
};

export const postCsvToChannel = async (arrayOfProjects) => {
  const date = moment().format("DD-MM-YYYY");
  const arrayOfProjects_Over_CSV = [
    JSON.parse(JSON.stringify(arrayOfProjects[0])),
    JSON.parse(JSON.stringify(arrayOfProjects[1])),
  ];
  const headers = [
    [
      "PROJECT MANAGER",
      "PROJECT NAME",
      "CUSTOMER NAME",
      "DEADLINE",
      "TOTAL ESTIMATED HOURS",
      "TOTAL WORKED HOURS",
      "RESOURCING",
      "LINK",
    ],
  ];

  const csvWriter = createArrayCsvWriter({
    path: `./reports/${date}.csv`,
    append: true,
  });

  const records = (object) => [
    [
      object?.POName,
      object?.name,
      object?.customerName,
      object?.deadline,
      object?.sumEstimatedHours,
      object?.sumWorkedHours,
      object?.calculatedCompletionPercentage,
      displayProjectLink(object?.guid),
    ],
  ];

  const writeHeader = () => {
    return new Promise((resolve) => {
      csvWriter.writeRecords(headers);
      resolve("done header!");
    });
  };

  const writeContent = () => {
    return arrayOfProjects_Over_CSV.forEach((objectOfPM) => {
      Object.values(objectOfPM).forEach((objectOfProjectsByPM, key) => {
        return objectOfProjectsByPM.forEach((arrayOfProjects) => {
          const b = records(arrayOfProjects);
          csvWriter.writeRecords(b);
          return;
        });
      });
    });
  };

  const writeFileFunc = async () => {
    await writeHeader()
    await writeContent();
    console.log("done");
  }


  const dir = './reports';
  const filePath = `./reports/${date}.csv`;

  // check folder exist
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
    await writeFileFunc()
  }

  // Remove if file already exists. Else, it'll add dupplicated values to CSV file
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    console.log("File existed. Ready to be deleted");
    return await writeFileFunc()
  }
  await writeFileFunc()

  const CSVfile = fs.createReadStream(`./reports/${date}.csv`);

  try {
    // Post message to Operation Managesment Team channel.
    await Slackbot.client.files.upload({
      response_type: "in_channel",
      channels: `${channel}`, // <-- CHANGE
      initial_comment: "Weekly report",
      file: CSVfile,
    });
  } catch (error) {
    console.log(error, "error");
  }
};
