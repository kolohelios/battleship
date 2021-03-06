'use strict';
/* global Firebase */

var root, players, battleships, games, strikes; // Firebase & children
var myUid, myKey, myPlayer, myGame, myGameKey, playerNum; // Firebase objects and keys
var lastPaint, rotateCounter, vertOrientation, shipType, x, y; // general globals
var $sound;

var ships = [{
  name: 'frigate',
  images: ['/assets/frigate0.png', '/assets/frigate1.png', '/assets/frigate2.png', '/assets/frigate3.png', '/assets/frigate4.png']
  }, {
  name: 'corvette',
  images: ['/assets/corvette0.png', '/assets/corvette1.png', '/assets/corvette2.png', '/assets/corvette3.png']
  }, {
  name: 'man-of-war',
  images: ['/assets/man-of-war0.png', '/assets/man-of-war1.png', '/assets/man-of-war2.png']
  }, {
  name: 'junk',
  images: ['/assets/junk0.png', '/assets/junk1.png', '/assets/junk2.png']
  }, {
  name: 'dinghy',
  images: ['/assets/dinghy0.png', '/assets/dinghy1.png']
  }
];

var cannonSnd = '/assets/cannon.wav';

$(document).ready(init);

function init(){
  root = new Firebase('https://battleshp-kolohelios.firebaseio.com/');
  players = root.child('players');
  battleships = root.child('battleships');
  games = root.child('games');
  $('#create-user').click(createUser);
  $('#login-user').click(loginUser);
  $('#logout-user').click(logoutUser);
  $('#new-player').click(newPlayer);
  $('#create-and-place-ship').click(placeBattleship);
  $('#set-position').click(setPosition);
  $('#switch-boards').click(switchBoards);
  $('#board2 td').on('click', strike);
  players.on('child_added', createPlayer);
  games.on('child_added', createGame);
  games.on('child_changed', updateGame);
  battleships.on('child_added', displayShip);
  switchGameMode('login');
  lastPaint = {x: 0, y: 0, vertOrientation: 0};
  rotateCounter = 0;
  vertOrientation = 0;
  $sound = $('#sound');
}

function createUser(){
  var email = $('#email').val();
  var password = $('#password').val();
  root.createUser({
    email : email,
    password : password
  }, function(error, userData) {
    if (error.code === 'EMAIL_TAKEN'){
        $('#message').text('It looks like ya ben around these parts bifore. Login instead.');
      } else if(error){
      console.log('Error creating user:', error);
    } else {
      console.log('Success creating user:', userData);
    }
  });
}

function loginUser(){
  var email = $('#email').val();
  var password = $('#password').val();

  root.authWithPassword({
    email : email,
    password : password
  }, function(error, authData) {
    if(error){
      if(error.code === 'INVALID_PASSWORD'){
      $('#message').text('Check yer password.');
      } else if(error.code === 'INVALID_EMAIL'){
        $('#message').text('Check yer email address.');
      } else if(error) {
        console.log('Login Failed!', error);
      }
    } else {
      switchGameMode('loggedin');
    }
  });
}

function logoutUser(){
  root.unauth();
  myKey = null;
  switchGameMode('logout');
  location.reload();
}

function newPlayer(){
  var handle = $('#handle').val();
  var avatar= $('#avatar').val();
  myUid = root.getAuth().uid;
  players.push({
    handle: handle,
    avatar: avatar,
    activeGame: '',
    uid: myUid
  });
}

function createPlayer(snapshot){
  if(snapshot !== undefined && root.getAuth() !== null){
    var player = snapshot.val();
    if(root.getAuth().uid === player.uid){
      myPlayer = snapshot.val();
      myKey = snapshot.key();
      var handle = myPlayer.handle;
      var uid = myPlayer.uid;
      switchGameMode('createplayer');
    }
  }
}

function placeBattleship(){
  switchGameMode('createboard');
  $('#board1 td').on('click', tempPosition);

}

function tempPosition(){
  shipType = $('#ship-type').val();

  x = $(this).data('x');
  y = $(this).data('y');

  if(rotateCounter === 0){
    var spaceClear = true;
    getShipCoords(shipType, x, y).forEach(function(loc){
      if(isShipPresent(loc[0], loc[1], 1) === true){
        if(loc[0] > -1 && loc[0] < 10 && loc[1] > -1 && loc[1] < 10){
          spaceClear = false;
        }
      }
    });
    if(spaceClear){
      addOrRemoveBattleship('add', shipType, x, y, vertOrientation, 1);
      rotateCounter = 1;
      lastPaint = {x: x, y: y, vertOrientation: vertOrientation};
    }
  }
  else if(rotateCounter === 1){
    addOrRemoveBattleship('rem', shipType, lastPaint.x, lastPaint.y, lastPaint.vertOrientation, 1);
    vertOrientation = Math.abs(vertOrientation - 1);
    addOrRemoveBattleship('add', shipType, lastPaint.x, lastPaint.y, vertOrientation, 1);
    rotateCounter = 2;
  } else if(rotateCounter === 2) {
    addOrRemoveBattleship('rem', shipType, x, y, vertOrientation, 1);
    rotateCounter = 0;
    vertOrientation = 0;
  }
}

