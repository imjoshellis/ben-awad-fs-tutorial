import { Box, Button, Link } from '@chakra-ui/core'
import NextLink from 'next/link'
import { Form, Formik } from 'formik'
import { useRouter } from 'next/router'
import React from 'react'
import InputField from '../components/InputField'
import Wrapper from '../components/Wrapper'
import { toErrorMap } from '../utils/toErrorMap'
import { useLoginMutation } from '../generated/graphql'
import { createUrqlClient } from '../utils/createUrqlClient'
import { withUrqlClient } from 'next-urql'

interface RegisterProps {}

export const Login: React.FC<RegisterProps> = () => {
  const router = useRouter()
  const [, login] = useLoginMutation()
  return (
    <Wrapper variant='small'>
      <Formik
        initialValues={{ usernameOrEmail: '', password: '' }}
        onSubmit={async (values, { setErrors }) => {
          const response = await login(values)
          if (response.data?.login.errors) {
            setErrors(toErrorMap(response.data.login.errors))
          } else if (response.data?.login.user) {
            if (typeof router.query.next === 'string') {
              router.push(router.query.next)
            } else {
              router.push('/')
            }
          }
        }}
      >
        {({ isSubmitting }) => (
          <Form>
            <InputField
              name='usernameOrEmail'
              label='Username or Email'
              placeholder='username or email'
            />
            <Box mt={4}>
              <InputField
                name='password'
                label='password'
                placeholder='password'
                type='password'
              />
            </Box>
            <Box>
              <NextLink href='/forgot-password'>
                <Link>forgot?</Link>
              </NextLink>
            </Box>
            <Button
              type='submit'
              variantColor='teal'
              mt={4}
              isLoading={isSubmitting}
            >
              Login
            </Button>
          </Form>
        )}
      </Formik>
    </Wrapper>
  )
}

export default withUrqlClient(createUrqlClient)(Login)
