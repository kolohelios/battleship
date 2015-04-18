'use strict';
/* global Firebase */

var root, players, battleships, myKey, myPlayer, lastPaint, rotateCounter, vertOrientation;

$(document).ready(init);

function init(){
  root = new Firebase('https://battleshp-kolohelios.firebaseio.com/');
  players = root.child('players');
  battleships = root.child('battleships');
  $('#create-user').click(createUser);
  $('#login-user').click(loginUser);
  $('#logout-user').click(logoutUser);
  $('#new-player').click(newPlayer);
  $('#create-and-place-ship').click(placeBattleship);
  players.on('child_added', createPlayer);
  battleships.on('child_added', displayShip);
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
        $('#message').text('It looks like ya ben around these parts bifore. Login instead.')
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
      $('#shipcreation').show();
      $('#message').text('Arrrr, welcome den. Let\'s get ta work. Add yer plundrun\' ships!');
    }
  });
}

function logoutUser(){
  root.unauth();
  myKey = null;
  $('#characters > tbody > tr.active').removeClass('active');
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
  console.log('create player');
  myPlayer = snapshot.val();
  myKey = snapshot.key();
  var avatar = myPlayer.avatar;
  var handle = myPlayer.handle;
  var uid = myPlayer.uid;
  var myUid = root.getAuth().uid;
  //var tr =  '<tr class="' + active + '"><td>' + character.handle + '</td><td><img src="' + character.avatar + '"></td></tr>';
  //$('#characters > tbody').append(tr);
  $('#charactercreation').hide();
  $('#shipcreation').show();
}

function placeBattleship(){
  $('#message').text('Click a location to place your ship, click again to rotate.');
  $('#board1 td').on('click', tempPosition);
}

function tempPosition(){
  var shipType = $('#ship-type').val();
  var x = $(this).data('x');
  var y = $(this).data('y');

  console.log(rotateCounter);
  if(x === lastPaint.x && y === lastPaint.y){
    if(rotateCounter === 1){
      addOrRemoveBattleship('rem', shipType, lastPaint.x, lastPaint.y, lastPaint.vertOrientation, 1);
      //vertOrientation = (vertOrientation === undefined) ? 0 : vertOrientation;
      vertOrientation = Math.abs(vertOrientation - 1);
      addOrRemoveBattleship('add', shipType, x, y, vertOrientation, 1);
      rotateCounter = 2;
      lastPaint = {x: x, y: y, vertOrientation: vertOrientation};
    } else if(rotateCounter === 2) {
      addOrRemoveBattleship('rem', shipType, x, y, vertOrientation, 1);
      rotateCounter = 0;
      lastPaint = {x: -1, y: -1, vertOrientation: 0};
    }
  } else {
    //vertOrientation = 0;
    addOrRemoveBattleship('rem', shipType, lastPaint.x, lastPaint.y, lastPaint.vertOrientation, 1);
    addOrRemoveBattleship('add', shipType, x, y, vertOrientation, 1);
    rotateCounter = 1;
    lastPaint = {x: x, y: y, vertOrientation: vertOrientation};
  }

  console.log(lastPaint);
  $('#set-position').on('click', function(){
    name = $('#ship-name').val();
    console.log(name, shipType, x, y, vertOrientation);
    setPosition(name, shipType, x, y, vertOrientation);
  });
}

function setPosition(name, shipType, x, y, vertOrientation){
  console.log('set position');
  battleships.push({
    name: name,
    shipType: shipType,
    x: x,
    y: y,
    vertOrientation: vertOrientation,
    uid: myPlayer.uid
  });
  clearBoard(1);
}

function clearBoard(board){
  $('#board' + board)('.image').removeClass('image imagerotate');
  $('#board' + board + ' .td img').remove();
}

function addOrRemoveBattleship(addOrRemove, shipType, x, y, vertOrientation, board){
  var ships = [{
    name: 'frigate',
    images: ['']
    }, {
    name: 'corvette',
    images: ['']
    }, {
    name: 'man-of-war',
    images: ['']
    }, {
    name: 'junk',
    images: ['/assets/junk0.png', '/assets/junk1.png', '/assets/junk2.png']
    }, {
    name: 'dinghy',
    images: ['/assets/dinghy0.png', '/assets/dinghy1.png']
    }
  ];
  var arridx;
  ships.forEach(function(ship, i){
    if(ship.name === shipType){
      arridx = i;
    }
  });
  var rotateImage = (vertOrientation === 0) ? '' : ' imagerotate';
  for(var i = 0; i < ships[arridx].images.length; i++){
    var $loc = $('#board' + board + ' td[data-x="' + x + '"][data-y="' + y + '"]');
    console.log(ships[arridx].images[i]);
    if(addOrRemove === 'add'){
      $loc.append('<img src="' + ships[arridx].images[i] + '" height="50" width=50" align="right">').addClass('image' + rotateImage);
    }
    else{
      $loc.removeClass('image' + rotateImage).find('img').remove();
    }
    if (vertOrientation === 0){
      x++;
    } else {
      y++;
    }
  }
}

function displayShip(snapshot){
  var ship = snapshot.val();
  console.log(ship);

  if(ship.uid === myPlayer.uid){
    addOrRemoveBattleship('add', ship.shipType, ship.x, ship.y, ship.vertOrientation, 1);
  }
}
