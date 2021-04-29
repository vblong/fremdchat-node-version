import { USER_MAX_AGE_ALLOWABLE, USER_MIN_AGE_ALLOWABLE } from "../config";
import { MatchMaker } from "../core/match-maker";
import { DBManager } from "../db/db-mng";
import { GraphService } from "./fb-graph-service";

export class UserService {

    constructor() {}

    /**
     * 
     * @param userid 
     * @returns 
     * Code: 
     * 1 - User needs to enter their real birth year
     * 0 - No need to update
     * -1 - An error occured
     */
    checkAccount(userid: string) {
        return new Promise(async (resolve: any, reject: any) => {
            let db: DBManager = new DBManager();
            let query = `SELECT birthYear FROM users WHERE ID = ${userid}`;
            let user: any = await db.queryP(query);
            if(user[0].birthYear === 1000) resolve(1);
            resolve(0);
        });
    }

    async completeProfile(userid: string, postback: string = '', message: any = null) {
        let db: DBManager = new DBManager();
        if(postback === 'user_completeProfile_BirthYear1') {
            let result = this.checkBirthYear(message);

            if(result === "OK") {
                let buttons: any[] = [
                    {
                        'type': 'postback',
                        'title': 'Tìm bạn chat',
                        'payload': 'user_findNewChat',
                    }
                ]

                new GraphService().sendText(userid, `Đã lưu năm sinh của bạn (${message}).`, buttons);
                db.updateUserInfo(userid, [
                    {'name':'inInteractive','value':'None'},
                    {'name':'birthYear', 'value':message},
                    {'name':'birthYearChangeCount','value':'1'}             
                ]);
            } else {
                new GraphService().sendText(userid, result);
            }

            return;
        }

        //  Check if user birth year is still default - 1000        
        let user: any = await db.getUserInfo(userid, ['birthYear']);
        if(user.birthYear === 1000) {
            let api: GraphService = new GraphService();
            api.sendText(userid, "Nhập năm sinh của bạn (4 chữ số):");
            db.updateUserInfo(userid, [
                {'name':'inInteractive','value':'user_completeProfile_BirthYear1'}                    
            ]);
        }
    }

    checkBirthYear(birthYear: string) {
        let result = "OK";

        //  Not a number
        const parsed = parseInt(birthYear, 10);
        if(isNaN(parsed)) return `Năm sinh ${birthYear} có gì đó không đúng. Vui lòng thử lại`;

        //  Check user age is allowed;
        let age = new Date().getFullYear() - parsed;
        if(age < USER_MIN_AGE_ALLOWABLE || age > USER_MAX_AGE_ALLOWABLE)
            return `Năm sinh ${birthYear} có gì đó không đúng. Vui lòng thử lại`;

        return result;
    }

    flow_findNewChat(userid: string, step: number = 0, payload: string = '') {
        //  Step 0 - Sends 5 different orientation quick replies buttons
        if(step === 0) {
            let btns: any[] =[
                {'content_type':'text', 'title':'Ai cũng được', 'payload':'flow_findNewChat_5'},
                {'content_type':'text', 'title':'Nam tìm nữ', 'payload':'flow_findNewChat_1'},
                {'content_type':'text', 'title':'Nữ tìm nam', 'payload':'flow_findNewChat_2'},
                {'content_type':'text', 'title':'Nam tìm nam', 'payload':'flow_findNewChat_3'},
                {'content_type':'text', 'title':'Nữ tìm nữ', 'payload':'flow_findNewChat_4'}
            ]
            new GraphService().sendQuickReplies(userid, 'Tìm bạn chat', btns);
        } else if(step === 1) {
            //  Step 1 - User presses one of the 5 quick reply matching buttons
            new MatchMaker().matching(userid, parseInt(payload.charAt(payload.length - 1)));
        } else if(step === 2) {
            //  Step 2 - User is already in the queue
        } else if(step === 3) {
            //  Step 3 - User is already connected with someone else
        } else if(step === 4) {
            //  Step 4 - User is...
        }
    }

    flow_end(userid: string, step: number = 0, payload: string = '') {

    }
}