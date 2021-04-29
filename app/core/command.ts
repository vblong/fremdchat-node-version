import { DBManager } from "../db/db-mng";
import { GraphService } from "../services/fb-graph-service";
import { UserService } from "../services/user-service";

export class Command {
    
    constructor() {}

    async executeStart(userid: string) {
        let api: GraphService = new GraphService();
        let db: DBManager = new DBManager();
    
        console.log(`User ${userid} started:`);

        //  Get user info 
        let info: any = await api.getUserInfo(userid);        
        if(info.hasOwnProperty('id') === false) {    
            console.log("Có lỗi xảy ra. Vui lòng thử lại.");
            api.sendText(userid, "Có lỗi xảy ra. Vui lòng thử lại.");
            return false;    
        }       

        //  Update user info on DB
        db.updateUserProfile(info); 

        let usrv: UserService = new UserService();
        //  Check if user needs complete account
        let code: any = await usrv.checkAccount(userid);
        if(code === 1) {
            console.log(`User ${userid} needs to enter birthYear`);
            let buttons: any[] = [
                {
                    'type': 'postback',
                    'title': 'Bắt đầu',
                    'payload': 'userCompleteProfile',
                }
            ]
            api.sendText(userid, 'Vui lòng hoàn tất thông tin của bạn để tiếp tục sử dụng app', buttons);
        } else if(code === 0) {
            // console.log(`User ${userid} does not need to complete anything`);
            // api.sendText(userid, '');
            new UserService().flow_findNewChat(userid, 0);
        } else if(code === -1) {
            console.log(`Some errors occured`);
        } else {
            console.log(`I dont know what I am doing`);
        }
        
        return true;
    }
}