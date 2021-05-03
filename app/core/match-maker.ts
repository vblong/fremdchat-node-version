import { USER_INFO_MATCHING_COLS } from "../db/db-config";
import { DBManager } from "../db/db-mng";
import { UserService } from "../services/user-service";

export class MatchMaker {
    constructor() {}

    async matching(userid: string, orientation: number) {
        if(orientation < 1 && orientation > 5) { 
            console.error(`Unknown orientation ${orientation}`);
            return false;
        }

        let db: DBManager = new DBManager();
        await db.updateUserInfo(userid, [{'name':'orientation', 'value':orientation}]);
        let user: any = await db.getUserInfo(userid, USER_INFO_MATCHING_COLS);

        if(user.hasOwnProperty('inChat') && user.inChat === 1) {
            //  User is already connected with someone else
            new UserService().flow_findNewChat(userid, 3);
        } else if(user.hasOwnProperty('inQueue') && user.inQueue === 1) {
            //  User is in the queue
            new UserService().flow_findNewChat(userid, 2);
        } else {
            return await this.search(user);
        }
    }

    async search(user: any) {
        let partner: any = 0;
        if(user.orientation == 1) {
            partner = await this.search_o1(user);
        } else if(user.orientation == 2) {
            partner = await this.search_o2(user);
        } else if(user.orientation == 3) {
            partner = await this.search_o3(user);
        } else if(user.orientation == 4) {
            partner = await this.search_o4(user);
        } else if(user.orientation == 5) {
            partner = await this.search_o5(user);
        } 

        return {userid: user.ID, partnerid: partner };
    }

    /**
     * Orientation 5 - Male -> Female
     */
    async search_o1(user: any) {
        let {ID, birthYear, ageMin, ageMax } = user;        
        let userAge = new Date().getFullYear() - birthYear;
        let db: DBManager = new DBManager();
        let query: string; 
        
        query = `SELECT ID FROM users WHERE ID != ${ID} AND ${userAge} BETWEEN ageMin AND ageMax AND YEAR(NOW()) - birthYear BETWEEN ${ageMin} AND ${ageMax} AND birthYear != 1000 AND inChat = 0 AND inQueue = 1 AND orientation = 2 ORDER BY startFrom ASC LIMIT 1`;
        let partner: any = await db.queryP(query);
        if(partner.length !== 0) return partner[0].ID;

        query = `SELECT ID FROM users WHERE ID != ${ID} AND YEAR(NOW()) - birthYear BETWEEN ${ageMin} AND ${ageMax} AND birthYear != 1000 AND inChat = 0 AND inQueue = 1 AND orientation = 5 AND gender = 2 ORDER BY startFrom ASC LIMIT 1`;
        partner = await db.queryP(query);
        if(partner.length !== 0) return partner[0].ID;

        query = `SELECT ID FROM users WHERE ID != ${ID} AND YEAR(NOW()) - birthYear BETWEEN ${ageMin} AND ${ageMax} AND birthYear != 1000 AND inChat = 0 AND inQueue = 1 AND orientation = 5 AND gender = 0 ORDER BY startFrom ASC LIMIT 1`;
        partner = await db.queryP(query);
        if(partner.length !== 0) return partner[0].ID;     

        return 0;        
    }

    /**
     * 
     * @param user
     * Orientation 5 - Female -> Male
     */
    async search_o2(user: any) {
        let {ID, birthYear, ageMin, ageMax} = user;        
        let userAge = new Date().getFullYear() - birthYear;
        let db: DBManager = new DBManager();
        let query: string;
        
        query = `SELECT ID FROM users WHERE ID != ${ID} AND ${userAge} BETWEEN ageMin AND ageMax AND YEAR(NOW()) - birthYear BETWEEN ${ageMin} AND ${ageMax} AND birthYear != 1000 AND inChat = 0 AND inQueue = 1 AND orientation = 1 ORDER BY startFrom ASC LIMIT 1`;        
        let partner: any = await db.queryP(query);
        if(partner.length !== 0) return partner[0].ID;

        query = `SELECT ID FROM users WHERE ID != ${ID} AND YEAR(NOW()) - birthYear BETWEEN ${ageMin} AND ${ageMax} AND birthYear != 1000 AND inChat = 0 AND inQueue = 1 AND orientation = 5 AND gender = 1 ORDER BY startFrom ASC LIMIT 1`;
        partner = await db.queryP(query);
        if(partner.length !== 0) return partner[0].ID;

        query = `SELECT ID FROM users WHERE ID != ${ID} AND YEAR(NOW()) - birthYear BETWEEN ${ageMin} AND ${ageMax} AND birthYear != 1000 AND inChat = 0 AND inQueue = 1 AND orientation = 5 AND gender = 0 ORDER BY startFrom ASC LIMIT 1`;
        partner = await db.queryP(query);
        if(partner.length !== 0) return partner[0].ID;        
        return 0;  
    }

    /** 
     * Orientation 5 - Male -> Male
     */
    async search_o3(user: any) {
        let {ID, birthYear, ageMin, ageMax } = user;        
        let userAge = new Date().getFullYear() - birthYear;
        let db: DBManager = new DBManager();
        let query: string;
        
        query = `SELECT ID FROM users WHERE ID != ${ID} AND ${userAge} BETWEEN ageMin AND ageMax AND YEAR(NOW()) - birthYear BETWEEN ${ageMin} AND ${ageMax} AND birthYear != 1000 AND inChat = 0 AND inQueue = 1 AND orientation = 3 ORDER BY startFrom ASC LIMIT 1`;        
        let partner: any = await db.queryP(query);
        if(partner.length !== 0) return partner[0].ID;

        query = `SELECT ID FROM users WHERE ID != ${ID} AND YEAR(NOW()) - birthYear BETWEEN ${ageMin} AND ${ageMax} AND birthYear != 1000 AND inChat = 0 AND inQueue = 1 AND orientation = 5 AND gender = 1 ORDER BY startFrom ASC LIMIT 1`;
        partner = await db.queryP(query);
        if(partner.length !== 0) return partner[0].ID;

        query = `SELECT ID FROM users WHERE ID != ${ID} AND YEAR(NOW()) - birthYear BETWEEN ${ageMin} AND ${ageMax} AND birthYear != 1000 AND inChat = 0 AND inQueue = 1 AND orientation = 5 AND gender = 0 ORDER BY startFrom ASC LIMIT 1`;
        partner = await db.queryP(query);
        if(partner.length !== 0) return partner[0].ID;     

        return 0;  
    }

