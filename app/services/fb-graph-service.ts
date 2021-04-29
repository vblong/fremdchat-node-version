import request from 'request';
import { GRAPH_API_VERSION } from '../config';
import { PAGE_ACCESS_TOKEN } from '../environment/environment-dev';

export class GraphService {
    constructor() {}

    sendRequest(api: string, requestBody: any) {
      request({
          'uri': `https://graph.facebook.com/${GRAPH_API_VERSION}/me/${api}`,
          'qs': { 'access_token': PAGE_ACCESS_TOKEN },
          'method': 'POST',
          'json': requestBody
        }, (err, _res, _body) => {
          if (!err) {
            console.log(`Request result: success`);
          } else {
            console.error('Unable to send message:' + err);
          }
      }); 
    }

    sendText(recipient: string, content: string, buttons: any[] = []) {      
      let requestBody: any = {
        'recipient': {
          'id': recipient
        },
        'message': {
          "text": content
        }
      };

      if(buttons.length > 0) {
        requestBody = {
          'recipient': {
            'id': recipient
          },
          'message': {
            'attachment': {
              'type': 'template',
              'payload': {
                'template_type': 'button',
                'text': content,
                'buttons': buttons
              }
            }
          }
        };
      }
      this.sendRequest("messages", requestBody);
    }

    sendQuickReplies(recipient: string, content: string, buttons: any[] = []) {

      let requestBody: any = {
        'recipient': {
          'id': recipient
        },  
        'messaging_type': "RESPONSE",
        'message':{
          'text': content,
          "quick_replies": buttons
        }
      };
      this.sendRequest("messages", requestBody);
    }

    getUserInfo(userID: string) {
      return new Promise((resolve, reject) => {        
        request({
          'uri': `https://graph.facebook.com/${userID}?fields=first_name,last_name,gender&access_token=${PAGE_ACCESS_TOKEN}`,
          'qs': { 'access_token': PAGE_ACCESS_TOKEN },
          'method': 'GET'
        }, (err, _res, _body) => {
          if(!err) {
            console.log(`Request user info success`);
            resolve(JSON.parse(_body));
          } else {
            console.error('Unable to send message:' + err);
            reject(err);
          }
        });           
      });    
    }
}