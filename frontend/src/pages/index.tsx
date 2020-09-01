import { Box, Button, Flex, Heading, Stack, Text, Icon } from '@chakra-ui/core'
import moment from 'moment'
import { withUrqlClient } from 'next-urql'
import NextLink from 'next/link'
import Layout from '../components/Layout'
import { usePostsQuery, useVoteMutation } from '../generated/graphql'
import { createUrqlClient } from '../utils/createUrqlClient'
import { useState } from 'react'
import UpdootPoints from '../components/UpdootPoints'

const Index = () => {
  const [variables, setVariables] = useState({
    limit: 10,
    cursor: null as string | null
  })
  const [{ data, fetching }] = usePostsQuery({ variables })
  const [, vote] = useVoteMutation()
  return (
    <Layout>
      <Flex justifyContent='space-between'>
        <Heading>LiReddit</Heading>
        <NextLink href='/create-post'>
          <Button px={4} bg='#9af' color='#fff' _hover={{ bg: '#acf' }}>
            create post
          </Button>
        </NextLink>
      </Flex>
      {!data && !fetching ? <>Server Error. Try again.</> : null}
      {data?.posts?.posts ? (
        <Stack spacing={8} mt={4}>
          {data.posts.posts.map(p => (
            <Box key={p.id} shadow='md' borderWidth='1px' p={4}>
              <Flex>
                <UpdootPoints {...p} />
                <Flex direction='column'>
                  <Heading fontSize='xl'>{p.title}</Heading>
                  <Text>
                    Posted {moment(parseInt(p.createdAt)).fromNow()} by{' '}
                    {p.creator.username}
                  </Text>
                  <Text mt={4}>{p.textSnippet}... (read more)</Text>
                </Flex>
              </Flex>
            </Box>
          ))}
        </Stack>
      ) : null}
      {fetching ? <>Loading...</> : null}
      {data && data?.posts.hasMore ? (
        <Button
          onClick={() =>
            setVariables({
              limit: variables.limit,
              cursor: data.posts.posts[data.posts.posts.length - 1].createdAt
            })
          }
          my={8}
          w='100%'
          isLoading={fetching}
        >
          load more
        </Button>
      ) : null}
    </Layout>
  )
}

export default withUrqlClient(createUrqlClient, { ssr: true })(Index)
