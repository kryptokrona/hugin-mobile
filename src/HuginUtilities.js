// Copyright (C) 2018, Zpalmtree
//
// Please see the included LICENSE file for more information.

import React from 'react';
import PushNotification from 'react-native-push-notification';
import moment from 'moment';

import { Text, Platform, ToastAndroid, Alert } from 'react-native';

import { StackActions, NavigationActions } from 'react-navigation';

import * as Qs from 'query-string';

import Config from './Config';

import { Globals } from './Globals';

import { addFee, toAtomic } from './Fee';

import nacl from 'tweetnacl';
import naclUtil from 'tweetnacl-util';

import * as NaclSealed from 'tweetnacl-sealed-box';

import Identicon from 'identicon.js';

import { getMessages, saveToDatabase, loadPayeeDataFromDatabase, saveMessage, savePayeeToDatabase } from './Database';


import {
    Address,
    AddressPrefix,
    Block,
    BlockTemplate,
    Crypto,
    CryptoNote,
    LevinPacket,
    Transaction
} from 'kryptokrona-utils';
const xkrUtils = new CryptoNote()
const crypto = new Crypto()

import {
    toastPopUp,
} from './Utilities';



function trimExtra (extra) {

  try {

    let payload = fromHex(extra.substring(66));
    let payload_json = JSON.parse(payload);
    return fromHex(extra.substring(66))

  } catch (e) {

    return fromHex(Buffer.from(extra.substring(78)).toString())

  }

}


    PushNotification.configure({
        onNotification: handleNotification,

        permissions: {
            alert: true,
            badge: true,
            sound: true,
        },

        popInitialNotification: true,

        requestPermissions: true,
    });
function handleNotification(notification) {
    notification.finish(PushNotificationIOS.FetchResult.NoData);
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


export function getKeyPair() {
  // return new Promise((resolve) => setTimeout(resolve, ms));
  const [privateSpendKey, privateViewKey] = Globals.wallet.getPrimaryAddressPrivateKeys();
  let secretKey = hexToUint(privateSpendKey);
  let keyPair = nacl.box.keyPair.fromSecretKey(secretKey);
  return keyPair;

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
    //console.log('invalid text input: ' + str)
  }
  return hex
}

export async function optimizeMessages(nbrOfTxs) {

  // toastPopUp('Optimizing wallet!');
  let payments = [];
  let i = 0;
  /* User payment */
  while (i < nbrOfTxs - 1 && i < 10) {
    payments.push([
        Globals.wallet.getPrimaryAddress(),
        10000
    ]);

    i += 1;

  }

  let result = await Globals.wallet.sendTransactionAdvanced(
      payments, // destinations,
      0, // mixin
      {fixedFee: 10000, isFixedFee: true}, // fee
      undefined, //paymentID
      [Globals.wallet.getPrimaryAddress()], // subWalletsToTakeFrom
      undefined, // changeAddress
      true, // relayToNetwork
      false, // sneedAll
      undefined
  );

  if (result.success) {
    // toastPopUp('Optimizing wallet!');
  } else {
    toastPopUp('Failed to optimize wallet');
  }

  return result;
      //
      // let my_address = Globals.wallet.getPrimaryAddress();
      //
      // let my_addresses = Globals.wallet.getAddresses();
      //
      // let my_message_address = '';
      // let my_change_address = '';
      //
      // if (my_addresses.length < 3) {
      //   let [address, error] = await Globals.wallet.addSubWallet();
      //   if (!error) {
      //        //console.log(`Created subwallet with address of ${address}`);
      //   } else {
      //     my_message_address = address;
      //
      //   }
      //
      //   let [address2, error2] = await Globals.wallet.addSubWallet();
      //   if (!error2) {
      //        //console.log(`Created subwallet with address of ${address}`);
      //   } else {
      //     my_change_address = address2;
      //
      //   }
      //
      // } else {
      //   my_message_address = my_addresses[1];
      //   my_change_address = my_addresses[2];
      // }
      //
      // let payments = [];
      //
      // let nbrOfTxs = transaction.totalAmount() / 0.00011;
      // let i = 0;
      // /* User payment */
      // while (i < nbrOfTxs) {
      //   payments.push([
      //       my_message_address,
      //       11
      //   ]);
      //
      //   i += 1;
      //
      // }
      //
      // let result = await Globals.wallet.sendTransactionAdvanced(
      //     payments, // destinations,
      //     0, // mixin
      //     {fixedFee: 10, isFixedFee: true}, // fee
      //     undefined, //paymentID
      //     [my_address], // subWalletsToTakeFrom
      //     my_change_address, // changeAddress
      //     true, // relayToNetwork
      //     false, // sneedAll
      //     undefined
      // );
      //
      // if (result.success) {
      //   toastPopUp('Optimizing wallet!');
      // } else {
      //   toastPopUp('Failed to optimizeMessages');
      // }
      //
      // Globals.logger.addLogMessage(JSON.stringify(result));
      //
      // // toastPopUp('Sending message..');
      // // toastPopUp(result);
      // return '';



}

