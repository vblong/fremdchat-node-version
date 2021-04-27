import express from 'express';
import request from 'request';

export class BootLoader {
  app = express();
  port = 3000;
  _this = this;

  boot() {
    this.app.listen(this.port, () => {
        console.log(`Service running on port ${this.port}`)
    });
    
    this.app.get('/', (req: any, res: any) => res.send('<h1>Server is running</h1>'));
      
    this.app.post('/webhook', (req: any, res: any) => {  
      
      let body = req.body;
      console.log("Req===");
      console.log(req);
      if(body !== undefined) {
        // Checks if this is an event from a page subscription
        if (body.object === 'page') {

          // Iterates over each entry - there may be multiple if batched
          body.entry.forEach(( entry: { messaging: any[]; }) => {

            // Gets the body of the webhook event
            let webhookEvent = entry.messaging[0];
            console.log(webhookEvent);

            // Get the sender PSID
            let senderPsid = webhookEvent.sender.id;
            console.log('Sender PSID: ' + senderPsid);

            // Check if the event is a message or postback and
            // pass the event to the appropriate handler function
            if (webhookEvent.message) {
              this.handleMessage(senderPsid, webhookEvent.message);
            } else if (webhookEvent.postback) {
              this.handlePostback(senderPsid, webhookEvent.postback);
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
      let VERIFY_TOKEN = "EAADTEhcxwe8BAGHMVahOpH7nk3wS9YWLQYYS3sH8U3y0dqzCs0AxwNZBi40E6ZC0bxPVJI6brwrvG5S9iqfknFt0ptZChxMjftuARKmb5gZCyiPZAKLzLS7ZCJmXIShJDNZC9ljtX8N1ZAMlNJlY1V6e5CONatpbMyCadtkhRfjCdZBT81slsaHVJfNyzsfs7LwEZD"
        
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
    } else if (receivedMessage.attachments) {
  
      // Get the URL of the message attachment
      let attachmentUrl = receivedMessage.attachments[0].payload.url;
      response = {
        'attachment': {
          'type': 'template',
          'payload': {
            'template_type': 'generic',
            'elements': [{
              'title': 'Is this the right picture?',
              'subtitle': 'Tap a button to answer.',
              'image_url': attachmentUrl,
              'buttons': [
                {
                  'type': 'postback',
                  'title': 'Yes!',
                  'payload': 'yes',
                },
                {
                  'type': 'postback',
                  'title': 'No!',
                  'payload': 'no',
                }
              ],
            }]
          }
        }
      };
    }
  
    // Send the response message
    this.callSendAPI(senderPsid, response);
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
  
    // The page access token we have generated in your app settings
    // const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;
    //  Token - Gia Re Bat Ngo
    const PAGE_ACCESS_TOKEN = "EEAADTEhcxwe8BAGHMVahOpH7nk3wS9YWLQYYS3sH8U3y0dqzCs0AxwNZBi40E6ZC0bxPVJI6brwrvG5S9iqfknFt0ptZChxMjftuARKmb5gZCyiPZAKLzLS7ZCJmXIShJDNZC9ljtX8N1ZAMlNJlY1V6e5CONatpbMyCadtkhRfjCdZBT81slsaHVJfNyzsfs7LwEZD";
  
    // Construct the message body
    let requestBody = {
      'recipient': {
        'id': senderPsid
      },
      'message': response
    };
  
    // Send the HTTP request to the Messenger Platform
    request({
      'uri': 'https://graph.facebook.com/v2.6/me/messages',
      'qs': { 'access_token': PAGE_ACCESS_TOKEN },
      'method': 'POST',
      'json': requestBody
    }, (err, _res, _body) => {
      if (!err) {
        console.log('Message sent!');
      } else {
        console.error('Unable to send message:' + err);
      }
    });
  }
}