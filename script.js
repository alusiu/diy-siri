try {
    var SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    var recognition = new SpeechRecognition();
  }
  catch(e) {
    console.error(e);
    $('.no-browser-support').show();
    $('.app').hide();
  }

var noteTextarea = $('#note-textarea');
var notesList = $('ul#notes');
var wolfRamFeedback = $('#wolf-ram-feedback')
var noteContent = '';

var overAllNotes = '';

//input variables
var sendText;

var dataServer;
var pubKey = 'pub-c-e53281b0-98cb-4ab9-ae43-8494619d1644';
var subKey = 'sub-c-a6c120dc-23f0-11e9-a687-121356607208';
var returnedAnswer = [];
var wRresponse;

//This must match the channel you set up in your function
var channelName = "wolfram";

$('#stop-record-btn').hide();

dataServer = new PubNub(
    {
      publish_key   : pubKey,  //get these from the pubnub account online
      subscribe_key : subKey,  
      ssl: true  //enables a secure connection. This option has to be used if using the OCAD webspace
    });
    
//attach callbacks to the pubnub object to handle messages and connections
dataServer.addListener({ message: readIncoming})
dataServer.subscribe({channels: [channelName]});

/*-----------------------------
      Voice Recognition 
------------------------------*/

// If false, the recording will stop after a few seconds of silence.
// When true, the silence period is longer (about 15 seconds),
// allowing us to keep recording even when the user pauses. 

recognition.continuous = true;
//console.log(recognition.continuous)
// This block is called every time the Speech APi captures a line. 
recognition.onresult = function(event) {

   // event is a SpeechRecognitionEvent object.
  // It holds all the lines we have captured so far. 
  // We only need the current one.
  var current = event.resultIndex;

  // Get a transcript of what was said.
  var transcript = event.results[current][0].transcript;
  
  overAllNotes += transcript;

  noteTextarea.val(overAllNotes);
  console.log('in here');
  console.log('T: '+ transcript);

  // Add the current transcript to the contents of our Note.
  // There is a weird bug on mobile, where everything is repeated twice.
  // There is no official solution so far so we have to handle an edge case.
  var mobileRepeatBug = (current == 1 && transcript == event.results[0][0].transcript);

  if(!mobileRepeatBug) {
    noteContent += transcript;
    noteTextarea.val(noteContent);
  }
  recognition.continuous = true;

};

recognition.onstart = function() { 
  console.log("starting");
  // instructions.text('Voice recognition activated. Try speaking into the microphone.');
}
recognition.onend = function() {
  console.log('on end');
  //recognition.start();

}
recognition.onspeechend = function() {
  console.log('You were quiet for a while so voice recognition turned itself off.');
}

recognition.onerror = function(event) {
  if(event.error == 'no-speech') {
     console.log('No speech was detected. Try again.');  
  };
}

/*-----------------------------
      App buttons and input 
------------------------------*/

$('#start-record-btn').on('click', function(e) {
  console.log('start');

  if (noteContent.length) {
    noteContent += ' ';
  }
  recognition.start();
  $('#start-record-btn').hide();
  $('#stop-record-btn').show();

});

$('#stop-record-btn').on('click', function(e) {
    recognition.stop();
    $('#stop-record-btn').hide();
    $('#start-record-btn').show();


    if(!noteContent.length) {
        wolfRamFeedback.text('Did you ask a question? I didn\'t hear anything. Please try again');
        readOutLoud('Did you ask a question? I didn\'t hear anything. Please try again');
    }
    else {
      sendTheMessage();
  
      // Reset variables and update UI.
      noteContent = '';
      noteTextarea.val('');
    }
        
  })

// Sync the text inside the text area with the noteContent variable.

noteTextarea.on('input', function() {
  noteContent = $(this).val();
});

notesList.on('click', function(e) {
  e.preventDefault();
  var target = $(e.target);

  // Listen to the selected note.
  if(target.hasClass('listen-note')) {
    var content = target.closest('.note').find('.content').text();
    readOutLoud(content);
  }

  // Delete note.
  if(target.hasClass('delete-note')) {
    var dateTime = target.siblings('.date').text();  
    deleteNote(dateTime);
    target.closest('.note').remove();
  }
});

// store previous questions?? 
/*-----------------------------
      Helper Functions 
------------------------------*/

/*function renderNotes(notes) {
  var html = '';
  if(notes.length) {
    notes.forEach(function(note) {
      html+= `<li class="note">
        <p class="header">
          <span class="date">${note.date}</span>
          <a href="#" class="listen-note" title="Listen to Note">Listen to Note</a>
          <a href="#" class="delete-note" title="Delete">Delete</a>
        </p>
        <p class="content">${note.content}</p>
      </li>`;    
    });
  }
  else {
    html = '<li><p class="content">You don\'t have any notes yet.</p></li>';
  }
  notesList.html(html);
}*/


function getAllNotes() {
  var notes = [];
  var key;
  for (var i = 0; i < localStorage.length; i++) {
    key = localStorage.key(i);

    if(key.substring(0,5) == 'note-') {
      notes.push({
        date: key.replace('note-',''),
        content: localStorage.getItem(localStorage.key(i))
      });
    } 
  }
  return notes;
}


function deleteNote(dateTime) {
  localStorage.removeItem('note-' + dateTime); 
}


function sendTheMessage() {

    // Send Data to the server to draw it in all other canvases
    dataServer.publish(
      {
        channel: channelName,
        message: 
        {
          text: noteTextarea.val()       //text: is the message parameter the function is expecting   
        }
      });
  
  }
  
function readIncoming(inMessage) //when new data comes in it triggers this function, 
{                               // this works becsuse we subscribed to the channel in setup()

    console.log(inMessage);  //log the entire response    
    console.log(inMessage.message.answer);
    returnedAnswer=inMessage.message.answer.split(" ");
    wolfRamFeedback.text(inMessage.message.answer);
    readOutLoud(inMessage.message.answer);

}

  function whoisconnected(connectionInfo)
  {
  
  }

function readOutLoud(message) {
	var speech = new SpeechSynthesisUtterance();

  // Set the text and voice attributes.
	speech.text = message;
	speech.volume = 1;
	speech.rate = 1;
	speech.pitch = 1;
  
	window.speechSynthesis.speak(speech);
}


  