export async function sendMessage(message, receiver, messageKey, silent=false) {

  // toastPopUp('Sending massage!');

  let has_history = false;

    if (message.length == 0) {
      return;
    }



    // Globals.logger.addLogMessage(Globals.wallet.getPrimaryAddress());


    let my_address = Globals.wallet.getPrimaryAddress();

    let my_addresses = Globals.wallet.getAddresses();
    //console.log('my_addr', my_addresses);

    try {

      let [munlockedBalance, mlockedBalance] = await Globals.wallet.getBalance([my_address]);
      //console.log('bal', munlockedBalance, mlockedBalance);

      if (munlockedBalance < 11 && mlockedBalance > 0) {

        toastPopUp('Please wait for more funds to unlock!');
        return;

      }
    } catch (err) {
      toastPopUp('Error!');
      return;
    }
    // toastPopUp('Success!');

    // let payments = [];
    //
    // /* User payment */
    // payments.push([
    //     receiver,
    //     10
    // ]);


    let timestamp = Date.now();




        // **TO DO** Check whether this is the first outgoing transaction to the recipient

    let old_messages = await getMessages();

            for (msg in old_messages) {
              if (old_messages[msg].conversation == receiver && old_messages[msg].type == 'received') {
                has_history = true;
              }

            }

        // History has been asserted, continue sending message

    let box;

    if (!has_history) {
      //console.log('No history found..');
      // payload_box = {"box":Buffer.from(box).toString('hex'), "t":timestamp};
      const addr = await Address.fromAddress(my_address);
      const [privateSpendKey, privateViewKey] = Globals.wallet.getPrimaryAddressPrivateKeys();
      let xkr_private_key = privateSpendKey;
      let signature = await xkrUtils.signMessage(message, xkr_private_key);
      let payload_json = {"from":my_address, "k": Buffer.from(getKeyPair().publicKey).toString('hex'), "msg":message, "s": signature};
      let payload_json_decoded = naclUtil.decodeUTF8(JSON.stringify(payload_json));
      box = new NaclSealed.sealedbox(payload_json_decoded, nonceFromTimestamp(timestamp), hexToUint(messageKey));
    } else {
      //console.log('Has history, not using sealedbox');
      // Convert message data to json
      let payload_json = {"from":my_address, "msg":message};

      let payload_json_decoded = naclUtil.decodeUTF8(JSON.stringify(payload_json));



      box = nacl.box(payload_json_decoded, nonceFromTimestamp(timestamp), hexToUint(messageKey), getKeyPair().secretKey);

    }

    let payload_box = {"box":Buffer.from(box).toString('hex'), "t":timestamp};

    // let payload_box = {"box":Buffer.from(box).toString('hex'), "t":timestamp, "key":Buffer.from(getKeyPair().publicKey).toString('hex')};
    // Convert json to hex
    let payload_hex = toHex(JSON.stringify(payload_box));

    // toastPopUp(payload_hex);

    let result = await Globals.wallet.sendTransactionAdvanced(
        [[receiver, 1]], // destinations,
        0, // mixin
        {fixedFee: 2500, isFixedFee: true}, // fee
        undefined, //paymentID
        [my_address], // subWalletsToTakeFrom
        undefined, // changeAddress
        true, // relayToNetwork
        false, // sneedAll
        Buffer.from(payload_hex, 'hex')
    );
    console.log('result', result);
    if (result.success) {

      saveMessage(receiver, 'sent', message, timestamp);
      // toastPopUp('Message sent!');
      return true;
      // optimizeMessages(2);
    } else {

      toastPopUp('Message failed to send..');
      return false;


    }

    Globals.logger.addLogMessage(JSON.stringify(result));

    // return '';

    // let magnetLinks = /(magnet:\?[^\s\"]*)/gmi.exec(message);

    // if (!silent) {
    //   let id_elem = Date.now();
    //
    //          // let links = handle_links(message);
    //          // let display_message = links[0];
    //
    // $('#messages').append('<li class="sent_message" id="' + id_elem +  '"><img class="message_avatar" src="data:image/svg+xml;base64,' + avatar_base64 + '"><p>' + display_message + '</p><span class="time" timestamp="' + Date.now() + '">right now</span></li>');
    //   //console.log('debagg2', id_elem);
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
    // //console.log('invalid hex input: ' + hex)
  }
  return str
}

export async function getExtra(hash){
  return new Promise((resolve, reject) => {
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
      let data = fromHex(json.result.tx.extra);
      resolve(data);
     })
    .catch((error) => Globals.logger.addLogMessage(error))

  })
}

