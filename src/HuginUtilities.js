// Copyright (C) 2018, Zpalmtree
//
// Please see the included LICENSE file for more information.

import React from 'react';
import PushNotification from 'react-native-push-notification';
import moment from 'moment';

import { Text, Platform, ToastAndroid, Alert, Linking } from 'react-native';

import { StackActions, NavigationActions } from 'react-navigation';

import * as Qs from 'query-string';

import Config from './Config';

import { Globals } from './Globals';

import { addFee, toAtomic } from './Fee';

import { expand_sdp_answer } from './SDPParser';

import nacl from 'tweetnacl';
import naclUtil from 'tweetnacl-util';

import * as NaclSealed from 'tweetnacl-sealed-box';

import Identicon from 'identicon.js';

import { getGroupName, saveGroupMessage, groupMessageExists, getGroupKey, getLatestBoardMessage, getHistory, getLatestMessages, saveToDatabase, loadPayeeDataFromDatabase, saveMessage, saveBoardsMessage, savePayeeToDatabase, messageExists, boardsMessageExists } from './Database';

/**
 * Save wallet in background
 */
async function backgroundSave() {
    Globals.logger.addLogMessage('Saving wallet...');

    try {
        await saveToDatabase(Globals.wallet);
        Globals.logger.addLogMessage('Save complete.');
    } catch (err) {
        Globals.logger.addLogMessage('Failed to background save: ' + err);
    }
}
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


function tryNode(this_node) {
    return new Promise((resolve) => {


  });
}

export async function getBestNode(ssl=true) {

  let recommended_node = undefined;

  await Globals.updateNodeList();

  let node_requests = [];
  let ssl_nodes =[];
  if (ssl) {
      ssl_nodes = Globals.daemons.filter(node => {return node.ssl});
  } else {
      ssl_nodes = Globals.daemons.filter(node => {return !node.ssl});
  }

  ssl_nodes = ssl_nodes.sort((a, b) => 0.5 - Math.random());

  for (node in ssl_nodes) {
    let this_node = ssl_nodes[node];

    let nodeURL = `${this_node.ssl ? 'https://' : 'http://'}${this_node.url}:${this_node.port}/info`;
    try {
      const resp = await fetch(nodeURL, {
         method: 'GET'
      }, 1000);

     if (resp.ok) {
       recommended_node = this_node;
       return(this_node);
     }
  } catch (e) {
    console.log(e);
  }
}

if (recommended_node == undefined) {
  const recommended_non_ssl_node = await getBestNode(false);
  return recommended_non_ssl_node;
}

}


export async function getBestCache() {

  let recommended_cache = undefined;

  await Globals.updateCacheList();

  let cache_requests = [];

  let caches = Globals.caches.sort((a, b) => 0.5 - Math.random());

  for (cache in caches) {
    let this_cache = caches[cache];
    let cacheURL = `${this_cache.url}/api/v1/posts`;
    try {
      const resp = await fetch(cacheURL, {
         method: 'GET'
      }, 1000);
     if (resp.ok) {
       recommended_cache = this_cache;
       return(this_cache);
     }
  } catch (e) {
    console.log(e);
  }
}

}

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

      if (notification.transaction != undefined) {
        return;
      }
  
      let payee = notification.userInfo;
  
      if (payee.address) {
  
        payee = new URLSearchParams(payee).toString();
  
        let url = 'xkr://'.replace('address=', '') + payee;
  
        Linking.openURL(url);
  
      } else if (payee.key) {
  
        let url = `xkr://?group=${payee.key}`;
  
        Linking.openURL(url);
  
      } else {
  
        let url = 'xkr://?board=' + payee;
  
        Linking.openURL(url);
  
  
      }
  
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

function componentToHex(c) {
  var hex = c.toString(16);
  return hex.length == 1 ? "0" + hex : hex;
}

function rgbToHex(r, g, b) {
  return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
}

