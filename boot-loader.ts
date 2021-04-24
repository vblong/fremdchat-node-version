import express from 'express';

export class BootLoader {
    app = express();
    port = 3000;

    boot() {
        this.app.listen(this.port, () => {
            console.log(`Service running on port ${this.port}`)
        });
        this.app.get('/', (req: any, res: any) => res.send('<h1>Server is running</h1>'));
        
        this.app.post('/webhook', (req: any, res: any) => {  
         
            let body = req.body;
          
            // Checks this is an event from a page subscription
            if (body.object === 'page') {
          
              // Iterates over each entry - there may be multiple if batched
              body.entry.forEach(function(entry: any) {
          
                // Gets the message. entry.messaging is an array, but 
                // will only ever contain one message, so we get index 0
                let webhook_event = entry.messaging[0];
                console.log(webhook_event);
              });
          
              // Returns a '200 OK' response to all requests
              res.status(200).send('EVENT_RECEIVED');
            } else {
              // Returns a '404 Not Found' if event is not from a page subscription
              res.sendStatus(404);
            }
          
        });
        
        // Adds support for GET requests to our webhook
        this.app.get('/webhook', (req: any, res: any) => {
        
            // Your verify token. Should be a random string.
            let VERIFY_TOKEN = "yeunhuphuong"
              
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
}