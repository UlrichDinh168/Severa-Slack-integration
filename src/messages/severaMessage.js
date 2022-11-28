import * as fs from "fs";
import {
  groupProjectsByCriteria,
  groupProjectsByPM,
  workhourMessage,
} from "../../utils/utils.js";
import { Slackbot } from "../../index.js";
import { messageToPM } from "../../utils/index.js";

export const cleanupProjects = async () => {
  const dir = "./json";

  const allProjects = fs.existsSync(dir)
    ? JSON.parse(fs.readFileSync("./json/projects.json"))
    : null;
  const categorizedProjects = groupProjectsByCriteria(allProjects);
  if (allProjects.length < 0) return;


  const projectsByPM = await Promise.all(
    categorizedProjects?.map((projectArr, i) => {
      // if (i == 2) return;
      // if (i == 1) return;
      // if (i == 3) return;
      // if (projectArr.length === 0) return;
      return groupProjectsByPM(projectArr);
    })
  );

  const filteredGroupedProjectsByPM = projectsByPM.filter((i) => i); //remove undefined values
  return filteredGroupedProjectsByPM;
};

export const postMessageToSlack = async (app, arrayOfProjects, next) => {
  await arrayOfProjects?.forEach((item, i) => {
    if (i === 0)
      return messageToPM(app, arrayOfProjects[i], "deadline", "over");
    if (i === 1) return messageToPM(app, arrayOfProjects[i], "budget", "over");
    if (i === 2) return messageToPM(app, arrayOfProjects[i], "budget");
    if (i === 3) return messageToPM(app, arrayOfProjects[i], "deadline");
    return messageToPM(app, arrayOfProjects[i]);
  });

  !next ? null : next(arrayOfProjects);
};

export const workhourNotification = async (app) => {
  return workhourMessage().then((res) => {
    return messageToPM(app, res, "workhour");
  });
};

// UNUSED
export const postMessage = async () => {
  // 1 week = 604800
  let timeMarked = 1648019340; // in seconds
  let storedTime = 0;

  setInterval(() => {
    storedTime += 10;
    console.log(storedTime, "storeTIme");
    return Slackbot.client.chat.scheduleMessage({
      channel: "U02MH50794G",
      text: "s",
      // post_at: timeMarked + storedTime,
      blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: "You have a new request:\n*<fakeLink.toEmployeeProfile.com|Fred Enriquez - New device request>*",
          },
        },
      ],
    });
  }, 120000);
};
