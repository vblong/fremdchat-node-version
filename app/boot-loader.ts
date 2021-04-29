import express from 'express';
import request from 'request';
import bodyParser from 'body-parser';
import { DBManager } from './db/db-mng';

import { GraphService } from './services/fb-graph-service';
import { Messenger } from './core/messenger';
import { PAGE_ACCESS_TOKEN } from './environment/environment-dev';

export class BootLoader {
  app = express();
  port = 3000;
  db: DBManager = new DBManager();
  api: GraphService = new GraphService();
  msg: Messenger = new Messenger();

  boot() {
    console.log(`Starting Fremdchat v2.0.0`);
    this.db.createDBTables();

    console.log(`Reconfigure welcome screen`);
    this.initWelcomeScreen();

    this.app.use(bodyParser.urlencoded({ extended : true }));
    this.app.use(bodyParser.json());

    this.app.listen(this.port, () => {
        console.log(`Service running on port ${this.port}`)
    });
    
    this.app.get('/', (req: any, res: any) => res.send('<h1>Server is running</h1>'));
      
    this.app.post('/webhook', (req: any, res: any) => {  
      
      let body = req.body;
      if(body !== undefined) {
        // Checks if this is an event from a page subscription
        if (body.object === 'page') {

          // Iterates over each entry - there may be multiple if batched
          body.entry.forEach(( entry: { messaging: any[]; }) => {

            // Gets the body of the webhook event
            let webhookEvent = entry.messaging[0];

            // Get the sender PSID
            let senderPsid = webhookEvent.sender.id;                        
            
            // Check if the event is a message or postback and
            // pass the event to the appropriate handler function
            if (webhookEvent.message) {  
              if(webhookEvent.message.hasOwnProperty('quick_reply') && webhookEvent.message.quick_reply.hasOwnProperty('payload')) {     
                this.msg.handlePostback(senderPsid, webhookEvent.message.quick_reply.payload);
              } else {
                this.msg.handleMessage(senderPsid, webhookEvent.message);     
              }
            } else if (webhookEvent.postback) {
              this.msg.handlePostback(senderPsid, webhookEvent.postback.payload);
            }
          });

          // Returns a '200 OK' response to all requests
          res.status(200).send('EVENT_RECEIVED');
        } else {

          // Returns a '404 Not Found' if event is not from a page subscription
          res.sendStatus(404);
        }
      } else {
        res.sendStatus(404);
      }
    });
      
    // Adds support for GET requests to our webhook
    this.app.get('/webhook', (req: any, res: any) => {
    
      // Your verify token. Should be a random string.
      let VERIFY_TOKEN = "dummytext";
        
      // Parse the query params
      let mode = req.query['hub.mode'];
      let token = req.query['hub.verify_token'];
      let challenge = req.query['hub.challenge'];
        
      // Checks if a token and mode is in the query string of the request
      if (mode && token) {
      
        // Checks the mode and token sent is correct
        if (mode === 'subscribe' && token === VERIFY_TOKEN) {
          
          // Responds with the challenge token from the request
          console.log('WEBHOOK_VERIFIED');
          res.status(200).send(challenge);
        
        } else {
          // Responds with '403 Forbidden' if verify tokens do not match
          res.sendStatus(403);      
        }
      }
    });
  }
  
  handleMessage(senderPsid: any, receivedMessage: any) {
    let response;
  
    // Checks if the message contains text
    if (receivedMessage.text) {
      // Create the payload for a basic text message, which
      // will be added to the body of your request to the Send API
      response = {
        'text': `You sent the message: '${receivedMessage.text}'. Now send me an attachment!`
      };
      console.log(`User ${senderPsid} sends ${receivedMessage.text}`);      
      this.api.sendText(senderPsid, `You sent the message: '${receivedMessage.text}'. Now send me an attachment!`);
    } else if (receivedMessage.attachments) {
      console.log(`User ${senderPsid} sends an attachment.`);
      console.log(receivedMessage.attachments);
      // Get the URL of the message attachment
      let attachmentUrl = receivedMessage.attachments[0].payload.url;
      response = {
        'attachment': {
          'type': 'image',
          'payload': {
            'url': attachmentUrl
          }
        }
      };
      // Send the response message
      this.callSendAPI(senderPsid, response);
    }  
  }
  
  // Handles messaging_postbacks events
  handlePostback(senderPsid: any, receivedPostback: any) {
    let response;
  
    // Get the payload for the postback
    let payload = receivedPostback.payload;
  
    // Set the response based on the postback payload
    if (payload === 'yes') {
      response = { 'text': 'Thanks!' };
    } else if (payload === 'no') {
      response = { 'text': 'Oops, try sending another image.' };
    }
    // Send the message to acknowledge the postback
    this.callSendAPI(senderPsid, response);
  }
  
  // Sends response messages via the Send API
  callSendAPI(senderPsid: any, response: any) {
    console.log(`Gonna sends to ${senderPsid} this message: ${response}`);
    this.api.sendText(senderPsid, response);
  }

  initWelcomeScreen() {
    let requestBody = {
      "get_started": {
        "payload": "fc_welcome"
      },
      "greeting": [
        {
          "locale": "default",
          "text": "Chào {{user_first_name}} đã đến với Fremdchat. Gõ 'Start' để bắt đầu."
        },
        {
          "locale": "vi_VN",
          "text": "Chào {{user_first_name}} đã đến với Fremdchat. Gõ 'Start' để bắt đầu."
        },
        {
          "locale": "de_DE",
          "text": "Chào {{user_first_name}} đã đến với Fremdchat. Gõ 'Start' để bắt đầu."
        }
      ],
      "persistent_menu": [
        {
            "locale": "default",
            "composer_input_disabled": false,
            "call_to_actions": [
                {
                    "type": "postback",
                    "title": "Start",
                    "payload": "FC_START"
                },
                {
                    "type": "postback",
                    "title": "End",
                    "payload": "FC_END"
                },
                {
                    "type": "postback",
                    "title": "Account",
                    "payload": "FC_ACCOUNT"
                },
                {
                    "type": "web_url",
                    "title": "Shop now",
                    "url": "https://www.originalcoastclothing.com/",
                    "webview_height_ratio": "full"
                }
            ]
        }
      ]
    };

    request({
      'uri': 'https://graph.facebook.com/v10.0/me/messenger_profile',
      'qs': { 'access_token': PAGE_ACCESS_TOKEN },
      'method': 'POST',
      'json': requestBody
    }, (err, _res, _body) => {
      if (!err) {
        console.log(`Welcome Screen configuration result: ${_body.result}`);
      } else {
        console.error('Unable to send message:' + err);
      }
    });    
  }
}