export function getBoardColors(board) {
  let board_color = intToRGB(hashCode(board));

  board_color = `rgb(${board_color.red},${board_color.green},${board_color.blue})`;

  let comp_color = `rgb(${board_color.red + 50},${board_color.green + 50},${board_color.blue + 50})`
  return [board_color, comp_color];
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
export function getKeyPairOld() {
    // return new Promise((resolve) => setTimeout(resolve, ms));
    const [privateSpendKey, privateViewKey] = Globals.wallet.getPrimaryAddressPrivateKeys();
    let secretKey = naclUtil.decodeUTF8(privateSpendKey.substring(1, 33));
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
  }
  return hex
}

export async function optimizeMessages(nbrOfTxs, fee=10000, attempt=0) {

  if (attempt > 10) {
    return false;
  }

  const [walletHeight, localHeight, networkHeight] = Globals.wallet.getSyncStatus();

  let inputs = await Globals.wallet.subWallets.getSpendableTransactionInputs(Globals.wallet.subWallets.getAddresses(), networkHeight);

  if (inputs.length > 8) {
    return inputs.length;
  }

  let subWallets = Globals.wallet.subWallets.subWallets;

  subWallets.forEach((value, name) => {
    let txs = value.unconfirmedIncomingAmounts.length;

    if (txs > 0) {
      return txs;
    }
  })

  let payments = [];
  let i = 0;

  /* User payment */
  while (i < nbrOfTxs - 1 && i < 10) {
    payments.push([
        Globals.wallet.subWallets.getAddresses()[0],
        2000
    ]);

    i += 1;

  }

  let result = await Globals.wallet.sendTransactionAdvanced(
      payments, // destinations,
      3, // mixin
      {fixedFee: 1000, isFixedFee: true}, // fee
      undefined, //paymentID
      undefined, // subWalletsToTakeFrom
      undefined, // changeAddress
      true, // relayToNetwork
      false, // sneedAll
      undefined
  );

  if (result.success) {
    return true;

  } else {
    optimizeMessages(nbrOfTxs, fee + 500, attempt + 1)
  }

  return result;


}

export async function sendMessageWithHuginAPI(payload_hex) {

  let cacheURL = Globals.preferences.cache ? Globals.preferences.cache : Config.defaultCache;

  const response = await fetch(`${cacheURL}/api/v1/posts`, {
    method: 'POST', // or 'PUT'
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({payload: payload_hex}),
  });
  return response.json();

}

export async function cacheSync(silent=true, latest_board_message_timestamp=0, first=true, page=1) {

    if(first) {
      latest_board_message_timestamp = await getLatestBoardMessage();
    }

    let cacheURL = Globals.preferences.cache ? Globals.preferences.cache : Config.defaultCache;

    fetch(`${cacheURL}/api/v1/posts?from=${latest_board_message_timestamp}&to=${Date.now() / 1000}&size=50&page=` + page)
    .then((response) => response.json())
    .then(async (json) => {

      const items = json.posts;


      for (item in items) {

        if (items[item].time < latest_board_message_timestamp) {
          return;
        }

        const fromMyself = items[item].key == Globals.wallet.getPrimaryAddress() ? true : false;

        const message = items[item].message;
        const address = items[item].key;
        const signature = items[item].signature;
        const board = items[item].board;
        const timestamp = items[item].time;
        const nickname = items[item].nickname;
        const reply = items[item].reply_tx_hash;
        const hash = items[item].tx_hash;
        const sent = fromMyself ? true : false;

        if (await boardsMessageExists(hash)) {
          continue;
          return;
        }

        if (fromMyself) {
          silent = true;
        } else {
          silent = false;
        }

        saveBoardsMessage(message, address, signature, board, timestamp, nickname, reply, hash, sent, silent);

        if (!nickname) {
          nickname = 'Anonymous';
        }




        const subscriptionList = Globals.boardsSubscriptions.filter(sub => {
          return sub.board == board;
        })

        if (latest_board_message_timestamp != 0 && !fromMyself && subscriptionList.length > 0 )  {
          PushNotification.localNotification({
              title: nickname + ' in ' + board,//'Incoming transaction received!',
              //message: `You were sent ${prettyPrintAmount(transaction.totalAmount(), Config)}`,
              message: message,
              data: timestamp,
              userInfo: board,
              // largeIconUrl: get_avatar(payload_json.from, 64),
          });
        }

      }
      if (json.current_page != json.total_pages) {
            cacheSync(silent, latest_board_message_timestamp, false, page+1);
      }
    })

}


