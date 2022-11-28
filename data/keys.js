import * as dotenv from 'dotenv'
dotenv.config()

export const signingSecret = process.env.SIGNING_SECRET;
export const botToken = process.env.BOT_TOKEN;
export const appToken = process.env.APP_TOKEN;
export const port = 8080;


export const BASE_URL = "https://api.severa.visma.com/rest-api/v0.2"
export const SLACK_API = "https://slack.com/api"
export const SEVERA_BASE_URL = "https://severa.visma.com"

const TEST_CHANNEL = "C03AJ4JP955" // change Slack channel
const TEST_PERSON = "U02MH50794G" // change perons's own channel

const PROD_CHANNEL = "C039P3GD4F4" // OMT channel

export const channel = process.env.NODE_ENV === 'production' ? PROD_CHANNEL : TEST_CHANNEL

export const person = process.env.NODE_ENV === 'development' ? TEST_PERSON : null


// export const PROD_CHANNEL="C031B78PLBF" // Production test channel


console.log(process.env.NODE_ENV, 'process.env.NODE_ENV');

export {
  TEST_CHANNEL, TEST_PERSON, PROD_CHANNEL
}