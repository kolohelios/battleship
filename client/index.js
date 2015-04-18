'use strict';
/* global Firebase */

var root, players, battleships, myKey, myPlayer;

$(document).ready(init);

function init(){
  root = new Firebase('https://battleshp-kolohelios.firebaseio.com/');
  players = root.child('players');
  battleships = root.child('battleships');
  $('#create-user').click(createUser);
  $('#login-user').click(loginUser);
  $('#logout-user').click(logoutUser);
  $('#new-player').click(newPlayer);
  players.on('child_added', createPlayer);
  $('#message').text('Ahoy, matey! Ya best be gettin\' to loggin\' if ya wanna play deh game!');


}

function createUser(){
  var email = $('#email').val();
  var password = $('#password').val();
  root.createUser({
    email : email,
    password : password
  }, function(error, userData) {
    if (error) {
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
  console.log('running');
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
  var myPlayer = snapshot.val();
  var myKey = snapshot.key();
  var avatar = myPlayer.avatar;
  var handle = myPlayer.handle;
  var uid = myPlayer.uid;
  var myUid = root.getAuth().uid;
  //var tr =  '<tr class="' + active + '"><td>' + character.handle + '</td><td><img src="' + character.avatar + '"></td></tr>';
  //$('#characters > tbody').append(tr);
  $('#charactercreation').hide();
  $('#shipcreation').show();
}

function createBattleship(){
  var battleshipType = $('#ship-type');
  var battleshipName = $('#ship-name');


}

function placeBattleship(){

}

function paintBattleship(ship, x, y, orientation){

  var dinghy = ['/assets/dinghy1.png', '/assets/dinghy2.png'];

  for(var i = 0; i < dinghy.length; i++){
    $('td[data-x="' + x + '"][data-y="' + (y + i) + '"]').append('<img src="/assets/' + ship + i + '.png" height="50" width=50" align="right">').addClass('image').addClass('imagerotate');
  }


}
