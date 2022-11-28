/**
 * All API calls are placed here.
 */
import axios from "axios";
import * as fs from "fs";
import { google } from "googleapis";
import moment from "moment";
import { botToken, SLACK_API, BASE_URL } from "../data/keys.js";
import { log } from "../setup/logger.js";
import * as dotenv from 'dotenv'
import { pause } from "./utils.js";
dotenv.config()


const instance = axios.create({
  baseURL: BASE_URL,
});

const tokenObject = JSON.parse(fs.readFileSync("./data/token.json", "utf-8"));

// ------------- SETUP PHASE --------------
/**
 * Retrieve token.
 * @param {string} tokenType - type of value. E.g: Projects, Hours, Fees, Invoices, Settings, etc.
 * @param {string} logType 
 * @returns {object} token
 */
export const getToken = async (tokenType, logType) => {
  try {
    const response = await instance.post('/token', {
      client_Id: process.env.SLACK_CLIENT_ID,
      client_Secret: process.env.SLACK_CLIENT_SECRET,
      scope: `${tokenType}:read`
    })

    fs.writeFileSync(
      "./data/token.json",
      `${mapDataToTokenFile(response?.data?.access_token, tokenType)}`
    );

    log.info(`TOKEN -- ${(logType.toUpperCase())} - fetched`);
    return response.data;
  } catch (error) {
    log.error(`${logType} error`);
  }
};


/**
 * Fetch data using @param token
 * @param {string} url 
 * @param {string} token 
 * @param {number} rowCount 
 * @param {number} firstRow 
 * @returns {object} data contain access token, refresh token, timeout, etc.
 */
const fetchData = async (url, token, rowCount, firstRow) => {

  const data = await instance.get(`${url.includes("?") ? `${url}&` : `${url}?`
    }rowCount=${rowCount}&firstRow=${firstRow}`, {
    headers: {
      client_Id: process.env.SLACK_CLIENT_ID,
      Authorization: `Bearer ${token}`,
    },
  })
  return data
}



const mapDataToTokenFile = (token, tokenType) => {
  tokenObject[tokenType] = token;
  return JSON.stringify(tokenObject);
};

/**
 * Fetch all values in the paginated API
 * @param {string} url - URL path.
 * @param {string} type - type of value. E.g: Projects, Hours, Fees, Invoices, Settings, etc.
 * @param {number} rowCount - default value - determine how many rows per fetch. E.g: Default: 20, Max: 1000.
 * @param {number} firstRow - default value - determine first row starts. E.g: 0-999, 1000-1999, etc.
 * @returns
 */
export const fetchDataByRowCount = async (
  url,
  tokenType,
  logType,
  rowCount = 1000,
  firstRow = 0
) => {
  // // Add a request interceptor
  // instance.interceptors.request.use(function (config) {
  //   // Do something before request is sent
  //   return config;
  // }, function (error) {
  //   // Do something with request error
  //   return Promise.reject(error);
  // });

  try {
    const data = await fetchData(url, tokenObject[tokenType], rowCount, firstRow)
    return data.data;

  } catch (error) {

    if (error?.response?.data?.error?.httpStatusCode === 401) {
      const newToken = await getToken(tokenType, logType)

      const data = await fetchData(url, newToken?.access_token, rowCount, firstRow)
      return data.data;
    }
    console.log(error, 'error in fetchDataByRow');
  }
};


/**
 * Fetch all values in the paginated API
 * @param {string} url - base URL.
 * @param {string} type - type of value. E.g: Projects, Hours, Fees, Invoices, Settings, etc.
 * @param {number} rowCount - default value - determine how many rows per fetch. E.g: Default: 20, Max: 1000.
 * @param {number} firstRow - default value - determine first row starts. E.g: 0-999, 1000-1999, etc.
 * @returns {JSON}
 */
export const paginatedFetch = async (
  url,
  tokenType,
  logType,
  rowCount = 1000,
  firstRow = 0
) => {
  let total = [];
  let numberOfRows = firstRow;
  // let numberOfRows = firstRow;
  // const token = accessToken[type];
  try {
    while (true) {
      let res = await fetchDataByRowCount(
        url,
        tokenType,
        logType,
        rowCount,
        numberOfRows
      );
      if (res) total = [...total, ...res];

      numberOfRows += 1000;
      if (res?.length <= 0) break;
    }
    log.info(`DATA -- ${(logType.toUpperCase())} fetched: ${total?.length}`);
    return total;
  } catch (error) {
    log.error(`${error}`);
  }
};

// ----------------- FETCH ------------------
export const totalSlackUsers = async () => {
  try {
    const result = await axios({
      method: "get",
      url: `${SLACK_API}/users.list`,
      headers: {
        Authorization: `Bearer ${botToken}`,
      },
    });
    const slackUsers = result?.data?.members
      ?.map(
        ({
          id,
          team_id,
          deleted,
          name,
          is_bot,
          profile: { real_name, title, phone },
        }) => {
          if (name.includes("bot")) return;
          return {
            id,
            team_id,
            name,
            real_name,
            title,
            phone,
            is_bot,
            deleted,
          };
        }
      )
      .filter((user) => user?.deleted === false);
    log.info(`DATA -- SLACK USERS fetched: ${slackUsers.length}`);
    writeFileToJSON("slackUsers", slackUsers);
  } catch (error) {
    log.error(`${error}`);
  }
};

