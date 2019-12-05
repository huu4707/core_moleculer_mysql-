const mysql = require('mysql');
const colors = require('colors');
md5 = require("md5")
const config = require("../config")

const dbConfig = {
    host: config.VAR_HOST,
    user: config.VAR_USER,
    password: config.VAR_PASSWORD,
    database: config.VAR_DATABASE,
    connectionLimit: 15,
    multipleStatements: true
};

const MY_ERROR = require('../lib/my_error');

var connection;
const TIME_OUT_QUERY_SQL = 20000
connectMySql();
testConnectionDataBase()

function connectMySql() {
    connection = mysql.createConnection(dbConfig);

    connection.on('error', function (err) {
        connection = mysql.createConnection(dbConfig);
    });

    connection.on('close', function (err) {
        if (err) {
            console.error("SQL Connection Closed");
            connection = mysql.createConnection(dbConfig);
        } else {
            console.error('Manually called .end()');
        }
    });
}

function simpleQuery(sql, values) {
    return new Promise((resolve, reject) => {
        connection.query({
            sql: sql,
            values: values,
            timeout: TIME_OUT_QUERY_SQL
        }, function (error, results, fields) {

            if (error != null) {
                //log error
                console.error(error);
                //check connect
                if (connection.state === 'disconnected') {
                    connectMySql();
                }

                reject(error)
            } else {
                resolve(results)
            }
        });
    })
}


function excuteQuery(sql, values) {
    return new Promise(function (resolve, reject) {
        simpleQuery(sql, values)
            .then(data => {
                if (data && (data.affectedRows > 0 || data.insertId)) {
                    resolve(data)
                } else {
                    reject({
                        type: MY_ERROR.TYPE,
                        message: "affected rows = 0 or insertID null"
                    })
                }
            })
            .catch(error => reject(error))
    })
}

function findAllQuery(sql, values) {
    return new Promise(function (resolve, reject) {
        simpleQuery(sql, values)
            .then(data => {
                if (data) {
                    resolve(data)
                } else {
                    reject({
                        type: MY_ERROR.TYPE,
                        message: "Data null"
                    })
                }
            })
            .catch(error => reject(error))
    })
}

function findOneQuery(sql, values) {
    return new Promise(function (resolve, reject) {
        simpleQuery(sql, values)
            .then(data => {
                if (data && data[0]) {
                    resolve(data[0])
                } else {
                    reject({
                        type: MY_ERROR.TYPE,
                        message: "Data null or first item is null"
                    })
                }
            })
            .catch(error => reject(error))
    })
}


function getSession(sid) {
    return new Promise(function (resolve, reject) {
        var sql = "SELECT * FROM tb_session where session_id=?";
        simpleQuery(sql, [sid]).then(sessions => {
            if (sessions && sessions.length > 0) {
                resolve(JSON.parse(sessions[0].data))
            } else {
                console.log("CANNOT FIND SESSIONID".red)
                resolve(false)
            }
        }).catch(error => reject(error))
    });
}

function testConnection(callback) {
    var sql = "SELECT @@GLOBAL.sql_mode as sql_mode";
    simpleQuery(sql, []).then(data => callback(data)).catch(error => console.log('error', error))
}

function testConnectionDataBase() {
    testConnection(function (data) {
        if (data && data.length > 0) {
            if (config.ENV != "DEBUG") {
                let message = `[SUCCESS] ${config.VAR_APPLICATION_NAME} restart. SQL connect *successfully*`
            }

            console.log(colors.green("Test connection success - SQL MODE: "), data[0].sql_mode)
            if (data[0].sql_mode.includes("ONLY_FULL_GROUP_BY")) {
                console.log(colors.yellow("Waring: SQL MODE CONTAIN ONLY_FULL_GROUP_BY - Please use your admin account to set SQL MODE."))
                if (config.ENV != "DEBUG") {
                    let message = `[ERROR]  ${config.VAR_APPLICATION_NAME} SQL full group by *enable*. Please disable mode `
                }
            }
        } else {
            console.log(colors.red("Test connection fail - Please check user name and password database"))
            if (config.ENV != "DEBUG") {
                var message = `[ERROR] ${config.VAR_APPLICATION_NAME} restart. Test connection fail - Please check user name and password database `
            }
        }
    })
}

module.exports = {
    getSession,
    excuteQuery, //Insert, Update, Delete method
    findAllQuery, //Response array
    findOneQuery //Reponse first item
}