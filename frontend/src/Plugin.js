import React, { useRef } from 'react'
import { View } from '@gluestack-ui/themed'

import PacketDissector from './components/PacketDissector.js'

const SPRWireshark = () => {
  const refPacketDissector = useRef()

  const logMessage = (msg) => {
    console.log('LOG:', msg)
  }
  return (
    <View h="$full" bg="white" sx={{ _dark: { bg: '$backgroundContentDark' } }}>
      <PacketDissector ref={refPacketDissector} logMessage={logMessage} />
    </View>
  )
}

export default SPRWireshark
