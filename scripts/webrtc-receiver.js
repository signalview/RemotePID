

        'use strict';
    
        var buttonWatch = document.getElementById('buttonWatch');
        buttonWatch.onclick = setVideo;
    
    
        var isChannelReady = false;
        var isInitiator = false;
        var isStarted = false;
        var localStream;
        var pc;
        var remoteStream;
        var turnReady;
    
        var pcConfig = {
          'iceServers': [{
            'urls': 'stun:numb.viagenie.ca'
          }]
        };
    
        console.log('Version 2.0');
    
        // Set up audio and video regardless of what devices are present.
        var sdpConstraints = {
          offerToReceiveAudio: false,
          offerToReceiveVideo: true
        };
    
        /////////////////////////////////////////////
    
        var room = 'foo';
    
        var socket = io.connect();
        socket.emit('create or join', room);
    
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
          if (message == 'call')
            socket.emit('call');
          else
            socket.emit('message', message);
        }
    
        // This client receives a message
        socket.on('message', function (message) {
          console.log('Client received message:', message);
          if (message.type === 'offer') {
            if (!isInitiator && !isStarted) {
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
    
        var remoteVideo1 = document.querySelector('#remoteVideo1');
        var remoteVideo2 = document.querySelector('#remoteVideo2');
    
        function setVideo() {
          sendMessage('call');
        }
    
        var constraints = {
          video: true
        };
    
        console.log('Getting user media with constraints', constraints);
    
        if (location.hostname !== 'localhost') {
          requestTurn();
        }
    
        function maybeStart() {
          console.log('>>>>>>> maybeStart() ', isStarted, isChannelReady);
          if (!isStarted && isChannelReady) {
            console.log('>>>>>> creating peer connection');
            createPeerConnection();
            isStarted = true;
            console.log('isInitiator', isInitiator);
          } else {
            console.log('Conexión ya existente, cambia isStarted =(')
          }
        }
    
        window.onbeforeunload = function () {
          sendMessage('bye');
        };
    
        /////////////////////////////////////////////////////////
    
        function createPeerConnection() {
          try {
            pc = new RTCPeerConnection(pcConfig);
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
    
        var streamCounter=0
        function handleRemoteStreamAdded(event) {
          // console.log('Remote stream added.');
          // remoteStream = event.stream;
          // remoteVideo.srcObject = remoteStream;
          streamCounter++;
          console.log('Remote stream added.');
          remoteStream = event.stream;
          eval('remoteVideo'+streamCounter+'.srcObject = remoteStream');
          console.log(remoteStream);
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
          isInitiator = false;
        }
    
        function stop() {
          isStarted = false;
          pc.close();
          pc = null;
        }
    