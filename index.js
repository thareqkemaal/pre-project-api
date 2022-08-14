const dotenv = require('dotenv');
dotenv.config();
const express = require('express');
const app = express();
const PORT = process.env.PORT;
const cors = require('cors');
const bearerToken = require('express-bearer-token');

app.use(express.json());
app.use(cors());
app.use(express.static('public'));
app.use(bearerToken());

app.get('/', (req, res) =>{
    res.status(200).send('<h1>GAZEBO API</h1>')
});

//DB CHECK CONNECTION
const { dbConf } = require('./config/db');
dbConf.getConnection((error, connection) => {
    if (error){
        console.log("Error MySQL Connection", error.sqlMessage);
    }
    console.log(`Connect ✅ : ${connection.threadId}`)
});

// CONFIG ROUTERS
const { authRouter } = require('./routers');
const { postRouter } = require('./routers');
app.use('/auth', authRouter);
app.use('/post', postRouter);

app.listen(PORT, () => console.log(`Running API at ${PORT} ✅`));