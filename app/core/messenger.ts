import { DBManager } from "../db/db-mng";
import { GraphService } from "../services/fb-graph-service";
import { UserService } from "../services/user-service";
import { Command } from "./command";

export class Messenger {

    cmd: Command = new Command();
    api: GraphService = new GraphService();

    constructor() {}

    async handleMessage(userid: string, message: any) {
        let availableCmds: any[] = ['start', 'end', 'view', 'block'];
        
        //  Check if user is in interactive mode
        let user: any = await new DBManager().getUserInfo(userid, ["inInteractive"]);
        if(user.inInteractive !== null && user.inInteractive !== 'None') {
            this.executeDefault(userid, message, true);
        } else if(availableCmds.indexOf(message.text) > -1) {
            //  If this is a command
            this.executeCommand(userid, message.text);
        } else {
            //  Otherwise
            this.executeDefault(userid, message);
        }
    }

    handlePostback(userid: string, payload: any) {
        let avaiablePostbacks: any[] = [
            'userCompleteProfile'
        ];
        console.log(`User ${userid} sends postback:`);
        console.log(payload);
        /**
         *  When user send `Start` messages and system detects that user
         *  needs to complete his profile, and user press `Bat dau` button
         */
        if(payload === 'userCompleteProfile') {
            new UserService().completeProfile(userid);
        } else if(payload.indexOf('flow_start') > -1) { 
            this.handleMessage(userid, 'start');
        } else if(payload.indexOf('flow_findNewChat') > -1) {
            if(payload.length === 'flow_findNewChat'.length) 
                new UserService().flow_findNewChat(userid, 0);
            else
                new UserService().flow_findNewChat(userid, 1, payload);
        } else if(payload.indexOf('flow_stopSearching') > -1) {
            new UserService().flow_stopSearching(userid, 0);
        } else if(payload.indexOf('flow_endChat') > -1) {
            new UserService().flow_endChat(userid, 0);
        } else if(payload.indexOf('flow_welcome') > -1) {
            new UserService().flow_welcome(userid, 0);
        }
    }

    executeCommand(userid: string, cmdStr: string) {
        switch(cmdStr) {
            case 'start': 
                this.cmd.executeStart(userid);
                break;
            case 'end':
                break;
            case 'view':
                break;
            case 'block':
                break;
            default:
                break;
        }
    }

    async executeDefault(userid: string, message: any, interactive: boolean = false) {
        if(interactive === true) {
            let user: any = await new DBManager().getUserInfo(userid, ["inInteractive"]);
            if(user.inInteractive.indexOf('user_') > -1) {
                new UserService().completeProfile(userid, user.inInteractive, message);
            }
        } else {    
            new UserService().flow_defaultAnswer(userid, 0, message);
        }
    }
}