export const totalProjectWorkhoursForInvoincing = async (projectGuid) => {
  try {
    const startDate = moment().startOf("month").format("MM-DD-YYYY");
    const currentDate = moment().format("MM-DD-YYYY");

    const totalWorkhours = await paginatedFetch(
      `/projects/${projectGuid}/workhours?startDate=${startDate}&endDate=${currentDate}`,
      "hours",
      "hours"
    );
    return totalWorkhours;
  } catch (error) {
    console.log(error, "hours");
  }
};

export const getWorkhoursById = async (userId) => {
  try {
    const startDate = moment().subtract(7, "d").format("MM-DD-YYYY");
    const endDate = moment().subtract(2, "d").format("MM-DD-YYYY");
    // console.log(startDate, endDate, "date");
    const totalHours = await paginatedFetch(
      `/users/${userId}/workhours?startDate=${startDate}&endDate=${endDate}`,
      "hours",
      "hours"
    );
    return totalHours;
  } catch (error) {
    console.log(error, "hours");
  }
};

export const getWorkhoursByProject = async (projectId) => {
  try {
    const totalHours = await paginatedFetch(
      `/projects/${projectId}/workhours`,
      "hours",
      "hours"
    );
    return totalHours;
  } catch (error) {
    console.log(error, "hours");
  }
};

export const totalPhases = async () => {
  try {
    const allPhases = await paginatedFetch(
      `/phases`,
      "projects",
      "phases"
    );
    writeFileToJSON("phases", allPhases);
    return allPhases;
  } catch (error) {
    console.log(error, "phases");
  }
};
export const totalHours = async () => {
  try {
    const allHours = await paginatedFetch(
      `/workhours`,
      "hours",
      "hours"
    );
    writeFileToJSON("hours", allHours);
    return allHours;
  } catch (error) {
    console.log(error, "hours");
  }
};

/**
 * Fetch all ACTIVE projects -- isClosed = false
 * @returns all projects & write to projects.josn
 */
export const totalProjects = async () => {
  try {
    const allProjects = await paginatedFetch(
      `/projects?isClosed=false`,
      "projects",
      "projects"
    );

    writeFileToJSON("projects", allProjects);
    return allProjects;
  } catch (error) {
    console.log(error, "projects");
  }
};

/**
 * Fetch all ACTIVE customers
 * @returns
 */
export const totalCustomers = async () => {
  try {
    const allCustomers = await paginatedFetch(
      "/customers?active=true",
      "customers",
      "customers"
    );
    writeFileToJSON("customers", allCustomers);
    return allCustomers;
  } catch (error) {
    console.log(error, "customers");
  }
};

export const totalSeveraUsers = async () => {
  try {
    const allMembers = await paginatedFetch(
      "/users?active=true",
      "users",
      "Severa users"
    );
    writeFileToJSON("severaUsers", allMembers);
    return allMembers;
  } catch (error) {
    console.log(error, "members");
  }
};

export const fetchPhasesOfAProject = async () => {
  const allProjects = await paginatedFetch(
    `/phases/?projectGuid=0948f2a6-696b-4587-a2c0-95e8a61a94b5`,
    "projects",
    "projects"
  );
  return allProjects;
};

// ---------------- UTILITIES -------------------

export const writeFileToJSON = (fileType, array) => {
  return fs.writeFile(
    `./json/${fileType}.json`,
    JSON.stringify(array),
    "utf-8",
    (err) => {
      if (err) console.log(err);
    }
  );
};

// ------------------------------------------------ END -------------------------------------------------
// ======================================================================================================
export const googleSpreadSheet = async () => {
  const auth = new google.auth.GoogleAuth({
    keyFile: "./json/keys.json", //the key file
    url: `https://docs.google.com/spreadsheets/d/18GZX_Ly6mToW2I_Grw-OmhaK6DbX8E_SWyABftarZUk/edit?usp=sharing`,
    scopes: "https://www.googleapis.com/auth/spreadsheets",
  });

  //Auth client Object
  const authClientObject = await auth.getClient();

  //Google sheets instance
  const googleSheetsInstance = google.sheets({
    version: "v4",
    auth: authClientObject,
  });

  // spreadsheet id
  const spreadsheetId = "18GZX_Ly6mToW2I_Grw-OmhaK6DbX8E_SWyABftarZUk";

  //Read from the spreadsheet
  const readData = await googleSheetsInstance.spreadsheets.values.get({
    auth, //auth object
    spreadsheetId, // spreadsheet id
    range: "Sheet1!A:A", //range of cells to read from.
  });

  //write data into the google sheets
  await googleSheetsInstance.spreadsheets.values.append({
    auth, //auth object
    spreadsheetId, //spreadsheet id
    range: "Sheet1!A:B", //sheet name and range of cells
    valueInputOption: "USER_ENTERED", // The information will be passed according to what the usere passes in as date, number or text
    resource: {
      values: [["Duong", "Test"]],
    },
  });
};
