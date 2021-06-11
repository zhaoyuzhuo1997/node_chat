const express = require('express');
const nunjucks = require('nunjucks');
const morgan = require('morgan');
const path = require('path');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);

// 채팅 기록 
const chatHistory = {};

io.on("connection", (socket) => {
	// socket.on -> 데이터 수신, socket.emit 데이터 전송
	socket.on('chat', (arg) => {
		socket.sessionId = socket.sessionId || arg.sessionId;
			
		chatHistory[socket.sessionId] = chatHistory[socket.sessionId]  || [];
		chatHistory[socket.sessionId].push(arg);
	
		io.to(arg.room).emit('chat', arg);
	});
	
	/** 방 참여 */
	socket.on('join', (room) => {
		socket.join(room);
	});
	
	// 방을 닫을 때 
	let previousRooms = [];
	socket.on("disconnecting", () => {
	
	});
	// 방이 닫혔을 때 
	socket.on("disconnect", () => {
		/** 방이 닫히면 현재 접속자 대화 기록 후속 처리 */
		console.log(chatHistory[socket.sessionId]);
		
		/** 후속 처리 */
		delete chatHistory[socket.sessionId];
		
		console.log('disconnect');
	});
});	

app.set('port', process.env.PORT || 3000);
app.set('view engine', 'html');
nunjucks.configure('views', {
	express : app,
	watch : true,
});

app.use(morgan('dev'));
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res, next) => {
	res.render('main');
});

app.get('/chat', (req, res, next) => {
	if (!req.query.room || !req.query.userNm) {
		return res.send("<script>alert('방이름과 사용자명을 모두 입력하세요.');location.href='/';</script>");
	}
	return res.render('chat');
});

/** 없는 페이지 미들웨어 */
app.use((req, res, next) => {
	const error = new Error(`${req.method} ${req.url}는 없는 페이지 입니다.`);
	error.status = 404;
	next(error);
});

/** 오류 처리 미들웨어 */
app.use((err, req, res, next) => {
	err.status = err.status || 500;
	res.locals.error = err;
	console.error(err);
	res.status(err.status).render('error');
});

server.listen(app.get('port'), () => {
	console.log(app.get('port'), '번 포트에서 서버 대기중');
});