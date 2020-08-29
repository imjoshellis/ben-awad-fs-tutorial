import React from 'react'
import { Box, Flex, Link, Button } from '@chakra-ui/core'
import NextLink from 'next/link'
import { useMeQuery, useLogoutMutation } from '../generated/graphql'

interface NavBarProps {}

export const NavBar: React.FC<NavBarProps> = () => {
  const [{ fetching: fetchingLogout }, logout] = useLogoutMutation()
  const [{ data, fetching }] = useMeQuery()
  let body = null
  if (fetching) {
  } else if (!data?.me) {
    body = (
      <>
        <NextLink href='/login'>
          <Link p={4}>login</Link>
        </NextLink>
        <NextLink href='/login'>
          <Link p={4}>register</Link>
        </NextLink>
      </>
    )
  } else {
    body = (
      <>
        <NextLink href='/account'>
          <Link>{data.me.username}</Link>
        </NextLink>
        <Button isLoading={fetchingLogout} onClick={() => logout()} p={4}>
          logout
        </Button>
      </>
    )
  }
  return (
    <Flex bg='tan' justify='space-between'>
      <Box></Box>
      <Box p={4}>{body}</Box>
    </Flex>
  )
}

export default NavBar
