import { USER_MAX_AGE_ALLOWABLE, USER_MIN_AGE_ALLOWABLE } from "../config";
import { MatchMaker } from "../core/match-maker";
import { DBManager } from "../db/db-mng";
import { GraphService } from "./fb-graph-service";

export class UserService {

    btns: QuickReplyButton[] = [
        {'content_type':'text', 'title':'Ai cũng được', 'payload':'flow_findNewChat_5'},
        {'content_type':'text', 'title':'Nam tìm nữ', 'payload':'flow_findNewChat_1'},
        {'content_type':'text', 'title':'Nữ tìm nam', 'payload':'flow_findNewChat_2'},
        {'content_type':'text', 'title':'Nam tìm nam', 'payload':'flow_findNewChat_3'},
        {'content_type':'text', 'title':'Nữ tìm nữ', 'payload':'flow_findNewChat_4'}
    ]

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
            let result = this.checkBirthYear(message.text);

            if(result === "OK") {
                let buttons: StandardButton[] = [
                    {
                        'type': 'postback',
                        'title': 'Tìm bạn chat',
                        'payload': 'flow_findNewChat',
                    }
                ]

                new GraphService().sendText(userid, `Đã lưu năm sinh của bạn (${message.text}).`, buttons);
                db.updateUserInfo(userid, [
                    {'name':'inInteractive','value':'None'},
                    {'name':'birthYear', 'value':message.text},
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

    connect(userid_1: string, userid_2: string) {
        let db: DBManager = new DBManager();
        db.updateUserInfo(userid_1, [
            {'name':'inQueue', 'value': '0'},
            {'name':'inChat', 'value': '1'},
            {'name':'connected', 'value':'1'},
            {'name':'partnerID', 'value':userid_2},
            {'name':'matchFrom', 'value':'NOW()'},
            {'name':'lastChatCount', 'value':'0'},
            {'name':'inInteractive', 'value':'None'},            
        ]);

        db.updateUserInfo(userid_2, [
            {'name':'inQueue', 'value': '0'},
            {'name':'inChat', 'value': '1'},
            {'name':'connected', 'value':'1'},
            {'name':'partnerID', 'value':userid_1},
            {'name':'matchFrom', 'value':'NOW()'},
            {'name':'lastChatCount', 'value':'0'},
            {'name':'inInteractive', 'value':'None'},            
        ]);

        let api: GraphService = new GraphService();
        api.sendText(userid_1, `✅ Đã kết nối với một người lạ, chúc các bạn nói chuyện vui vẻ.`);
        api.sendText(userid_2, `✅ Đã kết nối với một người lạ, chúc các bạn nói chuyện vui vẻ.`);
    }

    async reCheck(userid: string) {
        let info: any = await new DBManager().getUserInfo(userid, ['inQueue', 'inChat', 'birthYear']);
        if(info.birthYear === 1000) return 4;
        if(info.inChat === 1) return 3; 
        if(info.inQueue === 1) return 2;
        return 0; 
    }
    async flow_findNewChat(userid: string, step: number = 0, payload: string = '') {
        console.log(`Start flow_findNewChat - Step ${step}`);
        if(step === 0) {   
            //  Step 0 - Sends 5 different orientation quick replies buttons
            let reCheck: any = await this.reCheck(userid);
            if(reCheck !== 0) {
                if(reCheck === 4) {
                    let buttons: StandardButton[] = [
                        {
                            'type': 'postback',
                            'title': 'Bắt đầu',
                            'payload': 'userCompleteProfile',
                        }
                    ]
                    new GraphService().sendText(userid, 'Vui lòng hoàn tất thông tin của bạn để tiếp tục sử dụng app', buttons);
                    return;
                }
                this.flow_findNewChat(userid, reCheck);
                return;
            }
            new GraphService().sendQuickReplies(userid, 'Tìm bạn chat', this.btns);
        } else if(step === 1) {
            let reCheck: any = await this.reCheck(userid);
            if(reCheck !== 0) {
                if(reCheck === 4) {
                    let buttons: StandardButton[] = [
                        {
                            'type': 'postback',
                            'title': 'Bắt đầu',
                            'payload': 'userCompleteProfile',
                        }
                    ]
                    new GraphService().sendText(userid, 'Vui lòng hoàn tất thông tin của bạn để tiếp tục sử dụng app', buttons);
                    return;
                }
                this.flow_findNewChat(userid, reCheck);
                return;
            }
            //  Step 1 - User presses one of the 5 quick reply matching buttons
            new DBManager().updateUserInfo(userid, [{'name': 'connected', 'value': '1'}]);
            let match: any = await new MatchMaker().matching(userid, parseInt(payload.charAt(payload.length - 1)));
            // console.log("Match result ", match);
            if(match.partnerid === 0) {
                let btn: StandardButton[] = [
                    {
                        type: 'postback',
                        title: 'Dừng tìm kiếm',
                        payload: 'flow_stopSearching'
                    }
                ];
                new DBManager().updateUserInfo(userid, [{'name': 'inQueue', 'value': '1'}]);
                new GraphService().sendText(userid, '❗ Ai cũng có đôi có cặp để nói chuyện rồi, có mỗi bạn là chưa! Chờ tí nhé', btn);
            } else {
                this.connect(userid, match.partnerid);
            }
        } else if(step === 2) {
            //  Step 2 - User is already in the queue
            let btns: StandardButton[] = [
                {
                    type: 'postback',
                    title: 'Dừng tìm kiếm',
                    payload: 'flow_stopSearching'
                }
            ];
            new GraphService().sendText(userid, '❗ Chờ tí chờ tí, nóng vội hỏng việc', btns);
        } else if(step === 3) {
            //  Step 3 - User is already connected with someone else
            let btns: StandardButton[] = [
                {
                    type: 'postback',
                    title: 'Ngắt kết nối',
                    payload: 'flow_endChat'
                }
            ];
            new GraphService().sendText(userid, '❗ Bạn đang được kết nối với một bạn khác.', btns);
        } else if(step === 4) {
            //  Step 4 - User is in the queue and wants to stop finding
        }
    }

    async flow_stopSearching(userid: string, step: number = 0, payload: string = '') {
        //  Step = 0 : user is in the queue
        let reCheck: any = await this.reCheck(userid);
        if(reCheck !== 0) {
            if(reCheck === 4) {
                let buttons: StandardButton[] = [
                    {
                        'type': 'postback',
                        'title': 'Bắt đầu',
                        'payload': 'userCompleteProfile',
                    }
                ]
                new GraphService().sendText(userid, 'Vui lòng hoàn tất thông tin của bạn để tiếp tục sử dụng app', buttons);
                return;
            }
            this.flow_findNewChat(userid, reCheck);
            return;
        }
        if(step === 0) {
            new DBManager().updateUserInfo(userid, [{'name': 'inQueue', 'value': '0'}]);            
            new GraphService().sendQuickReplies(userid, '❗ Bạn đã dừng tìm kiếm. Dùng các nút bên dưới để tìm bạn mới', this.btns);
        }
    }

    async flow_endChat(userid_1: string, step: number = 0, payload: string = '') {
        let db: DBManager = new DBManager();
        let user: any = await db.getUserInfo(userid_1, ['partnerID']);        
        let userid_2 = user.partnerID;
        let reset_data: any[] = [
            {'name':'inQueue', 'value': '0'},
            {'name':'inChat', 'value': '0'},
            {'name':'connected', 'value':'0'},
            {'name':'partnerID', 'value': '0'},
            {'name':'inInteractive', 'value':'None'}
        ];

        db.updateUserInfo(userid_1, reset_data);
        db.updateUserInfo(userid_2, reset_data);        

        let api: GraphService = new GraphService();
        api.sendQuickReplies(userid_1, `💔 Bạn đã thoát, dùng các nút bên dưới để tìm bạn mới.`, this.btns);
        api.sendQuickReplies(userid_2, `💔 Đối phương đã thoát, dùng các nút bên dưới để tìm bạn mới.`, this.btns);
    }

    forwardAttachments(recipient: string, attachment: any) {        
        attachment.forEach((element: any) => {            
            console.log(element.type, ' - ', element.payload.url);
            if(element.hasOwnProperty('type') && element.type === 'image') {
                //  An image
                let payload: any = element.payload;
                if(payload.hasOwnProperty('sticker_id')) {
                    //  It's a sticker
                    // new GraphService().sendAttachment(recipient, "image", {'url': payload.url, 'sticker_id':payload.sticker_id});
                    new GraphService().sendAttachment(recipient, "image", {'url': payload.url});
                } else {
                    //  Normal image
                    new GraphService().sendAttachment(recipient, "image", {'url': payload.url});
                }
            } else if(element.hasOwnProperty('type') && element.type === 'video') {
                //  A video
                let payload: any = element.payload;
                new GraphService().sendAttachment(recipient, "video", {'url': payload.url});
            } else if(element.hasOwnProperty('type') && element.type === 'file') {
                //  A file
                let payload: any = element.payload;
                new GraphService().sendAttachment(recipient, "file", {'url': payload.url});
            } else if(element.hasOwnProperty('type') && element.type === 'audio') {
                //  An audio
                let payload: any = element.payload;
                new GraphService().sendAttachment(recipient, "audio", {'url': payload.url});
            }
        });
    }

    forwardMessage(recipient: string, message: any) {
        if(message.hasOwnProperty('attachments'))
            this.forwardAttachments(recipient, message.attachments);
        if(message.hasOwnProperty('text'))
            new GraphService().sendText(recipient, message.text);
    }

    async flow_defaultAnswer(userid: string, step = 0, message: string) {
        let user: any = await new DBManager().getUserInfo(userid, ['connected', 'partnerID']);
        //  User has not joined yet
        if(user.connected === 0) {
            new GraphService().sendQuickReplies(userid, '❗ Bạn chưa đăng kí tìm kiếm. Dùng các nút bên dưới để tìm bạn mới', this.btns);
        } else {
            //  User is connected with someone else -> Exchange their message
            console.log(`User ${userid} sends ${user.partnerID}: ${message}`);
            this.forwardMessage(user.partnerID, message);
        }
    }

    flow_start(userid: string, step: number = 0, payload: string = '') {

    }

    flow_welcome(userid: string, step: number = 0, payload: string = '') {
        let btn: QuickReplyButton[] = [
            {'content_type':'text', 'title':'Start', 'payload':'flow_findNewChat'},
        ]
        new GraphService().sendQuickReplies(userid, "Chào bạn đã đến với Fremdchat. Gõ 'Start' để bắt đầu tìm bạn chat. Khi muốn kết thúc cuộc nói chuyện thì gõ 'End'", btn);
    }
}