'use strict';

/**
 * Facebook Messenger Webhook with Direqt Platform Integration.
 *
 * Available environment variable overrides (see detailed descriptions at
 * definition below):
 *
 *  PAGE_ACCESS_TOKEN - obtained from Facebook Messenger settings.
 *  VERIFY_TOKEN - provided by webook (not necessary for testing).
 *  DIREQT_API_KEY - obtained from Direqt Console (not necessary for testing).
 */
const express = require('express');
const request = require('request');
const app = express().use(require('body-parser').json());

/**
 * Page Access token supplied by Facebook.
 *
 * Obtain this token for the appropriate page by visiting:
 *  Messenger settings console | "Token Generation" | "Select a Page"
 */
const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN || "<invalid>";

/**
 * Verify token for our webhook.
 *
 * This token is defined by the webhook, and provided to FB via:
 *  Messenger settings console | "Setup Webhooks" | "Verify Token"
 *
 * You should change this token if you are deploying a production webhook.
 */
let VERIFY_TOKEN = process.env.VERIFY_TOKEN || "<provide-your-own-secure-token>";

/**
 * Direqt API key.
 *
 * You can leave this unchanged to use the playground API key, or you can
 * supply your own API key which can be obtained from the Direqt Console
 * (https://console.direqt.io) at:
 *
 *  Direqt Console | <Account Name> | "API Keys"
 *
 *  Note that by default, Direqt's /fetch endpoint does not require authentication
 *  and so you should leave DIREQT_API_SECRET empty unless you have a custom
 *  configuration that requires it.
 */
const DIREQT_PLAYGROUND_API_KEY = "5rp26o1WB5IBQ6gVTg"; // acceptable for use in testing
const DIREQT_API_KEY = process.env.DIREQT_API_KEY || DIREQT_PLAYGROUND_API_KEY;
const DIREQT_API_SECRET = process.env.DIREQT_API_SECRET || null;

const DIREQT_API_ROOT = process.env.DIREQT_API_ROOT || "https://api.direqt.io";

const FACEBOOK_API_ROOT = process.env.FACEBOOK_API_ROOT || "https://graph.facebook.com/v2.6/me/messages";

app.listen(process.env.PORT || 1337, () => console.log('Direqt example webhook is listening'));

/**
 * Endpoint invoked by FB Messenger to verify our webhook.
 */
app.get('/webhook', (req, res) => {
    let mode = req.query['hub.mode'];
    let token = req.query['hub.verify_token'];
    let challenge = req.query['hub.challenge'];

    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
        console.log('WEBHOOK_VERIFIED');
        res.status(200).send(challenge);
    } else {
        res.sendStatus(403);
    }
});

/**
 * Endpoint invoked by FB to notify us of messaging events.
 */
app.post('/webhook', (req, res) => {
    let body = req.body;

    if (body.object === 'page') {
        body.entry.forEach(function(entry) {
            let webhook_event = entry.messaging[0];
            let sender_psid = webhook_event.sender.id;
            if (webhook_event.message) {
                handleMessage(sender_psid, webhook_event.message);
            }
        });
        res.status(200).send('EVENT_RECEIVED');
    } else {
        res.sendStatus(404);
    }
});

/**
 * Process a (text) message received by the sender (ie, end user).
 *
 * For this example, we normally just do a simple echo back to the sender.
 * To demonstrate interactions with Direqt, though, we look for a few keywords,
 * which are mapped to "moments" that have been predefined in the Direqt
 * playground account.
 *
 * In your own bot, you can define your own moments, and trigger them according
 * to your own application logic. Refer to https://docs.direqt.io for more
 * info.
 */
function handleMessage(sender_psid, received_message) {
    let response;
    if (!received_message.text) {
        return
    }

    response = {
        "text": `You said: "${received_message.text}"`
    };
    callSendAPI(sender_psid, response);

    // If the sender specified one of the Moments pre-configured in the
    // Direqt Playground account, fetch content from Direqt and render it.
    const exampleMoments = [
        "text",         // => "fbm-text"
        "rich-card",    // => "fbm-rich-card"
        "media"         // => "fbm-media"
    ];

    // e.g., "Rich card. " => "rich-card"
    const m = received_message.text.toLowerCase().replace(/\W/g, "-");
    if (exampleMoments.some(moment => moment === m)) {
        fetchDireqt(sender_psid, "fbm-" + m);
    }
}

function callSendAPI(sender_psid, response) {
    let request_body = {
        "recipient": {
            "id": sender_psid
        },
        "message": response
    };

    request({
        "uri": FACEBOOK_API_ROOT,
        "qs": { "access_token": PAGE_ACCESS_TOKEN },
        "method": "POST",
        "json": request_body
    }, (err, res, body) => {
        if (!err) {
        } else {
            console.error("Facebook send request failed:" + err)
        }
    });
}

function fetchDireqt(sender_psid, moment) {
    let request_body = {
        format: "FBM",
        "moment": moment,
        "subscriber": sender_psid,
        // You may pass any non-personally-identifiable information you have
        // about the subscriber in the targeting object.
        "targeting": `{
            "language": "en"
        }`
    };

    // HTTP authentication is only required in some custom configurations, and
    // should normally be omitted.
    const auth = DIREQT_API_SECRET && {
        "user": DIREQT_API_KEY,
        "pass": DIREQT_API_SECRET,
    };

    request({
        "uri": DIREQT_API_ROOT + "/fetch",
        "qs": { "key": DIREQT_API_KEY },
        "method": "POST",
        "json": request_body,
        ...{auth},
    }, (err, res, body) => {
        if (err) {
            console.error("Direqt fetch for Moment '" + moment + "' failed: " + err);
        } else if (res && res.statusCode !== 200 && res.statusCode !== 204) {
            console.error("Direqt fetch for Moment '" + moment + "' failed: "
                + res.statusCode + " " + JSON.stringify(res.body));
        } else if (body && body.payload) {
            console.log("Direqt fetch for Moment '" + moment + "' received payload.")
            callSendAPI(sender_psid, JSON.parse(body.payload));
        } else {
            console.log("Direqt fetch for Moment '" + moment + "' was empty.")
        }
    });
}