function setPosition(){
  var name = $('#ship-name').val();
  addOrRemoveBattleship('rem', shipType, x, y, vertOrientation, 1);
  $('#create-and-place-ship').show();
  $('#set-position').hide();
  $('#board1 td').off('click', tempPosition);
  var battleship = {
    shipType: shipType,
    x: x,
    y: y,
    vertOrientation: vertOrientation,
    uid: myPlayer.uid
  };
  rotateCounter = 0;
  vertOrientation = 0;
  battleships.push(battleship);
}

function addOrRemoveBattleship(addOrRemove, shipType, x, y, vertOrientation, board){
  var arridx;
  ships.forEach(function(ship, i){
    if(ship.name === shipType){
      arridx = i;
    }
  });
  var rotateImage = (vertOrientation === 0) ? '' : ' shiprotate';
  for(var i = 0; i < ships[arridx].images.length; i++){
    var $loc = $('#board' + board + ' td[data-x="' + x + '"][data-y="' + y + '"]');
    if(addOrRemove === 'add'){
      $loc.append('<img src="' + ships[arridx].images[i] + '" height="50" width=50" align="right">').addClass('ship' + rotateImage);
    }
    else{
      $loc.removeClass('ship' + rotateImage).find('img').remove();
    }
    if (vertOrientation === 0){
      x++;
    } else {
      y++;
    }
  }
}

function getShipCoords(shipType, checkX, checkY){
  var arrayOfCoords = [];
  var arridx;
  ships.forEach(function(ship, i){
    if(ship.name === shipType){
      arridx = i;
    }
  });
  for(var i = 0; i < ships[arridx].images.length; i++){
    arrayOfCoords.push([checkX, checkY]);
  }
  if(vertOrientation === 0){
    checkX++;
  } else {
    checkY++;
  }
  return arrayOfCoords;
}

function displayShip(snapshot){
  if(snapshot !== undefined && myPlayer !== undefined){
    var ship = snapshot.val();
    if(ship.uid === myPlayer.uid){
      addOrRemoveBattleship('add', ship.shipType, ship.x, ship.y, ship.vertOrientation, 1);
      $('#ship-type option[value="' + ship.shipType + '"]').remove();
    }

    if($('#ship-type').find('option').length < 1){
      games.once('child_added', createGame);
      //createGame();
    }
  }
}

function createGame(snapshot){

  if(snapshot === undefined){
    games.push({
      p1: myPlayer.uid,
      p1handle: myPlayer.handle,
      p2: '',
      p2handle: '',
      strikes: [],
      p1points: 0,
      p2points: 0,
      turn: 'p1'
    });
  } else{
    var game = snapshot.val();
    if(game.p1 === myPlayer.uid || game.p2 === myPlayer.uid){
      myGameKey = snapshot.key();
      myGame = snapshot.val();
      players.child(myKey).update({
        activeGame: myGameKey
      });
      if($('#ship-type').find('option').length < 1){
        switchGameMode('startgame');
      }
    } else if(game.p2 === '' && game.p1 !== myPlayer.uid && myPlayer.activeGame === ''){
        myGameKey = snapshot.key();
        myGame = snapshot.val();
        players.child(myKey).update({
          activeGame: myGameKey
        });
        games.child(myGameKey).update({
          p2: myPlayer.uid,
          p2handle: myPlayer.handle
        });
        if($('#ship-type').find('option').length < 1){
          switchGameMode('startgame');
        }
      displayActivePlayer();
    }
  }
}

function isShipPresent(x, y, board){
  var $loc = $('#board' + board + ' td[data-x="' + x + '"][data-y="' + y + '"]');
  if ($loc.hasClass('ship')){
    return true;
  }
  else{
    return false;
  }
}

function switchBoards(){
  $('#board1').toggle();
  $('#board2').toggle();
}

