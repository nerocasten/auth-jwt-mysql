var express = require('express');
var libMysql = require('./lib/libMysql');
var mysql = require('mysql');
var bodyParser = require('body-parser')
var md5 = require('md5')
var hash = require('hash.js')
var jwt = require('jsonwebtoken');
var privateKey = 'nodejs-authenticate-app-2017';
var path = require('path')
var Cookies = require('Cookies')

require('ejs')

var app = express();
var db = libMysql.db();
app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

function userAuthenticate(UserName, Password){
	return new Promise((resolve, reject) => {
		db.findUser(UserName).then(function(user){
			var result = {login:'fail',mess:'Tài khoản hoặc mật khẩu không chính xác',token:null};
			if(user){
				var password = md5(Password);
				// hash.sha256().update('abc').digest('hex')
				var userPw = user.password;
				var salt = user.salt;
				var key = '43*&^)(}{\'/.ADFsf&^%dsHFGK';
				if(hash.sha256().update(password+key+salt).digest('hex') === userPw){
					var tokenData = {
		                username: user.username,
		                scope: 'memberlogin',
		                id: user.id
		            };
		            var token = jwt.sign(tokenData, privateKey);
		            db.createToken({token:token, private_key:privateKey});
					result = {
						login:'success',
						mess:'Đăng nhập thành công',
						token:token
					};
				}
			}
			resolve(result);
		}, function(error){
			reject(error);
		});
	});	
}

function userCheckAuth(req, res){	
	return new Promise((resolve, reject) => {
		var cookies = new Cookies( req, res, { keys: 'nerocasten2017' } );
		var httpAuthToken = cookies.get('httpAuthToken');
		if(httpAuthToken && httpAuthToken.length>0){
			db.findUserToken(httpAuthToken).then(function(token){
				if(!token || !(token.id)>0) reject(null);
				var privateKey = token.private_key;
				jwt.verify(httpAuthToken, privateKey, function(err, decoded){
					if (err) reject(null);
					if(!decoded.username) reject(null);
					db.findUser(decoded.username).then(function(user){
						if(!user || !(user.id>0)) reject(null);
						resolve(user);
					})
				});
			});
		} else {
			reject(null);
		}		
	});
}

function userAuthRemove(req, res){
	return new Promise((resolve, reject) => {
		var cookies = new Cookies( req, res, { keys: 'nerocasten2017' } );
		var httpAuthToken = cookies.get('httpAuthToken');
		if(httpAuthToken && httpAuthToken.length>0){
			db.findUserToken(httpAuthToken).then(function(token){
				if(!token || !(token.id)>0) resolve(false);
				cookies.set('httpAuthToken',null);
				db.removeToken(httpAuthToken);
				resolve(true);
			});
		} else {
			reject(false);
		}		
	});
}

app.get('/', function (req, res) {
	userCheckAuth(req, res).then(function(authUser){
		if(authUser && authUser.id>0){
			res.render(path.resolve('./views/index'),{user:authUser});
		} else {
			res.render(path.resolve('./views/login'),{err:req.query.err});
		}
	}, function(err){
		res.render(path.resolve('./views/login'),{err:req.query.err});
	});
  	
});

app.post('/authenticate', function (req, res) {
	var UserName = req.body.UserName;
	var Password = req.body.Password;
	if(!UserName || !Password){
		res.send('Tài khoản hoặc mật khẩu không thể rỗng');
	} else {
		userAuthenticate(UserName, Password).then(function(result){
			if(result.login=='fail' || result.token==null){
				res.redirect('/?err=fail');
			} else {
				var cookies = new Cookies( req, res, { keys: 'nerocasten2017' } );
				cookies.set('httpAuthToken',result.token);
				res.redirect('/');
			}
		});
	}
});

app.get('/authenticate', function (req, res) {
	res.redirect('/');
});


app.get('/logout', function (req, res) {
	userAuthRemove(req, res).then(function(resp){
		res.redirect('/');
	});	
});

var io = require('socket.io').listen(app.listen(9000, function () {
  console.log('Example app listening on port 9000!');
}));

io.sockets.on('connection', function (socket) {
    socket.emit('command', {message: 'Đã kết nối với hệ thống lệnh'});
    socket.on('command', function (data) {
    	var rep = {status:'fail', message: 'Lỗi'};
        if(data && data.text){
        	switch(data.text.toLowerCase()){
        		case 'show tables':
        			db.pquery('show tables').then(function(result){
        				if(result){
        					rep = {status:'success', data: result};
        				}
        				socket.emit('command', rep);
        			});
        		break;
        	}
        } else {
        	socket.emit('command', rep);
        }        
    });
});