export async function createGroup() {
  return await Buffer.from(nacl.randomBytes(32)).toString('hex');
}


export async function sendGroupsMessage(message, group) {

  const my_address = Globals.wallet.getPrimaryAddress();

  const [privateSpendKey, privateViewKey] = Globals.wallet.getPrimaryAddressPrivateKeys();

  const signature = await xkrUtils.signMessage(message, privateSpendKey);

  const timestamp = parseInt(Date.now());

  const nonce = nonceFromTimestamp(timestamp);

  let message_json = {
    "m": message,
    "k": my_address,
    "s": signature,
    "g": group,
    "n": Globals.preferences.nickname
  }

  const payload_unencrypted = naclUtil.decodeUTF8(JSON.stringify(message_json));

  const secretbox = nacl.secretbox(payload_unencrypted, nonce, hexToUint(group));

  const payload_encrypted = {"sb":Buffer.from(secretbox).toString('hex'), "t":timestamp};

  const payload_encrypted_hex = toHex(JSON.stringify(payload_encrypted));

  let result = await Globals.wallet.sendTransactionAdvanced(
      [[my_address, 1]], // destinations,
      3, // mixin
      {fixedFee: 1000, isFixedFee: true}, // fee
      undefined, //paymentID
      undefined, // subWalletsToTakeFrom
      undefined, // changeAddress
      true, // relayToNetwork
      false, // sneedAll
      Buffer.from(payload_encrypted_hex, 'hex')
  );


  if (!result.success) {
    try {
      result = await sendMessageWithHuginAPI(payload_encrypted_hex);
    } catch (err) {
      console.log('Failed to send with Hugin API..')
    }
  }

  if (result.success == true) {
    saveGroupMessage(group, 'sent', message_json.m, timestamp, message_json.n, message_json.k);
    backgroundSave();
  }

  return result;

}

export async function sendBoardsMessage(message, board, reply=false) {

  const my_address = Globals.wallet.getPrimaryAddress();

  const [privateSpendKey, privateViewKey] = Globals.wallet.getPrimaryAddressPrivateKeys();

  const signature = await xkrUtils.signMessage(message, privateSpendKey);

  let message_json = {
    "m":message,
    "k": my_address,
    "s": signature,
    "brd": board,
    "t": parseInt(Date.now() / 1000)
  }

  if (reply) {
    message_json.r = reply;
  }

  if (Globals.preferences.nickname != 'Anonymous') {
    message_json.n = Globals.preferences.nickname;
  }

  const payload_hex = toHex(JSON.stringify(message_json));

  const result = await Globals.wallet.sendTransactionAdvanced(
      [[my_address, 1]], // destinations,
      3, // mixin
      {fixedFee: 1000, isFixedFee: true}, // fee
      undefined, //paymentID
      undefined, // subWalletsToTakeFrom
      undefined, // changeAddress
      true, // relayToNetwork
      false, // sneedAll
      Buffer.from(payload_hex, 'hex')
  );

  backgroundSave();

  if (!result.success) {
    const result_api = await sendMessageWithHuginAPI(payload_hex);
    return result_api;
  }
  optimizeWallet();
  return result;

}

async function optimizeWallet() {
  const [walletHeight, localHeight, networkHeight] = Globals.wallet.getSyncStatus();
      let inputs = await Globals.wallet.subWallets.getSpendableTransactionInputs(Globals.wallet.subWallets.getAddresses(), networkHeight);
      let message_inputs = 0;
      for (input in inputs) {
        try {
          let this_amount = inputs[input].input.amount;
          if (this_amount == 10000) {
            message_inputs++;
          }
        } catch (err) {
          continue;
        }
      }
      if (message_inputs < 2) {
        optimizeMessages(10);
      }
}

