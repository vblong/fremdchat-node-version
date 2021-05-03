import express from 'express';
import bodyParser from 'body-parser';
import { DBManager } from './db/db-mng';
import { GraphService } from './services/fb-graph-service';
import { Messenger } from './core/messenger';

export class BootLoader {
  app = express();
  port = 3000;
  db: DBManager = new DBManager();
  api: GraphService = new GraphService();
  msg: Messenger = new Messenger();

  boot() {
    console.log(`Starting Fremdchat v2.0.0`);
    this.db.createDBTables();    

    this.syncWelcomeScreen();

    this.syncPersistentMenu();

    this.app.use(bodyParser.urlencoded({ extended : true }));
    this.app.use(bodyParser.json());

    this.app.listen(this.port, () => {
        console.log(`Service running on port ${this.port}`)
    });
    
    this.app.get('/', (req: any, res: any) => res.send('<h1>Server is running</h1>'));
      
    this.app.post('/webhook', async (req: any, res: any) => {  
      
      let body = req.body;
      if(body !== undefined) {
        // Checks if this is an event from a page subscription
        if (body.object === 'page') {

          // Iterates over each entry - there may be multiple if batched
          body.entry.forEach(async ( entry: { messaging: any[]; }) => {

            // Gets the body of the webhook event
            let webhookEvent = entry.messaging[0];

            // Get the sender PSID
            let senderPsid = webhookEvent.sender.id;                        
            
            let user: any = await new DBManager().getUserInfo(senderPsid, ["inInteractive"]);
            //  User does not exist in DB
            //  Create new in DB
            if(user === undefined) {  
              //  Get user info 
              let info: any = await new GraphService().getUserInfo(senderPsid);        
              if(info.hasOwnProperty('id') === false) {    
                  console.log("Có lỗi xảy ra. Vui lòng thử lại.");
                  new GraphService().sendText(senderPsid, "Có lỗi xảy ra. Vui lòng thử lại.");
                  return false;    
              }       
              
              //  Sync persistent menu
              console.log(`Reconfigure welcome screen`);
              this.syncPersistentMenu(senderPsid);
            
              //  Update user info on DB
              await new DBManager().updateUserProfile(info); 
            } else {
              //  User already exists, update (without synchronous)
              let info: any = new GraphService().getUserInfo(senderPsid);        
              if(info.hasOwnProperty('id') !== false) {    
                //  Update user info on DB
                new DBManager().updateUserProfile(info); 
              }                     
            }            

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

  //  Sync welcome screen
  syncWelcomeScreen() {
    let requestBody = {
      "get_started": {
        "payload": "flow_welcome"
      },
      "greeting": [
        {
          "locale": "default",
          "text": "Chào {{user_first_name}} đã đến với Fremdchat. Nhấp vào nút bên dưới để bắt đầu."
        },
        {
          "locale": "vi_VN",
          "text": "Chào {{user_first_name}} đã đến với Fremdchat. Nhấp vào nút bên dưới để bắt đầu."
        },
        {
          "locale": "de_DE",
          "text": "Herzlich willkommen {{user_first_name}} bei Fremdchat. Drücken Sie die Taste, um zu starten"
        }
      ]
    };
    new GraphService().sendRequest("messenger_profile", requestBody);
    console.log('Synching welcome screen...');    
  }

  //  Sync Persistent Menu
  syncPersistentMenu(userid: string = '') {
    let requestBody = {      
      // "psid": userid,
      "persistent_menu": [
        {
            "locale": "default",
            "composer_input_disabled": false,
            "call_to_actions": [
                {"type": "postback", "title": "Start - Tìm bạn mới", "payload": "flow_findNewChat"},
                {"type": "postback", "title": "End - Kết thúc cuộc nói chuyện", "payload": "flow_endChat"},
                {"type": "postback", "title": "Account - Xem tài khoản", "payload": "flow_account"}
            ]
        }
      ]
    }; 
    new GraphService().sendRequest("messenger_profile", requestBody);
    console.log("Synching persistent menu...");
  }
}