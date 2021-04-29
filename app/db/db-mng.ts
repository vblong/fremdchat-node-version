import mysql from 'mysql';
import { DB_COLLATION, DB_HOST, DB_NAME, DB_PASS, DB_USER } from './db-config';
import { DB_TABLES_CREATE } from './db-install-queries';

export class DBManager {
    private db: any;
    constructor() {}

    connect(log: boolean = false) {
        let result: boolean = true;
        this.db = mysql.createConnection({
            host: DB_HOST,
            user: DB_USER,
            password: DB_PASS,
            database: DB_NAME,
            charset : DB_COLLATION
        });
    
        this.db.connect((err: any) => {
            if(err) {
                if(log === true) console.log("MySQLERR", err);
                result = false;
            }
            if(log === true) console.log("MySQL Connected");
        });        

        return result;
    }

    close(log: boolean = false) {
        let result: boolean = true;
        this.db.end(function(err: any) {
            if (err) {
                if(log === true) console.log('MySQLErr:' + err.message);
                result = false; 
            }
            if(log === true) console.log('Close the database connection.');
        });
        return result;
    }

    createDBTables() {
        console.log("Checking DB tables...");
        for (let i in DB_TABLES_CREATE) {
            this.query(DB_TABLES_CREATE[i]);
        }
    }

    /**
     * @param query 
     * @returns 
     * Does not return Promise
     * Use for update DB
     */
    query(query: string) {
        let result: boolean = true;
        if(this.connect() === false) {
            console.error("Failed to connect to the database");
            return false;
        }

        this.db.query(query, (err: any, rows: any, fields: any) => {
            if(err) {
                console.log(`Error while running query ${query}`);
                console.error(err);
                result = false;
            }
        });
        
        if(this.close() === false){
            console.log("Failed to disconnect to the database");
            return false;
        }

        return result;
    }

    /**
     * @param query 
     * @returns 
     * Return a Promise, use when retrieving data
     */
    queryP(query: string) {
        return new Promise((resolve, reject) => {
            if(this.connect() === false) {
                reject("Failed connecting to database");
            }
            this.db.query(query, (err: any, rows: any, fields: any) => {
                if(err) {
                    console.log(`MySQLERR ${err}`);
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
            if(this.close() === false) {
                reject("Failed closing connection to database");
            }
        });
    }


    async loadServerStatus() {
        //  TODO - maybe not do it
        // return new Promise((resolve, reject) => {
        //     let query = `SELECT ID, inChat, inQueue, partnerID, birthYear, ageMin, ageMax, gender, orientation, startFrom, matchFrom  FROM users WHERE `;
        //     this.queryP(query)
        //     .then((result: any) => {
        //         resolve(result);
        //     })
        //     .catch((err: any) => {
        //         reject(err);
        //     });
        // });
    }
    
    updateUserProfile(info: any) {
        return new Promise((resolve, reject) => {   
            let query = `SELECT ID FROM users WHERE ID = ${info.id}`;
            this.queryP(query)
            .then((result: any) => {
                resolve(result);
                if(result.length == 0) {
                    this.addNewUser(info);
                }
            })
            .catch((err: any) => {
                reject(err);
            });
        });
    }

    addNewUser(info: any) {
        console.log(`Gonna add this user to DB ${info}`);
        let ID = info.id;
        let NAME = '';
        if(info.hasOwnProperty('first_name')) NAME += info.first_name;
        if(info.hasOwnProperty('last_name')) NAME += ' ' + info.last_name;
        let GENDER = 0;
        if(info.hasOwnProperty('gender') && info.gender === "male") GENDER = 1;
        else if(info.hasOwnProperty('gender') && info.gender === "female") GENDER = 2;

        let query: string = `INSERT INTO users(ID, name, gender) VALUES(${ID}, "${NAME}", ${GENDER})`;
        this.query(query);
    }

    getUserInfo(userid: string, columns: string[]) {
        return new Promise((resolve, reject) => {   
            let cols = `ID`;
            columns.forEach((col: string, index: number) => {
                if(index < columns.length) cols += ',';
                cols += col;                
            })
            let query = `SELECT ${cols} FROM users WHERE ID = ${userid}`;
            this.queryP(query)
            .then((result: any) => {
                resolve(result[0]);
            })
            .catch((err: any) => {
                reject(err);
            });
        });
    }

    updateUserInfo(userid: string, data: any[]) {
        return new Promise((resolve, reject) => {               
            let setTxt = ``;
            data.forEach((col, index) => {
                setTxt += `${col.name}='${col.value}'`;
                if(index < data.length-1) setTxt += ','; 
            });
            let query: string = `UPDATE users SET ${setTxt} WHERE ID = ${userid}`;
            this.queryP(query)
            .then((result: any) => {
                resolve(result[0]);
            })
            .catch((err: any) => {
                reject(err);
            });
        });        
    }
}