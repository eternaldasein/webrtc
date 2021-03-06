socket.on('offerDescToReceiver', (data) => {
  document.connectionsAmount++;
  getLocalStream().then(() => {
    const peerConn = new RTCPeerConnection();

    localStream.getTracks().forEach((track) => {
      peerConn.addTrack(track, localStream);
    });

    socket.on('offerICECandidateToReceiver', (data) => {
      console.log('ICE candidate has been defined');
      peerConn.addIceCandidate(data.candidate);
    });

    peerConn.onicecandidate = (event) => {
      console.log(event);
      if (document.role === 'doctor') {
        onIceCandidate(event, 'answer', document.role, data.sender);
      } else {
        onIceCandidate(event, 'answer', document.username, data.sender);
      }
    };

    const div = document.createElement('div');
    div.id = `remoteVideoBlock${document.connectionsAmount}`;

    document.body.appendChild(div);

    const video = document.createElement('video');
    video.id = `remoteVideo${document.connectionsAmount}`;
    video.autoplay = true;

    div.appendChild(video);

    peerConn.addEventListener('track', (e) => {
      video.srcObject = e.streams[0];
    });

    peerConn.setRemoteDescription(data.offerDesc);
    console.log('Remote description has been defined');

    const answer = peerConn.createAnswer({
      offerToReceiveAudio: 1,
      offerToReceiveVideo: 1
    });

    answer.then((answerDesc) => {
      console.log('Answer has been created');

      peerConn.setLocalDescription(new RTCSessionDescription(answerDesc)).then(() => {
        console.log('Local description has been defined');
        if (document.role === 'doctor') {
          socket.emit('answerDescToServer', {sender: document.role, receiver: data.sender, answerDesc: peerConn.localDescription});
        } else {
          socket.emit('answerDescToServer', {sender: document.username, receiver: data.sender, answerDesc: peerConn.localDescription});
        }

      });
    });
  });
});
