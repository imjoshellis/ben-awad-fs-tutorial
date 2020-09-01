import React from 'react'
import { Flex, Button, Icon, Text } from '@chakra-ui/core'
import { Post, useVoteMutation } from '../generated/graphql'

interface UpdootPointsProps {
  points: number
  id: number
}

export const UpdootPoints: React.FC<UpdootPointsProps> = ({ points, id }) => {
  const [, vote] = useVoteMutation()
  return (
    <>
      <Flex
        direction='column'
        alignItems='center'
        justifyContent='space-between'
        mr={4}
      >
        <Button size='xs' onClick={() => vote({ postId: id, value: 1 })}>
          <Icon name='chevron-up' size={'24px'} />
        </Button>
        <Text fontSize='lg'>{points}</Text>
        <Button size='xs' onClick={() => vote({ postId: id, value: -1 })}>
          <Icon name='chevron-down' size={'24px'} />
        </Button>
      </Flex>
    </>
  )
}

export default UpdootPoints
