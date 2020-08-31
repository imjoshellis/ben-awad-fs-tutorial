import { Box, Button, Link } from '@chakra-ui/core'
import { Form, Formik } from 'formik'
import { withUrqlClient } from 'next-urql'
import NextLink from 'next/link'
import { useRouter } from 'next/router'
import React, { useState } from 'react'
import InputField from '../components/InputField'
import Wrapper from '../components/Wrapper'
import { useForgotPasswordMutation } from '../generated/graphql'
import { createUrqlClient } from '../utils/createUrqlClient'

interface ForgotPasswordProps {}

export const ForgotPassword: React.FC<ForgotPasswordProps> = () => {
  const router = useRouter()
  const [complete, setComplete] = useState(false)
  const [, forgotPassword] = useForgotPasswordMutation()
  return (
    <Wrapper variant='small'>
      {complete ? (
        <Box>
          <Box color={'#0f0'}>reset email sent!</Box>
          <NextLink href='/'>
            <Link>return to home</Link>
          </NextLink>
        </Box>
      ) : (
        <Formik
          initialValues={{ email: '' }}
          onSubmit={async values => {
            await forgotPassword(values)
            setComplete(true)
          }}
        >
          {({ isSubmitting }) => (
            <Form>
              <InputField
                name='email'
                label='email'
                placeholder='email'
                type='email'
              />
              <Button
                type='submit'
                variantColor='teal'
                mt={4}
                isLoading={isSubmitting}
              >
                reset password
              </Button>
            </Form>
          )}
        </Formik>
      )}
    </Wrapper>
  )
}

export default withUrqlClient(createUrqlClient)(ForgotPassword)
