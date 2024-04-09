import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  HStack,
  Text,
  View,
  VStack
 } from '@gluestack-ui/themed';

import PacketDissector from './components/PacketDissector.js'
import LoadFileModal from './components/PacketDissector/LoadFileModal'

import { api } from './API'

const SPRWireshark = () => {

  const refPacketDissector = useRef()

  const logMessage = (msg) => {
    alert(msg)
  }
  return (
    <View
      h="$full"
      bg="white"
      sx={{ _dark: { bg: '$backgroundContentDark' } }}
    >
      <PacketDissector ref={refPacketDissector} logMessage={logMessage} />
      <Text>WireShark Demo</Text>
    </View>
  );
};

export default SPRWireshark;
