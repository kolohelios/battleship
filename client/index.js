'use strict';
/* global Firebase */

var root, players, battleships, games; // Firebase & children
var myKey, myPlayer; // Firebase objects and keys
var lastPaint, rotateCounter, vertOrientation, shipType, x, y; // general globals

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
  players.on('child_added', createPlayer);
  battleships.on('child_added', displayShip);
  battleships.on('child_changed', updateShip);
  games.on('child_added', createGame);
  $('#message').text('Ahoy, matey! Ya best be gettin\' to loggin\' if ya wanna play deh game!');
  lastPaint = {x: 0, y: 0, vertOrientation: 0};
  rotateCounter = 0;
  vertOrientation = 0;
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
      }
      else if(error){
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
    if (error) {
      console.log('Login Failed!', error);
    } else {
      $('#user').hide();
      $('#charactercreation').show();
      $('#message').text('Arrrr, welcome den. Let\'s get ta work. Add yer plundrun\' ships!');
    }
  });
}

function logoutUser(){
  root.unauth();
  myKey = null;
  $('#user').show();
}

function newPlayer(){
  var handle = $('#handle').val();
  var avatar= $('#avatar').val();
  var uid = root.getAuth().uid;
  players.push({
    handle: handle,
    avatar: avatar,
    uid: uid
  });
}

function createPlayer(snapshot){
  var player = snapshot.val();

  console.log('player uid: ', player.uid);
  console.log('root getauth: ', root.getAuth().uid);

  if(root.getAuth().uid === player.uid){
    myPlayer = snapshot.val();
    myKey = snapshot.key();
    var avatar = myPlayer.avatar;
    var handle = myPlayer.handle;
    var uid = myPlayer.uid;
    var myUid = root.getAuth().uid;
    $('#user').hide();
    console.log(handle);
    $('#player1').text(handle);
    $('#charactercreation').hide();
    $('#shipcreation').show();
  }
}

function placeBattleship(){
  $('#message').text('Click a location to place your ship, click again to rotate.');

  console.log(shipType);
  $('#board1 td').on('click', tempPosition);
  $('#create-and-place-ship').hide();
  $('#set-position').show();
}

function tempPosition(){
  shipType = $('#ship-type').val();
  console.log('running tempposition, rotateCounter:', rotateCounter);

  x = $(this).data('x');
  y = $(this).data('y');

  if(rotateCounter === 0){
    var spaceClear = true;
    getShipCoords(shipType, x, y).forEach(function(loc){
      if(isShipPresent(loc[0], loc[1], 1) === true){
        spaceClear = false;
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
  //console.log(addOrRemove, shipType, x, y, vertOrientation, board);
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
  var ship = snapshot.val();

  if(ship.uid === myPlayer.uid){
    addOrRemoveBattleship('add', ship.shipType, ship.x, ship.y, ship.vertOrientation, 1);
    $('#ship-type option[value="' + ship.shipType + '"]').remove();
  }
  if($('#ship-type').find('option').length === 0){
    games.push({ player: [myPlayer.uid] });
  }
}

function updateShip(snapshot){

}

function createGame(snapshot){
  var gameKey = snapshot.key();
  players.child(myKey).update({
    activeGame: gameKey
  });
  $('#message').text('Waiting for another pirate to scrum with!');
  $('#shipcreation').hide();
  $('#board1').hide();
  $('#board2').show();
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