export async function sendMessage(message, receiver, messageKey, silent=false) {

  if (message.length == 0) {
    return;
  }

  let has_history = await getHistory(receiver);

    let my_address = Globals.wallet.getPrimaryAddress();

    let my_addresses = Globals.wallet.getAddresses();

    try {

      let [munlockedBalance, mlockedBalance] = await Globals.wallet.getBalance();

      if (munlockedBalance < 11 && mlockedBalance > 0) {

        toastPopUp('Please wait for more funds to unlock!');
        return {success: false};

      }
    } catch (err) {
      toastPopUp('Error!');
      return;
    }

    let timestamp = Date.now();

    let box;

    if (!has_history) {
      // If you haven't yet sent a message to this specific contact, send the
      // first one with a sealed box so it can be decrypted by the recipient
      // at now, or at a later stage.
      const addr = await Address.fromAddress(my_address);
      const [privateSpendKey, privateViewKey] = Globals.wallet.getPrimaryAddressPrivateKeys();
      let xkr_private_key = privateSpendKey;
      let signature = await xkrUtils.signMessage(message, xkr_private_key);
      let payload_json = {"from":my_address, "k": Buffer.from(getKeyPair().publicKey).toString('hex'), "msg":message, "s": signature};
      let payload_json_decoded = naclUtil.decodeUTF8(JSON.stringify(payload_json));
      box = new NaclSealed.sealedbox(payload_json_decoded, nonceFromTimestamp(timestamp), hexToUint(messageKey));
    } else {
      // If you have history with this contact, it should be sent with a regular
      // box.
      let payload_json = {"from":my_address, "msg":message};

      let payload_json_decoded = naclUtil.decodeUTF8(JSON.stringify(payload_json));



      box = nacl.box(payload_json_decoded, nonceFromTimestamp(timestamp), hexToUint(messageKey), getKeyPair().secretKey);

    }

    let payload_box = {"box":Buffer.from(box).toString('hex'), "t":timestamp};

    // Convert json to hex
    let payload_hex = toHex(JSON.stringify(payload_box));

    let result = await Globals.wallet.sendTransactionAdvanced(
        [[receiver, 1]], // destinations,
        3, // mixin
        {fixedFee: 1000, isFixedFee: true}, // fee
        undefined, //paymentID
        undefined, // subWalletsToTakeFrom
        undefined, // changeAddress
        true, // relayToNetwork
        false, // sneedAll
        Buffer.from(payload_hex, 'hex')
    );

    if (!result.success) {
      try {
        result = await sendMessageWithHuginAPI(payload_encrypted_hex);
      } catch (err) {
        console.log('Failed to send with Hugin API..')
      }
    }

    if (result.success) {
      if (message.substring(0,1) == 'Δ' || message.substring(0,1) == 'Λ') {
        message = t('Call started');
      }
      if (message.substring(0,1) == 'δ' || message.substring(0,1) == 'λ') {
        message = 'Call answered';
      }
      saveMessage(receiver, 'sent', message, timestamp);
      backgroundSave();

      optimizeWallet();
      
    } 

    return result;

    Globals.logger.addLogMessage(JSON.stringify(result));

}

