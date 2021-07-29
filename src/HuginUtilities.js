// Copyright (C) 2018, Zpalmtree
//
// Please see the included LICENSE file for more information.

import React from 'react';

import moment from 'moment';

import { Text, Platform, ToastAndroid, Alert } from 'react-native';

import { StackActions, NavigationActions } from 'react-navigation';

import * as Qs from 'query-string';

import Config from './Config';

import { Globals } from './Globals';

import { addFee, toAtomic } from './Fee';

import nacl from 'tweetnacl';
import naclUtil from 'tweetnacl-util';

import Identicon from 'identicon.js';

import { saveToDatabase, loadPayeeDataFromDatabase, saveIncomingMessage, saveOutgoingMessage, savePayeeToDatabase } from './Database';


import {
    toastPopUp,
} from './Utilities';

export function getKeyPair() {
    // return new Promise((resolve) => setTimeout(resolve, ms));
    const [privateSpendKey, privateViewKey] = Globals.wallet.getPrimaryAddressPrivateKeys();
    let secretKey = naclUtil.decodeUTF8(privateSpendKey.substring(1, 33));
    let keyPair = nacl.box.keyPair.fromSecretKey(secretKey);
    return keyPair;


}


export function intToRGB(int) {

  if (typeof int !== 'number') throw new Error(errorMessage);
  if (Math.floor(int) !== int) throw new Error(errorMessage);
  if (int < 0 || int > 16777215) throw new Error(errorMessage);

  var red = int >> 16;
  var green = int - (red << 16) >> 8;
  var blue = int - (red << 16) - (green << 8);

  return {
    red: red,
    green: green,
    blue: blue
  }
}



export function hashCode(str) {
		let hash = Math.abs(str.hashCode())*0.007812499538;
    return Math.floor(hash);

}


export function get_avatar(hash, size) {
  // Displays a fixed identicon until user adds new contact address in the input field
  if (hash.length < 15) {
    hash = 'SEKReYanL2qEQF2HA8tu9wTpKBqoCA8TNb2mNRL5ZDyeFpxsoGNgBto3s3KJtt5PPrRH36tF7DBEJdjUn5v8eaESN2T5DPgRLVY';
  }
  // Get custom color scheme based on address
  let rgb = intToRGB(hashCode(hash));

  // Options for avatar
  var options = {
        foreground: [rgb.red, rgb.green, rgb.blue, 255],               // rgba black
        background: [parseInt(rgb.red/10), parseInt(rgb.green/10), parseInt(rgb.blue/10), 0],         // rgba white
        margin: 0.2,                              // 20% margin
        size: size,                                // 420px square
        format: 'png'                           // use SVG instead of PNG
      };

  // create a base64 encoded SVG
  return 'data:image/png;base64,' + new Identicon(hash, options).toString();
}

export function handle_links(message) {
  geturl = new RegExp(
          "(^|[ \t\r\n])((ftp|http|https|gopher|mailto|news|nntp|telnet|wais|file|prospero|aim|webcal):(([A-Za-z0-9$_.+!*(),;/?:@&~=-])|%[A-Fa-f0-9]{2}){3,}(#([a-zA-Z0-9][a-zA-Z0-9$_.+!*(),;/?:@&~=%-]*))?([A-Za-z0-9$_+!*();/?:~-]))"
         ,"g"
       );

// Instantiate attachments
let youtube_links = '';
let image_attached = '';

// Find links
let links_in_message = message.match(geturl);

// Supported image attachment filetypes
let imagetypes = ['.png','.jpg','.gif', '.webm', '.jpeg', '.webp'];

// Find magnet links
//let magnetLinks = /(magnet:\?[^\s\"]*)/gmi.exec(message);

//message = message.replace(magnetLinks[0], "");

if (links_in_message) {

  for (let j = 0; j < links_in_message.length; j++) {

    if (links_in_message[j].match(/youtu/) || links_in_message[j].match(/y2u.be/)) { // Embeds YouTube links
      message = message.replace(links_in_message[j],'');
      embed_code = links_in_message[j].split('/').slice(-1)[0].split('=').slice(-1)[0];
      youtube_links += '<div style="position:relative;height:0;padding-bottom:42.42%"><iframe src="https://www.youtube.com/embed/' + embed_code + '?modestbranding=1" style="position:absolute;width:80%;height:100%;left:10%" width="849" height="360" frameborder="0" allow="autoplay; encrypted-media"></iframe></div>';
    } else if (imagetypes.indexOf(links_in_message[j].substr(-4)) > -1 ) { // Embeds image links
      message = message.replace(links_in_message[j],'');
      image_attached_url = links_in_message[j];
      image_attached = '<img class="attachment" src="' + image_attached_url + '" />';
    } else { // Embeds other links
      message = message.replace(links_in_message[j],'<a target="_new" href="' + links_in_message[j] + '">' + links_in_message[j] + '</a>');
    }
  }
  return [message, youtube_links, image_attached];
} else {
  return [message,'',''];
}


}

