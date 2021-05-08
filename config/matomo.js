// config/matomo.js

require('dotenv').config()

export default {
    url: process.env.MATOMO_URL,
    id: process.env.MATOMO_ID,
    token: process.env.MATOMO_TOKEN_AUTH,
}