export async function getMessage(extra){

  Globals.logger.addLogMessage('Getting payees..');

  let payees = await loadPayeeDataFromDatabase();
  let old_messages = await getMessages();

  Globals.logger.addLogMessage('Payees: ' + JSON.stringify(payees));

  return new Promise((resolve, reject) => {

    let data = trimExtra(extra);

    Globals.logger.addLogMessage('Message detected: ' + data);

    let tx = JSON.parse(data);

    // if (tx.key && tx.t) {
    //
    //
    //     let senderKey = tx.key;
    //
    //     let box = tx.box;
    //
    //     let timestamp = tx.t;
    //
	  //       let decryptBox = nacl.box.open(hexToUint(box), nonceFromTimestamp(timestamp), hexToUint(senderKey), getKeyPair().secretKey);
    //
    //     if (!decryptBox) {
		// 			//console.log('Cant decrypt new conversation');
    //       reject();
    //     }
    //
    //     let message_dec = naclUtil.encodeUTF8(decryptBox);
    //
    //     let payload_json = JSON.parse(message_dec);
    //
    //     payload_json.t = timestamp;
    //
    //     let exists = false;
    //
    //     for (payee in payees) {
    //
    //       if (payees[payee].paymentID == senderKey) {
    //         exists = true;
    //       }
    //
    //     }
    //
    //     if (!exists) {
    //
    //       let payee = {nickname: payload_json.from, paymentID: senderKey, "address": payload_json.from};
    //       savePayeeToDatabase(payee);
    //
    //     }
    //
    //     saveIncomingMessage(payload_json);
    //
    //     resolve(payload_json);
    //
    // } else {

        if (tx.m || tx.b || tx.brd) {
          console.log('Found shitty tx!');
          reject();
        }

        // If no key is appended to message we need to try the keys in our payload_keychain
        let box = tx.box;
        //console.log('box', box);
        //console.log('tx', tx);
        //console.log('tx', tx);

        let timestamp = tx.t;

        let decryptBox = false;
        let createNewPayee = false;

        try {
         decryptBox = NaclSealed.sealedbox.open(hexToUint(box),
         nonceFromTimestamp(timestamp),
         getKeyPair().secretKey);
         createNewPayee = true;
         } catch (err) {
           // //console.log('timestamp', timestamp);
           //console.log(err);
         }
         //console.log(decryptBox);

        let i = 0;


            while (!decryptBox && i < payees.length) {

              let possibleKey = payees[i].paymentID;
              i += 1;
              //console.log('Trying key:', possibleKey);
              Globals.logger.addLogMessage('Trying key: ' + possibleKey);
              try {
               decryptBox = nacl.box.open(hexToUint(box),
               nonceFromTimestamp(timestamp),
               hexToUint(possibleKey),
               getKeyPair().secretKey);
             } catch (err) {
               // //console.log('timestamp', timestamp);
               //console.log(err);
               continue;
             }
             //console.log('Decrypted:', decryptBox);

             }



              let message_dec = naclUtil.encodeUTF8(decryptBox);

              //console.log(message_dec);

              let payload_json = JSON.parse(message_dec);

              payload_json.t = timestamp;
               console.log(payload_json);
               let from = payload_json.from;
              //console.log('from', from);
              //console.log('walletaddr',  Globals.wallet.getPrimaryAddress());
               if (from == Globals.wallet.getPrimaryAddress()) {
                 //console.log('Message is from self, ignore');
                 return;
               }



              for (payee in payees) {

                if (payees[payee].address == from) {
                  from = payees[payee].nickname;
                  createNewPayee = false;
                }

              }

              if (createNewPayee) {
                // let new_payee = {nickname: payload_json.from, paymentID: payload_json.k, "address": payload_json.from};
                // //console.log('Adding new payee', new_payee);
                // savePayeeToDatabase(new_payee);
                const payee = {
                    nickname: payload_json.from.substring(0,12) + "..",
                    address: payload_json.from,
                    paymentID: payload_json.k,
                };
                Globals.addPayee(payee);

              }

              let is_known = false;

                      for (msg in old_messages) {
                        // //console.log('old_messages[msg].timestamp', old_messages[msg].timestamp);
                        // //console.log('payload_json.t', payload_json.t);
                        if (old_messages[msg].timestamp == payload_json.t) {
                          is_known = true;
                        }

                      }

                      //console.log('is_known', is_known);
              if (!is_known) {
                PushNotification.localNotification({
                    title: from,//'Incoming transaction received!',
                    //message: `You were sent ${prettyPrintAmount(transaction.totalAmount(), Config)}`,
                    message: payload_json.msg,
                    data: payload_json.t,
                    largeIconUrl: get_avatar(payload_json.from, 64),
                });
                saveMessage(payload_json.from, 'received', payload_json.msg, payload_json.t);
                console.log('from', from);
                console.log('message', payload_json.msg);
                console.log('payload_json.t', payload_json.t);

              }

              resolve(payload_json);




          // }
          // //console.log('Decrypting..');


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
//     //console.log('Cant decrypt new conversation');
//     reject();
//   }
//
//   let message_dec = naclUtil.encodeUTF8(decryptBox);
//
//   let payload_json = JSON.parse(message_dec);
//
//   resolve(payload_json);
//

});

}
