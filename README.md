# Direqt - Facebook Messenger Integration

This example application demonstrates how the Direqt platform can be integrated into a Facebook Messenger bot. It implements a Facebook *webhook*, which is the mechanism by which the Messenger Platform notifies a bot of various interactions and events.

For more information on Facebook's Messenger Platform, including how to configure and deploy a webhook, see: https://developers.facebook.com/docs/messenger-platform/webhook

### Setup

Facebook Messenger bots are associated with specific Facebook Pages. This
association is performed with a Facebook app, which must be configured to
refer to your webhook. The initial setup of these FB entities is a bit involved, but well documented here:

https://developers.facebook.com/docs/messenger-platform/getting-started/app-setup

Once you have followed the instructions from the link above to create a Facebook App (and Page, if necessary), you are ready to run this example.

While you could upload the example to a web host for testing, you'll probably find it easiest to simply run it on your local development machine, and use `ngrok` to expose it to the internet.

Download and install `ngrok` here: https://ngrok.com/download

Then you can simply:

```
    $ node index.js     # launch webhook server on port 1337 (default)
    $ ngrok http 1337   # expose port 1337 to the web
```
   
Note the https address listed for "Forwarding" in the ngrok output. It will look like "https://<unique>.ngrok.io". This is the "Forwarding URL" that you'll use below. 

1. Navigate to https://developers.facebook.com/apps/
2. Select the Facebook App hosting your webhook
3. Tap "Webhooks" from the left menu column
4. Tap "Edit Subscription"
5. Enter the "Forwarding url" from `ngrok` into the box labeled "Callback URL"
6. Enter your VERIFY_TOKEN into the box labeled "Verify Token"
7. Tap "Verify and Save"


### Running the Example

Once installed, you visit the Facebook Page associated with the Messenger bot, and tap the "Message" button. Type a message into the Messenger interface, and the bot should respond with a simple echo.

The example has some keywords ("text", "rich card", "media") that are mapped to Direqt moments, so by typing these in your message, you will receive content served from Direqt.
  
   
### Using an alternate Direqt account

This example is shipped with a Direqt API key that refers to a "playground" account that has been preconfigured with components and other information necessary to test interactions. If you'd rather use your own Direqt account, change the DIREQT_API_KEY constant in `index.js` to refer to your own API key, which can be obtained from the "API Keys" option in the Direqt Console (<https://console.direqt.io>). 

### Using your own bot?

If you just want to see examples of calling Direqt and getting back a response, take a peek at the `fetchDireqt` function in the example. It's basically a single HTTPS request to Direqt, with the response being sent to Facebook's APIs.

### Documentation

See <https://docs.direqt.io> for full Direqt documentation.

Copyright (c) 2017-2019 Direqt Inc. All Rights Reserved.