    /**
     * Orientation 5 - Female -> Female
     */    
    async search_o4(user: any) {
        let {ID, birthYear, ageMin, ageMax } = user;        
        let userAge = new Date().getFullYear() - birthYear;
        let db: DBManager = new DBManager();
        let query: string;

        query = `SELECT ID FROM users WHERE ID != ${ID} AND ${userAge} BETWEEN ageMin AND ageMax AND YEAR(NOW()) - birthYear BETWEEN ${ageMin} AND ${ageMax} AND birthYear != 1000 AND inChat = 0 AND inQueue = 1 AND orientation = 4 ORDER BY startFrom ASC LIMIT 1`;        
        let partner: any = await db.queryP(query);
        if(partner.length !== 0) return partner[0].ID;

        query = `SELECT ID FROM users WHERE ID != ${ID} AND YEAR(NOW()) - birthYear BETWEEN ${ageMin} AND ${ageMax} AND birthYear != 1000 AND inChat = 0 AND inQueue = 1 AND orientation = 5 AND gender = 2 ORDER BY startFrom ASC LIMIT 1`;
        partner = await db.queryP(query);
        if(partner.length !== 0) return partner[0].ID;
        
        query = `SELECT ID FROM users WHERE ID != ${ID} AND YEAR(NOW()) - birthYear BETWEEN ${ageMin} AND ${ageMax} AND birthYear != 1000 AND inChat = 0 AND inQueue = 1 AND orientation = 5 AND gender = 0 ORDER BY startFrom ASC LIMIT 1`;
        partner = await db.queryP(query);
        if(partner.length !== 0) return partner[0].ID;

        return 0;  
    }

    /**
     * Orientation 5 - Anyone
     */
    async search_o5(user: any) {
        let {ID, birthYear, ageMin, ageMax, gender } = user;
        let userAge = new Date().getFullYear() - birthYear;
        let db: DBManager = new DBManager();
        let partner: any, query: string;

        // 5.1
        if(gender === 1) {
            query = `SELECT ID FROM users WHERE ID != ${ID} AND ${userAge} BETWEEN ageMin AND ageMax AND inChat = 0 AND inQueue = 1 AND orientation = 3 ORDER BY startFrom ASC LIMIT 1`;
            partner = await db.queryP(query);
            if(partner.length !== 0) return partner[0].ID;

            query = `SELECT ID FROM users WHERE ID != ${ID} AND ${userAge} BETWEEN ageMin AND ageMax AND inChat = 0 AND inQueue = 1 AND orientation = 2 ORDER BY startFrom ASC LIMIT 1`;
            partner = await db.queryP(query);
            if(partner.length !== 0) return partner[0].ID;
            
            query = `SELECT ID FROM users WHERE ID != ${ID} AND inChat = 0 AND inQueue = 1 AND orientation = 5 AND gender = 0 ORDER BY startFrom ASC LIMIT 1`;
            partner = await db.queryP(query);
            if(partner.length !== 0) return partner[0].ID;

            query = `SELECT ID FROM users WHERE ID != ${ID} AND inChat = 0 AND inQueue = 1 AND orientation = 5 ORDER BY startFrom ASC LIMIT 1`;
            partner = await db.queryP(query);
            if(partner.length !== 0) return partner[0].ID;
        } else if(gender === 2) {
            // 5.2                                                                                
            query = `SELECT ID FROM users WHERE ID != ${ID} AND ${userAge} BETWEEN ageMin AND ageMax AND inChat = 0 AND inQueue = 1 AND orientation = 4 ORDER BY startFrom ASC LIMIT 1`;
            partner = await db.queryP(query);
            if(partner.length !== 0) return partner[0].ID;

            query = `SELECT ID FROM users WHERE ID != ${ID} AND ${userAge} BETWEEN ageMin AND ageMax AND inChat = 0 AND inQueue = 1 AND orientation = 1 ORDER BY startFrom ASC LIMIT 1`;
            partner = await db.queryP(query);
            if(partner.length !== 0) return partner[0].ID;
                                                                            
            query = `SELECT ID FROM users WHERE ID != ${ID} AND inChat = 0 AND inQueue = 1 AND orientation = 5 AND gender = 0 ORDER BY startFrom ASC LIMIT 1`;
            partner = await db.queryP(query);
            if(partner.length !== 0) return partner[0].ID;

            query = `SELECT ID FROM users WHERE ID != ${ID} AND inChat = 0 AND inQueue = 1 AND orientation = 5 ORDER BY startFrom ASC LIMIT 1`;
            partner = await db.queryP(query);
            if(partner.length !== 0) return partner[0].ID;
        } else {
            // 5.0
            query = `SELECT ID FROM users WHERE ID != ${ID} AND inChat = 0 AND inQueue = 1 AND orientation = 5 ORDER BY startFrom ASC LIMIT 1`;
            partner = await db.queryP(query);
            if(partner.length !== 0) return partner[0].ID;
        }        

        return 0;
    }
}