export function nonceFromTimestamp(tmstmp) {

  let nonce = hexToUint(String(tmstmp));

  while ( nonce.length < nacl.box.nonceLength ) {

    tmp_nonce = Array.from(nonce);

    tmp_nonce.push(0);

    nonce = Uint8Array.from(tmp_nonce);

  }

  return nonce;
  }

  export function hexToUint(hexString) {
  return new Uint8Array(hexString.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
}

export function toHex(str,hex){
  try{
    hex = unescape(encodeURIComponent(str))
    .split('').map(function(v){
      return v.charCodeAt(0).toString(16)
    }).join('')
  }
  catch(e){
    hex = str
    console.log('invalid text input: ' + str)
  }
  return hex
}

export async function sendMessage(message, receiver, messageKey, silent=false) {

  let has_history = false;

    if (message.length == 0) {
      return
    }



    // Globals.logger.addLogMessage(Globals.wallet.getPrimaryAddress());

    let my_address = Globals.wallet.getPrimaryAddress();

    const payments = [];

    /* User payment */
    payments.push([
        receiver,
        10
    ]);


    let timestamp = Date.now();




    // Convert message data to json
    payload_json = {"from":my_address, "to":receiver, "msg":message};

    payload_json_decoded = naclUtil.decodeUTF8(JSON.stringify(payload_json));



    let box = nacl.box(payload_json_decoded, nonceFromTimestamp(timestamp), hexToUint(messageKey), getKeyPair().secretKey);



        // **TO DO** Check whether this is the first outgoing transaction to the recipient

        // History has been asserted, continue sending message
    // if (has_history) {
    //   payload_box = {"box":Buffer.from(box).toString('hex'), "t":timestamp};
    // } else {
    //   payload_box = {"box":Buffer.from(box).toString('hex'), "t":timestamp, "key":$('#currentPubKey').text()};
    //   console.log("First message to sender, appending key.");
    // }

    let payload_box = {"box":Buffer.from(box).toString('hex'), "t":timestamp, "key":Buffer.from(getKeyPair().publicKey).toString('hex')};
    // Convert json to hex
    let payload_hex = toHex(JSON.stringify(payload_box));

    // toastPopUp(payload_hex);

    const result = await Globals.wallet.sendTransactionAdvanced(
        payments, // destinations,
        7, // mixin
        {fixedFee: 7500, isFixedFee: true}, // fee
        undefined, //paymentID
        undefined, // subWalletsToTakeFrom
        undefined, // changeAddress
        undefined, // relayToNetwork
        undefined, // sneedAll
        Buffer.from(payload_hex, 'hex')
    );

    if (result.success) {
      saveOutgoingMessage({
        t: timestamp,
        msg: message,
        to: receiver
      });
      toastPopUp('Message sent!');
    } else {
      toastPopUp('Message failed to send.. Sadface');
    }

    Globals.logger.addLogMessage(JSON.stringify(result));
    Globals.logger.addLogMessage(JSON.stringify(result));
    Globals.logger.addLogMessage(JSON.stringify(result));
    Globals.logger.addLogMessage(JSON.stringify(result));
    Globals.logger.addLogMessage(JSON.stringify(result));
    Globals.logger.addLogMessage(JSON.stringify(result));
    Globals.logger.addLogMessage(JSON.stringify(result));
    Globals.logger.addLogMessage(JSON.stringify(result));

    // toastPopUp('Sending message..');
    // toastPopUp(result);
    return '';

    // let magnetLinks = /(magnet:\?[^\s\"]*)/gmi.exec(message);

    // if (!silent) {
    //   let id_elem = Date.now();
    //
    //          // let links = handle_links(message);
    //          // let display_message = links[0];
    //
    // $('#messages').append('<li class="sent_message" id="' + id_elem +  '"><img class="message_avatar" src="data:image/svg+xml;base64,' + avatar_base64 + '"><p>' + display_message + '</p><span class="time" timestamp="' + Date.now() + '">right now</span></li>');
    //   console.log('debagg2', id_elem);
    //   $('#' + id_elem).click(function(){
    //     shell.openExternal($(this).attr('href'));
    //   })
    //
    // if (magnetLinks) {
    //   handleMagnetLink(magnetLinks, id_elem);
    // }
    // }

    // Scroll to bottom
    // $('#messages_pane').scrollTop($('#messages').height());
    //
    // $('#message_form').val('');
    // $('#message_form').focus();

    // receiver = $('#recipient_form').val();


      // keychain.find({ "address": receiver }, function (err, docs) {
      //
      //   if (docs.length == 0) {
      //
      //     keychain.insert({key: $('#recipient_pubkey_form').val(), address: receiver});
      //
      //   }
      //
      // });

      // if (!silent) {
      // $('#loading_border').animate({width: '40%'},600);
      // $('#message_form').prop('disabled',true);
      // }

      // Transaction details

      //
      //
      // transfer = [ { 'amount':amount, 'address':receiver } ];
      //
      // return sendTransaction(mixin, transfer, fee, sendAddr, payload_hex, payload_json, silent);
      //
      // });


}

export function fromHex(hex,str){
  try{
    str = decodeURIComponent(hex.replace(/(..)/g,'%$1'))
  }
  catch(e){
    str = hex
    // console.log('invalid hex input: ' + hex)
  }
  return str
}

export async function getMessage(hash){

  Globals.logger.addLogMessage('Getting payees..');

  let payees = await loadPayeeDataFromDatabase();

  Globals.logger.addLogMessage('Payees: ' + JSON.stringify(payees));

  return new Promise((resolve, reject) => {

  // or
  // reject(new Error("Error!"));


    // let nodeURL = 'http://wasa.kryptokrona.se:11898/json_rpc';

    const daemonInfo = Globals.wallet.getDaemonConnectionInfo();
    let nodeURL = `${daemonInfo.ssl ? 'https://' : 'http://'}${daemonInfo.host}:${daemonInfo.port}/json_rpc`;

    Globals.logger.addLogMessage('Message possibly received: ' + hash);
    Globals.logger.addLogMessage('Using rpc: ' + nodeURL);

    fetch(nodeURL, {
    method: 'POST',
    body: JSON.stringify({
      jsonrpc: '2.0',
      method: 'f_transaction_json',
      params: {hash: hash}
    })
  })
  .then((response) => response.json())
  .then((json) => {
    Globals.logger.addLogMessage('Message ?: ' + JSON.stringify(json));
    let data = fromHex(json.result.tx.extra.substring(66));

    Globals.logger.addLogMessage('Message detected: ' + data);

    let tx = JSON.parse(data);

    if (tx.key && tx.t) {


        let senderKey = tx.key;

        let box = tx.box;

        let timestamp = tx.t;

	        let decryptBox = nacl.box.open(hexToUint(box), nonceFromTimestamp(timestamp), hexToUint(senderKey), getKeyPair().secretKey);

        if (!decryptBox) {
					console.log('Cant decrypt new conversation');
          reject();
        }

        let message_dec = naclUtil.encodeUTF8(decryptBox);

        let payload_json = JSON.parse(message_dec);

        payload_json.t = timestamp;

        let exists = false;

        for (payee in payees) {

          if (payees[payee].paymentID == senderKey) {
            exists = true;
          }

        }

        if (!exists) {

          let payee = {nickname: payload_json.from, paymentID: senderKey, "address": payload_json.from};
          savePayeeToDatabase(payee);

        }

        saveIncomingMessage(payload_json);

        resolve(payload_json);

    } else {

        if (tx.m || tx.b) {
          reject();
        }

        // If no key is appended to message we need to try the keys in our payload_keychain
        let box = tx.box;
        console.log('box', box);
        console.log('tx', tx);
        console.log('tx', tx);

        let timestamp = tx.t;

        let decryptBox = false;

        let i = 0;


            while (!decryptBox && i < payees.length) {

              let possibleKey = payees[i].paymentID;
              i += 1;
              console.log('Trying key:', possibleKey);
              Globals.logger.addLogMessage('Trying key: ' + possibleKey);
              try {
               decryptBox = nacl.box.open(hexToUint(box),
               nonceFromTimestamp(timestamp),
               hexToUint(possibleKey),
               getKeyPair().secretKey);
             } catch (err) {
               // console.log('timestamp', timestamp);
               console.log(err);
               continue;
             }
             console.log('Decrypted:', decryptBox);

              if (!decryptBox) {
                console.log('Cannot decrypt..');
                continue;
              }


              let message_dec = naclUtil.encodeUTF8(decryptBox);

              let payload_json = JSON.parse(message_dec);

              payload_json.t = timestamp;
              // console.log(payload_json);

              saveIncomingMessage(payload_json);

              resolve(payload_json);

            }


          }
          // console.log('Decrypting..');


    // }

    // END PASTE
//
//     let data = fromHex(json.result.tx.extra.substring(66));
//
//     Globals.logger.addLogMessage('Message detected: ' + data);
//
//     let tx = JSON.parse(data);
//
//     let senderKey = 'ada8e36ba2874b16c551caa4537805ab802147dc52747910dc9869f42e6c712c'; //tx.key;
//
//     let box = tx.box;
//
//     let timestamp = tx.t;
//
//     let decryptBox = nacl.box.open(hexToUint(box), nonceFromTimestamp(timestamp), hexToUint(senderKey), getKeyPair().secretKey);
//
//   if (!decryptBox) {
//     console.log('Cant decrypt new conversation');
//     reject();
//   }
//
//   let message_dec = naclUtil.encodeUTF8(decryptBox);
//
//   let payload_json = JSON.parse(message_dec);
//
//   resolve(payload_json);
//
   })
  .catch((error) => Globals.logger.addLogMessage(error))
});

}