function switchGameMode(gameMode){
  switch (gameMode){
    case 'login':
      $('#message').text('Ahoy, matey! Ya best be gettin\' to loggin\' if ya wanna play deh game!');
      $('#board1').hide();
      $('#board2').hide();
      $('#players').hide();
      break;
    case 'loggedin':
      $('#user').hide();
      $('#charactercreation').show();
      $('#message').text('Create a player mate.');
      break;
    case 'logout':
      $('#user').show();
      $('#board1').hide();
      $('#board2').hide();
      clearBoards();
      $('#players').hide();
      $('#message').text('Ahoy, matey! Ya best be gettin\' to loggin\' if ya wanna play deh game!');
      break;
    case 'createplayer':
      $('#message').text('Arrrr, welcome den. Let\'s get ta work. Add yer plundrun\' ships!');
      $('#user').hide();
      $('#charactercreation').hide();
      $('#shipcreation').show();
      $('#board1').show();
      break;
    case 'createboard':
      $('#create-and-place-ship').hide();
      $('#set-position').show();
      $('#message').text('Click a location to place your ship, click again to rotate.');
      break;
    case 'startgame':
      $('#players').show();
      $('#message').text('Waiting for another pirate to scrum with!');
      $('#board1 td').off('click', tempPosition);
      $('#shipcreation').hide();
      $('#p1').text(myGame.p1handle);
      $('#p2').text(myGame.p2handle);
      displayActivePlayer();
      strikes = games.child(myGameKey).child('strikes');
      strikes.on('child_added', paintStrikes);
      strikes.on('child_changed', paintStrikes);
    case 'gameinprogress':
      $('#message').text('Yar be playin\' now.');
  }
}

function clearBoards(){
  for(var i = 1; i <= 2; i++){
    for(var j = 0; j < 10; j++){
      for(var k = 0; k < 10; k++){
        var $loc = $('#board' + i + ' td[data-x="' + j + '"][data-y="' + k + '"]');
        $loc.removeClass('ship shiprotate hit miss');
        $loc.find('img').remove();
      }
    }
  }
}

function displayActivePlayer(){
  if(myGame.p1 === myPlayer.uid){
    playerNum = 'p1';
  }
  else{
    playerNum = 'p2';
  }
  console.log('player num:', playerNum, 'whose turn:', myGame.turn);

  if(myGame.turn === 'p1' && playerNum === 'p1'){
    $('#p1').addClass('active');
    $('#p2').removeClass('active');
    $('#message').text('Yar turn.');
    $('#board2').show();
    $('#board1').hide();
  } else if(myGame.turn === 'p2' && playerNum === 'p2'){
    $('#p2').addClass('active');
    $('#p1').removeClass('active');
    $('#message').text('Yar turn.');
    $('#board2').show();
    $('#board1').hide();
  } else if((myGame.turn === 'p1' && playerNum === 'p2') || (myGame.turn === 'p2' && playerNum === 'p1')){
    $('#message').text('The guppy\'s turn.');
    $('#board1').show();
    $('#board2').hide();
    if(myGame.turn === 'p1'){
      $('#p1').addClass('active');
      $('#p2').removeClass('active');
    } else{
      $('#p1').removeClass('active');
      $('#p2').addClass('active');
    }
  }
}

function strike(){
    if(myGame.turn ===  playerNum){
      var strikeX = $(this).data('x');
      var strikeY = $(this).data('y');

      playSound(cannonSnd);

      if(myGame.turn === 'p1'){
        games.child(myGameKey).update({
          turn: 'p2'
        });
      } else {
        games.child(myGameKey).update({
          turn: 'p1'
        });
      }

      strikes.push({
        p: playerNum, x: strikeX, y: strikeY, hitOrMiss: ''
      });
    }
}

function paintStrikes(snapshot){
  var strike = snapshot.val();
  var strikeKey = snapshot.key();
  var player = strike.p;
  var strikeX = strike.x;
  var strikeY = strike.y;
  var hitOrMiss = strike.hitOrMiss;

  if(player === playerNum){
    var board = 2;
    var $loc = $('#board' + board + ' td[data-x="' + strike.x + '"][data-y="' + strike.y + '"]');
    $loc.addClass(strike.hitOrMiss);
  }
  else{
    var board = 1;
    var $loc = $('#board' + board + ' td[data-x="' + strike.x + '"][data-y="' + strike.y + '"]');
    if($loc.hasClass('ship')){
      strikes.child(strikeKey).update({
        hitOrMiss: 'hit'
      });
      $loc.addClass(strike.hitOrMiss);
    } else {
      strikes.child(strikeKey).update({
        hitOrMiss: 'miss'
      });
      $loc.addClass(strike.hitOrMiss);
    }
  }
}

function updateGame(snapshot){
  myGame = snapshot.val();
  displayActivePlayer();
}

function playSound(sound){
  $sound.attr('src', sound);
  $sound[0].play();
}
