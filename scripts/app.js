var socketUrl = 'https://webrtc-singaling.azurewebsites.net/';
var socket = io(socketUrl, {
	withCredentials: false
});
var myIdentity;
var myStream;

EnterRoom();
async function EnterRoom() {
	console.log('EnterRoom method started');
	CreateIdentity();
	myStream = await FetchUserMedia();
	myVideo.srcObject = myStream;
	myVideo.style.display = 'block';
	//Inform Server that the user wants to enter the room ---EnterRoom(myIdentity)
	socket.emit('EnterRoom', myIdentity);
	console.log('socket.emt EnterRoom');
}
function FetchUserMedia() {
	var constraint = { video: true, audio: true };
	var stream = navigator.mediaDevices.getUserMedia(constraint);
	return stream;
}

function CreateIdentity() {
	console.log('CreateIdentity method started');
	const qString = window.location.search;
	var qParams = new URLSearchParams(qString);
	myIdentity = {};
	myIdentity.username = qParams.get('useridentity');
	myIdentity.roomname = qParams.get('roomidentity');
	myIdentity.roompassword = qParams.get('roompassword');
	console.log('CreateIdentity method ended');
}

const configuration = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };
var connections = [];
function InitiateCall(peerid) {
	//Add stream to webrtc for sending it to peer
	var conn = new RTCPeerConnection(configuration);
	console.log('Call Initiated');
	conn.peerid = peerid;
	conn.onnegotiationneeded = sendOffer;
	conn.onicecandidate = sendICECandiate;
	myStream.getTracks().forEach((track) => {
		console.log("track added");
		videoSender = conn.addTrack(track, myStream);
	});
	conn.ontrack = GotStreamEvent;
	console.log('Tracks added');
	connections.push(conn);

}
socket.on('initiateCall', InitiateCall);


socket.on('receiveDescription', function (peerIdentity) {
	console.log('Description Received');
	if (peerIdentity.description.type == "offer")
		CreateAnswer(peerIdentity);
	else if (peerIdentity.description.type == "answer")
		AcceptAnswer(peerIdentity);
});

function sendICECandiate(iceEvent) {
	console.log('sending ice');
	var candidate = iceEvent.candidate;
	if (candidate && candidate != '') {
		//send it to server to exchange with other person in room
		var identityInstance = JSON.parse(JSON.stringify(myIdentity));
		identityInstance.peerid = iceEvent.currentTarget.peerid;
		identityInstance.ice = candidate;
		identityInstance.id = socket.id;
		socket.emit('exchangeIceCandidate', identityInstance);
		console.log('IceCandidate sent');
	}
}

socket.on('receiveIceCandidate', async function (peerIdentity) {
	console.log(peerIdentity);
	var conn = await GetPeerConnection(peerIdentity.id);
	console.log(conn);
	conn.addIceCandidate(new RTCIceCandidate(peerIdentity.ice));
});

var streamsID = [];
function GotStreamEvent(event) {
	if (streamsID.includes(event.currentTarget.peerid)) {
		var vElement = document.getElementById(event.currentTarget.peerid);
		vElement.srcObject = event.streams[0];
	}
	else {
		streamsID.push(event.currentTarget.peerid);
		CreateVideoElement(event.currentTarget.peerid, event.streams[0]);

	}
}
function CreateVideoElement(elementId, stream) {
	$ = el => document.querySelector(el);
	var	videoElement = "<video autoplay class='grid-item' id='" + elementId + "' srcObject=" + stream + "></video>";
	$('.wrapper').insertAdjacentHTML('beforeend', videoElement);
	updateLayout();
}

function ExitRoom() {
	con = null;
	//inform server I am exiting the room
	myIdentity.id = socket.id;
	socket.emit('peerLeft', myIdentity);
	window.location.replace("/videochat");
}

socket.on('peerLeft', function (peerIdentity) {
	document.getElementById(peerIdentity.id).remove();
	updateLayout();

});
//Caller
var videoSender;

async function sendOffer(event) {
	console.log('sending offer');
	var offerOptions = { offerToReceiveVideo: true, offerToReceiveAudio: true };
	var offerDescription = await event.currentTarget.createOffer(offerOptions);
	var identityInstance = JSON.parse(JSON.stringify(myIdentity));;
	identityInstance.description = offerDescription;
	identityInstance.peerid = event.currentTarget.peerid;
	identityInstance.id = socket.id;
	await event.currentTarget.setLocalDescription(identityInstance.description);
	//Send the offer to server so that it can send to other person in room
	socket.emit('sendDescription', identityInstance);
	console.log('offer sent');
}


function AcceptAnswer(peerIdentity) {
	console.log(peerIdentity);
	var conn = GetPeerConnection(peerIdentity.id);
	console.log(conn);
	conn.setRemoteDescription(peerIdentity.description);
}

function GetPeerConnection(peerid) {
	console.log('finding conn with peerid ' + peerid);
	return connections.find(function (x) { return x.peerid == peerid });
}
async function CreateAnswer(peerIdentity) {
	console.log('Offer received');
	var conn = new RTCPeerConnection(configuration);
	connections.push(conn);
	console.log('Call Initiated');
	conn.peerid = peerIdentity.id;
	conn.onnegotiationneeded = sendOffer;
	conn.onicecandidate = sendICECandiate;
	conn.ontrack = GotStreamEvent;
	await conn.setRemoteDescription(peerIdentity.description);
	myStream.getTracks().forEach((track) => {
		console.log("track added");
		conn.addTrack(track, myStream);
	})
	var answerDescription = await conn.createAnswer();
	await conn.setLocalDescription(answerDescription);
	var identityInstance = JSON.parse(JSON.stringify(myIdentity));;
	identityInstance.description = answerDescription;
	identityInstance.peerid = peerIdentity.id;
	identityInstance.id = socket.id;
	socket.emit('sendDescription', identityInstance);
	console.log('answer sent');

}

socket.on('exitRoom', function (myIdentity) {
	console.log('peer exited');
	ExitRoom();
});

function Mute() {
	CreateVideoElement("123", myStream);
	if (btnmute.innerHTML == '<i class="fa fa-microphone"></i>') {
		myStream.getAudioTracks()[0].enabled = false;
		btnmute.innerHTML = '<i class="fa fa-microphone-slash"></i>'
	}
	else {
		myStream.getAudioTracks()[0].enabled = true;
		btnmute.innerHTML = '<i class="fa fa-microphone"></i>'
	}
}

window.onunload = window.onbeforeunload = function () {
	console.log('exiting');
	ExitRoom();
}
async function ScreenShare() {
	if (btnscreenshare.innerHTML == '<i class="fa fa-desktop"></i>') {
		try {
			let screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
			var screenVideoTrack = screenStream.getVideoTracks()[0];
			connections.forEach(function (pc) {
				var sender = pc.getSenders().find(function (s) {
					return s.track.kind == screenVideoTrack.kind;
				});
				sender.replaceTrack(screenVideoTrack);
			});
			btnscreenshare.innerHTML = '<i class="fa fa-stop-circle"></i>'
		}
		catch (e) {
			console.log('Unable to acquire screen capture: ' + e);
		}

	}
	else {
		var myVideoTrack = myStream.getVideoTracks()[0];
		videoSender.replaceTrack(myVideoTrack);
		btnscreenshare.innerHTML = '<i class="fa fa-desktop"></i>'
	}
}