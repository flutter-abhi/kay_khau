const express = require('express');
const dotenv = require('dotenv').config();
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const cors = require('cors'); // Add this line

const io = new Server(server, {
  cors: {
    origin: "http://127.0.0.1:5500", // Add this block
    methods: ["GET", "POST"]
  }
});

const port = process.env.PORT || 3000;
const routes = require('./middleware/routs');
const connectToDatabase = require('./config/database');
const { getGroupData, addVote, checkVote, removeVote } = require('./controller/getGroupData');

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors()); // Add this line
app.use('/', routes);

io.of('/group').on('connection', (socket) => {
  
  console.log('A user connected to the group socket');
  socket.on('getGroupData', (groupId) => {
    console.log('Received getGroupData event with groupId:', groupId);
    getGroupData(socket, groupId);

  });

  socket.on('checkVote', (voteData) => {
    checkVote(io, socket, voteData);
  });


  socket.on('vote', (voteData) => {
    addVote(io, socket, voteData);
  });

  socket.on('removeVote', (voteData) => {
    removeVote(io, socket, voteData);
  });
});

app.get('/', (req, res) => {
  res.send('Hello World');
});

const startServer = async () => {
  try {
    await connectToDatabase();
    server.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
  } catch (error) {
    console.log(error);
  }
};

startServer();
