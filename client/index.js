'use strict';
/* global Firebase */

var root, players, battleships;

$(document).ready(init);

function init(){
  root = new Firebase('https://battleshp-kolohelios.firebaseio.com/');
  players = root.child('players');
  battleships = root.child('battleships');
  $('#create-user').click(createUser);
  $('#login-user').click(loginUser);
  $('#logout-user').click(logoutUser);
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
      console.log('Error creating user:', error);
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
      console.log('Login successful');
    }
  });
}

function logoutUser(){

}