export function fromHex(hex,str){
  try{
    str = decodeURIComponent(hex.replace(/(..)/g,'%$1'))
  }
  catch(e){
    str = hex
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

async function getBoardsMessage(json) {


  let message = json.m;
  let from = json.k;
  let signature = json.s;
  let board = json.brd;
  let timestamp = json.t;
  let nickname = json.n ? json.n : 'Anonymous';
  let reply = json.r ? json.r : 0;
  let hash = json.hash;
  let sent = false;

  if (nickname == 'null') {
    nickname = 'Anonymous';
  }

  let silent = from == Globals.wallet.getPrimaryAddress() ? true : false;

  const this_addr = await Address.fromAddress(from);

  const verified = await xkrUtils.verifyMessageSignature(message, this_addr.spend.publicKey, signature);

  if (!verified) {
    return false;
  }

  saveBoardsMessage(message, from, signature, board, timestamp, nickname, reply, hash, sent, silent);


    const subscriptionList = Globals.boardsSubscriptions.filter(sub => {
      return sub.board == board;
    })


  if (from != Globals.wallet.getPrimaryAddress() && subscriptionList.length > 0) {
  PushNotification.localNotification({
      title: nickname + ' in ' + board,//'Incoming transaction received!',
      //message: `You were sent ${prettyPrintAmount(transaction.totalAmount(), Config)}`,
      message: message,
      data: timestamp,
      userInfo: board,
      // largeIconUrl: get_avatar(payload_json.from, 64),
  });
}
}

async function getGroupMessage(tx) {

  let decryptBox = false;

  const groups = Globals.groups;

  let key;

  let i = 0;

  while (!decryptBox && i < groups.length) {

    let possibleKey = groups[i].key;


    i += 1;

    Globals.logger.addLogMessage('Trying key: ' + possibleKey);

    try {

     decryptBox = nacl.secretbox.open(
       hexToUint(tx.sb),
       nonceFromTimestamp(tx.t),
       hexToUint(possibleKey)
     );

     key = possibleKey;
    } catch (err) {
      console.log(err);
     continue;
    }



  }

  if (!decryptBox) {
    console.log('Cannot decrypt group message!');
    return false;
  }


  const message_dec = naclUtil.encodeUTF8(decryptBox);

  const payload_json = JSON.parse(message_dec);

  const from = payload_json.k;
  const from_myself = (from == Globals.wallet.getPrimaryAddress() ? true : false);
  const received = (from_myself ? 'sent' : 'received');

  const this_addr = await Address.fromAddress(from);

  const verified = await xkrUtils.verifyMessageSignature(payload_json.m, this_addr.spend.publicKey, payload_json.s);

  saveGroupMessage(key, received, payload_json.m, tx.t, payload_json.n, payload_json.k);

  const nickname = payload_json.n ? payload_json.n : t('Anonymous');

  const group_object = Globals.groups.filter(group => {
    return group.key == key;
  })

  const groupname = await getGroupName(key);

    if (Globals.activeChat != key && !from_myself) {
      PushNotification.localNotification({
          title: `${nickname} in ${groupname}`,//'Incoming transaction received!',
          //message: `You were sent ${prettyPrintAmount(transaction.totalAmount(), Config)}`,
          message: payload_json.m,
          data: tx.t,
          userInfo: group_object[0],
          largeIconUrl: get_avatar(from, 64),
      });
    }

  return payload_json;


}

export async function getMessage(extra, hash, navigation, fromBackground=true){


  Globals.logger.addLogMessage('Getting payees..');

  return new Promise(async (resolve, reject) => {

    let data = trimExtra(extra);
    Globals.logger.addLogMessage('Message detected: ' + data);

    let tx = JSON.parse(data);
        if (tx.m || tx.b || tx.brd) {
          reject();
          tx.hash = hash;
          if (await boardsMessageExists(hash)) {
            reject();
          }
          getBoardsMessage(tx);
        }

        if (tx.sb) {

          if (await groupMessageExists(tx.t)) {
            reject();
          }
          let groupMessage = await getGroupMessage(tx);
          resolve(groupMessage);
        }

        // If no key is appended to message we need to try the keys in our payload_keychain
        let box = tx.box;

        let timestamp = tx.t;

        if (await messageExists(timestamp)) {
          reject();
          return;
        }

        let decryptBox = false;
        let createNewPayee = false;

        let key = '';

        try {
           decryptBox = NaclSealed.sealedbox.open(hexToUint(box),
           nonceFromTimestamp(timestamp),
           getKeyPair().secretKey);
           createNewPayee = true;
         } catch (err) {
          Globals.logger.addLogMessage('Error: ' + err);
         }
         if(!decryptBox) {
          try {
            decryptBox = NaclSealed.sealedbox.open(hexToUint(box),
            nonceFromTimestamp(timestamp),
            getKeyPairOld().secretKey);
            let message_dec_temp = naclUtil.encodeUTF8(decryptBox);
            let payload_json_temp = JSON.parse(message_dec_temp);
            let from_temp = payload_json_temp.from;
            let payee = Globals.payees.filter(item => item.address == from_temp)[0];
            Globals.removePayee(payee.nickname, false);
            createNewPayee = true;
          } catch (err) {
            console.log(err);
          }
        }

        let i = 0;

        let payees = await loadPayeeDataFromDatabase();

        while (!decryptBox && i < payees.length) {

          let possibleKey = payees[i].paymentID;

          i += 1;

          Globals.logger.addLogMessage('Trying key: ' + possibleKey);

          try {
           decryptBox = nacl.box.open(hexToUint(box),
           nonceFromTimestamp(timestamp),
           hexToUint(possibleKey),
           getKeyPair().secretKey);
           key = possibleKey;
          } catch (err) {
           continue;
          }

        }
        
        if (!decryptBox) {
          console.log('No encrypted message found.. Sad!')
          reject();
        }


        let message_dec = naclUtil.encodeUTF8(decryptBox);

        let payload_json = JSON.parse(message_dec);

        payload_json.t = timestamp;
         let from = payload_json.from;
        let from_myself = false;
         if (from == Globals.wallet.getPrimaryAddress()) {
           from_myself = true;
         }

        let from_address = from;

        let from_payee = {};

        if (!from_myself) {

        for (payee in payees) {

          if (payees[payee].address == from) {
            from = payees[payee].nickname;
            createNewPayee = false;

            from_payee = {
                name: from,
                address: from_address,
                paymentID: payees[payee].paymentID,
            };

          }


        }
        } else {

        from_payee = payees.filter(payee => {
          return payee.paymentID == key;
        })

        }

        if (createNewPayee && !from_myself) {
          const payee = {
              nickname: payload_json.from.substring(0,12) + "..",
              address: payload_json.from,
              paymentID: payload_json.k,
          };

          Globals.addPayee(payee);

          from_payee = payee;

        }

          let received = 'received';

          if (from_myself) {
            payload_json.from = from_payee[0].address;
            received = 'sent';
          }

          if (payload_json.msg.substring(0,1) == 'Δ' ||  payload_json.msg.substring(0,1) == 'Λ' ){
            console.log('Call received!');

            if (navigation) {
            navigation.navigate(
              'CallScreen', {
                  payee: {nickname: from_payee.name, address: from_payee.address, paymentID: from_payee.paymentID},
                  sdp: payload_json.msg,
              }) } else {
                // use URL to 
              }

            PushNotification.localNotification({
              title: from,//'Incoming transaction received!',
              //message: `You were sent ${prettyPrintAmount(transaction.totalAmount(), Config)}`,
              message: 'Call received',
              data: payload_json.t,
              userInfo: {nickname: from_payee.name, address: from_payee.address, paymentID: from_payee.paymentID},
              largeIconUrl: get_avatar(payload_json.from, 64),
          });
          payload_json.msg = 'Call received';
          saveMessage(payload_json.from, received, 'Call received', payload_json.t);

          resolve(payload_json);

          } 
          if (payload_json.msg.substring(0,1) == 'δ' || payload_json.msg.substring(0,1) == 'λ') {
            Globals.sdp_answer = payload_json.msg;
            const expanded_answer = expand_sdp_answer(payload_json.msg);
            Globals.calls.find(call => call.contact == from_payee.paymentID).peer.setRemoteDescription(expanded_answer);
            saveMessage(payload_json.from, received, 'Call answered', payload_json.t);
            payload_json.msg = 'Call answered';
            resolve(payload_json);
          }

          saveMessage(payload_json.from, received, payload_json.msg, payload_json.t);

          

          if ((Globals.activeChat != payload_json.from && !from_myself) || (!from_myself && fromBackground)) {
            PushNotification.localNotification({
                title: from,//'Incoming transaction received!',
                //message: `You were sent ${prettyPrintAmount(transaction.totalAmount(), Config)}`,
                message: payload_json.msg,
                data: payload_json.t,
                userInfo: from_payee,
                largeIconUrl: get_avatar(payload_json.from, 64),
            });
          }

        resolve(payload_json);





});

}
