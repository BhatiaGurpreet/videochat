var socketUrl = 'https://webrtc-singaling.azurewebsites.net/';
var socket =  io(socketUrl,{
    withCredentials: false
});
var myIdentity;
var myStream;

EnterRoom();
async function EnterRoom()
{
	console.log('EnterRoom method started');
	CreateIdentity();
	myStream =await FetchUserMedia();
	myVideo.srcObject = myStream;
	myVideo.style.display='block';
	//Inform Server that the user wants to enter the room ---EnterRoom(myIdentity)
	socket.emit('EnterRoom',myIdentity);
}
function FetchUserMedia()
{
	var constraint={video:true,audio:true};
	var stream = navigator.mediaDevices.getUserMedia(constraint);
	return stream;
}

function CreateIdentity()
{
	console.log('CreateIdentity method started');
	const qString = window.location.search;
	var qParams = new URLSearchParams(qString);
	myIdentity={};
	myIdentity.username = qParams.get('useridentity');
	myIdentity.roomname = qParams.get('roomidentity');
	myIdentity.roompassword = qParams.get('roompassword');
	console.log('CreateIdentity method ended');
}


var con;
ConfigureConnection();
function ConfigureConnection()
{
	const configuration = {iceServers:[{urls: 'stun:stun.l.google.com:19302'}]};
	con = new RTCPeerConnection(configuration);
	
}

socket.on('receiveDescription',function(description)
{
	console.log('Description Received');
	if(description.type=="offer")
		CreateAnswer(description);
	else if(description.type=="answer")
		AcceptAnswer(description);
});

con.addEventListener('icecandidate',SendICECandiate);
function SendICECandiate(iceEvent)
{
	console.log('Sending IceCandidate');
   var candidate = iceEvent.candidate;
   if(candidate&&candidate!='')
   {
	   //send it to server to exchange with other person in room
	   myIdentity.ice = candidate;
	   socket.emit('exchangeIceCandidate',myIdentity);
	   console.log('IceCandidate sent');
   }
}

socket.on('receiveIceCandidate',function(candidate)
{
	console.log('IceCandidate received');
	con.addIceCandidate(new RTCIceCandidate(candidate));
});

con.ontrack=(event)=>	
{
	console.log('Track'+event.streams[0]);
    remoteVideo.srcObject = event.streams[0];
}

con.oniceconnectionstatechange	 = ev => {
    console.log(con.iceConnectionState);
    
}
function ExitRoom()
{
	con=null;
	//inform server I am exiting the room
	socket.emit('exitRoom',myIdentity);
	window.location.href = "/";
}
//Caller
var videoSender;
function InitiateCall()
{
	//Add stream to webrtc for sending it to peer
	console.log('Call Initiated');
	 myStream.getTracks().forEach((track) => {
            console.log("track added");
           videoSender= con.addTrack(track, myStream);
        })
	console.log('Tracks added');
	
}
socket.on('initiateCall',InitiateCall);

async function SendOffer()
{
	console.log('sending offer');
	var offerOptions = {offerToReceiveVideo:true,offerToReceiveAudio:true};	
	var offerDescription = await con.createOffer(offerOptions);
	myIdentity.description = offerDescription;
	await con.setLocalDescription(myIdentity.description);
	//Send the offer to server so that it can send to other person in room
	socket.emit('sendDescription',myIdentity);
	console.log('offer sent');
}

con.onnegotiationneeded = SendOffer;

function AcceptAnswer(description)
{
	console.log('answer received');
	con.setRemoteDescription(description);
}

//Callee

async function CreateAnswer(offerDescription)
{
	console.log('Offer received');
	await con.setRemoteDescription(offerDescription);
	myStream.getTracks().forEach((track) => {
            console.log("track added");
           videoSender= con.addTrack(track, myStream);
        })
	var answerDescription = await con.createAnswer();
	await con.setLocalDescription(answerDescription);
	myIdentity.description = answerDescription;
	socket.emit('sendDescription',myIdentity);
	console.log('answer sent');
}

socket.on('exitRoom',function(myIdentity)
{
	console.log('peer exited');
	ExitRoom();
});

function Mute()
{
	if (btnmute.innerHTML == '<i class="fa fa-microphone"></i>') {
        myStream.getAudioTracks()[0].enabled = false;
        btnmute.innerHTML = '<i class="fa fa-microphone-slash"></i>'
    }
    else {
        myStream.getAudioTracks()[0].enabled = true;
        btnmute.innerHTML = '<i class="fa fa-microphone"></i>'
    }
}

window.onunload = window.onbeforeunload= function()
{
	console.log('exiting');
	ExitRoom();
}

async function ScreenShare() {
    if (btnscreenshare.innerHTML == '<i class="fa fa-desktop"></i>') {
        try {
            let screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
            var screenVideoTrack = screenStream.getVideoTracks()[0];
            videoSender.replaceTrack(screenVideoTrack);
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