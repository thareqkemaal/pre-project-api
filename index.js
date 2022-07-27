const dotenv = require('dotenv');
dotenv.config();
const express = require('express');
const app = express();
const PORT = process.env.PORT;
const cors = require('cors');

app.use(express.json());
app.use(cors());

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




app.listen(PORT, () => console.log(`Running API at ${PORT} ✅`));