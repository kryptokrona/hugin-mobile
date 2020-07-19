import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Text, View, StyleSheet } from 'react-native';

const nodeURL = "https://hugin.kryptokrona.se/json_api";


export default function App() {
  const [isLoading, setLoading] = useState(true);
  const [data, setData] = useState([]);


  function fromHex(hex,str){
    try{
      str = decodeURIComponent(hex.replace(/(..)/g,'%$1'))
      str = JSON.parse(str)
      setData(str)
      setLoading(false)
    }
    catch(e){
      return
      //str = hex
      //console.log('invalid hex input: ' + hex)
    }
    return str
  }

  const getTransactions = (transactions) => {
    // console.log(transactions);
    for (let tx in transactions) {
      // console.log(transactions[tx].hash);
      fetch(nodeURL, {
        method: 'POST',
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'f_transaction_json',
          params: {hash: transactions[tx].hash}
        })
      })
      .then((response) => response.json())
      .then((json) => fromHex(json.result.tx.extra.substring(66)))
      .catch((error) => console.error(error))
    }
  }

  const getBlock = (blockHash) => {
    fetch(nodeURL, {
      method: 'POST',
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'f_block_json',
        params: {hash: blockHash}
      })
    })
      .then((response) => response.json())
      .then((json) => getTransactions(json.result.block.transactions))
      .catch((error) => console.error(error))
  }

  const getBlockHashes = (blockCount) => {
    let i;
      for (i = 0; i < 100; i++) {
      fetch(nodeURL, {
        method: 'POST',
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'on_getblockhash',
          params: [blockCount - i]
        })
      })
        .then((response) => response.json())
        .then((json) => getBlock(json.result))
        .catch((error) => console.error(error))
    }
  }

  useEffect(() => {
    fetch(nodeURL, {
      method: 'POST',
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'getblockcount',
        params: {}
      })
    })
      .then((response) => response.json())
      .then((json) => getBlockHashes(json.result.count))
      .catch((error) => console.error(error))
      //.finally(() => setLoading(false));
  }, []);

  return (
    <View style={{ flex: 1, padding: 24 }}>
      {isLoading ? <ActivityIndicator/> : (
        <Text>{JSON.stringify(data)}</Text>
      )}
    </View>
  );

}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
