var mysql = require('mysql');

module.exports.db = db;

function db(){
	var connection = mysql.createConnection({
		host:'123.30.106.209',
		user:'hue-technical',
		password:'2wXsn3bGYykks5TcEiRzy8n7z',
		database:'tamgioi.gosu.vn'
	});
	var these = this;

	this.connect = function(){
		connection.connect();
	}

	this.disconnect = function(){
		connection.end();
	}

	this.query = function(query, condition, callback){
		// these.connect();
		connection.query(query, condition, callback);
		// these.disconnect();
	}

	this.findUser = function(username){
		return new Promise((resolve, reject) => {
			these.query('SELECT * FROM users WHERE username=?', [username], function(error, results, fields){
				if (error) reject(error);
				if(results && results.length>0){
					resolve(results[0]);
				} else {
					resolve(null);
				}				
			})
		});		
	}

	this.createToken = function(UserTokenData){
		return new Promise((resolve, reject) => {
			these.query('INSERT INTO user_token SET ?', UserTokenData, function(error, results, fields){
				resolve(results);
			});
		});
	}

	this.findUserToken = function(UserToken){
		return new Promise((resolve, reject) => {
			these.query('SELECT * FROM user_token WHERE token=?', [UserToken], function(error, results, fields){
				if (error) reject(error);
				if(results && results.length>0){
					resolve(results[0]);
				} else {
					resolve(null);
				}				
			})
		});
	}

	this.removeToken = function(UserToken){
		return new Promise((resolve, reject) => {
			these.query('DELETE FROM posts WHERE token = ?', [UserToken], function(error, results, fields){
				if (error) reject(false);
				resolve(true);				
			})
		});
	}

	this.pquery = function(query){
		return new Promise((resolve, reject) => {
			these.query(query, function(error, results, fields){
				if (error) reject(null);
				resolve(results);				
			})
		});
	}

	return this;
}
