'use strict';

var peerConnectionsArray = [];
var isChannelReady = false;
var isStarted = false;
var localStream;
var localStream2;
var pc;
var remoteStream;
var turnReady;

var pcConfig = {
  'iceServers': [{
    'urls': 'stun:numb.viagenie.ca'
  }]
};

console.log('Version 2.0.1');

// Set up audio and video regardless of what devices are present.
var sdpConstraints = {
  offerToReceiveAudio: false,
  offerToReceiveVideo: true
};

/////////////////////////////////////////////

var room = 'foo';

var socket = io.connect();

socket.emit('create or join', room);
console.log('Attempted to create or  join room', room);

socket.on('created', function (room) {
  console.log('Room ' + room + ' created successfuly');
});

socket.on('join', function (data) {
  console.log('The peer ' + data.peerId + ' joined room ' + data.room);
  isChannelReady = true;
});

socket.on('joined', function (data) {
  console.log('joined to ' + data.room + '! ID: ' + data.peerId);
  isChannelReady = true;
});

socket.on('log', function (array) {
  console.log.apply(console, array);
});

////////////////////////////////////////////////

function sendMessage(message) {
  console.log('Client sending message: ', message);
  socket.emit('message', message);
}

socket.on('call', function (id) {
  console.log('está llamando el cliente ' + id);
  maybeStart(id);
});

// This client receives a message
socket.on('message', function (message) {
  console.log('Client received message:', message);
  // if (message === 'call') {
  //   maybeStart();
  // } else 
  if (message.type === 'offer') {
    if (!isStarted) {
      maybeStart();
    }
    pc.setRemoteDescription(new RTCSessionDescription(message));
    doAnswer();
  } else if (message.type === 'answer' && isStarted) {
    pc.setRemoteDescription(new RTCSessionDescription(message));
  } else if (message.type === 'candidate' && isStarted) {
    var candidate = new RTCIceCandidate({
      sdpMLineIndex: message.label,
      candidate: message.candidate
    });
    pc.addIceCandidate(candidate);
  } else if (message === 'bye' && isStarted) {
    handleRemoteHangup();
  }
});

////////////////////////////////////////////////////

var localVideo = document.querySelector('#camera1');
var remoteVideo = document.querySelector('#camera2');

navigator.mediaDevices.getUserMedia({
  audio: false,
  // video: { deviceId: '7d05ac2f4a206320f49f8a17d1afba46fcc354e732932682646dcd1d02b6539a' } 
  video: { deviceId: 'a5f494d991b95558a455f333d4675d40065a7d38915197f61a0a3114703cc499' } 
}).then(setVideo)
  .catch(function (e) {
    alert('getUserMedia() error: ' + e.name);
  });
navigator.mediaDevices.getUserMedia({
  audio: false,
  video: { deviceId: '3aee3480ed3029ecff6acfac103a87f6ac40ccf432c7605b351b4f271de07992' } 
  // video: { deviceId: '365996cd676a97d5bd84688319dc330cfac634d7b3a4cdc0a17fb58dbbb5a040' } 
}).then(setVideo)
  .catch(function (e) {
    alert('getUserMedia() error: ' + e.name);
  });
var streamIndex = 0;
function setVideo(stream) {
  streamIndex++;
  console.log('Adding local stream.');
  console.log(stream);
  if (streamIndex == 1) {
    localStream = stream;
    localVideo.srcObject = stream;
    console.log('video 1');
    
  }
  else if (streamIndex == 2) {
    localStream2 = stream;
    remoteVideo.srcObject = stream;
    console.log('video 2');
  }
}

if (location.hostname !== 'localhost') {
  requestTurn();
}

function maybeStart(id) {
  console.log('>>>>>>> maybeStart() ', isStarted, localStream, isChannelReady);
  // if (!isStarted && typeof localStream !== 'undefined' && isChannelReady) {
  if (!isStarted && typeof localStream !== 'undefined' && localStream2 !== 'undefined' && isChannelReady) {
    console.log('>>>>>> creating peer connection');
    createPeerConnection(id);
    pc.addStream(localStream);
    pc.addStream(localStream2);
    isStarted = true;
    doCall();
  } else {
    console.log('Conexión ya existente =(')
  }
}

window.onbeforeunload = function () {
  sendMessage('bye');
};

/////////////////////////////////////////////////////////

function createPeerConnection(id) {
  try {
    peerConnectionsArray[id] = new RTCPeerConnection(pcConfig);
    pc = peerConnectionsArray[id];
    pc.onicecandidate = handleIceCandidate;
    pc.onaddstream = handleRemoteStreamAdded;
    pc.onremovestream = handleRemoteStreamRemoved;
    console.log('Created RTCPeerConnnection');
  } catch (e) {
    console.log('Failed to create PeerConnection, exception: ' + e.message);
    alert('Cannot create RTCPeerConnection object.');
    return;
  }
}

function handleIceCandidate(event) {
  console.log('icecandidate event: ', event);
  if (event.candidate) {
    sendMessage({
      type: 'candidate',
      label: event.candidate.sdpMLineIndex,
      id: event.candidate.sdpMid,
      candidate: event.candidate.candidate
    });
  } else {
    console.log('End of candidates.');
    isStarted = false;
  }
}

function handleCreateOfferError(event) {
  console.log('createOffer() error: ', event);
}

function doCall() {
  console.log('Sending offer to peer');
  pc.createOffer(setLocalAndSendMessage, handleCreateOfferError);
}

function doAnswer() {
  console.log('Sending answer to peer.');
  pc.createAnswer().then(
    setLocalAndSendMessage,
    onCreateSessionDescriptionError
  );
}

function setLocalAndSendMessage(sessionDescription) {
  pc.setLocalDescription(sessionDescription);
  console.log('setLocalAndSendMessage sending message', sessionDescription);
  sendMessage(sessionDescription);
}

function onCreateSessionDescriptionError(error) {
  trace('Failed to create session description: ' + error.toString());
}

function requestTurn() {
  pcConfig = {
    'iceServers': [
      {
        'urls': 'stun:numb.viagenie.ca'
      },
      {
        'urls': 'turn:numb.viagenie.ca',
        'credential': 'cadv2581991',
        'username': 'cdillon25@gmail.com'
      }
    ]
  };
}

function handleRemoteStreamAdded(event) {
  console.log('Remote stream added.');
  remoteStream = event.stream;
  remoteVideo.srcObject = remoteStream;
}

function handleRemoteStreamRemoved(event) {
  console.log('Remote stream removed. Event: ', event);
}

function hangup() {
  console.log('Hanging up.');
  stop();
  sendMessage('bye');
}

function handleRemoteHangup() {
  console.log('Session terminated.');
  stop();
}

function stop() {
  isStarted = false;
  pc.close();
  pc = null;
}
