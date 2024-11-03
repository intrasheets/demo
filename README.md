# Intrasheets 3 - Quick Start

This software requires a license. Please visit https://jspreadsheet.com to generate a free demo license.

## Setup Intrasheets

### Start Server

Open the terminal:

1. git clone https://github.com/intrasheets/demo.git intrasheets
2. cd intrasheets/server
3. Edit your .env file to include your Jspreadsheet and S3 keys.
4. docker-compose up

### Start Client

Open another terminal:

1. cd intrasheets/web
2. npm install
3. npm run start
4. Go to your browser: http://localhost:8000/

### Authentication

The example relies on the localStorage Intrasheets JWT. You can integrate this with your application to generate real JWTs.

Ensure that your server-side code in `server/src/index.js` is configured with the appropriate signature verification logic to validate JWTs.
