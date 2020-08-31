import { Box, Button, Link } from '@chakra-ui/core'
import { Form, Formik } from 'formik'
import { withUrqlClient } from 'next-urql'
import NextLink from 'next/link'
import { useRouter } from 'next/router'
import React, { useState } from 'react'
import InputField from '../../components/InputField'
import Wrapper from '../../components/Wrapper'
import { useChangePasswordMutation } from '../../generated/graphql'
import { createUrqlClient } from '../../utils/createUrqlClient'
import { toErrorMap } from '../../utils/toErrorMap'

export const ChangePassword = () => {
  const [, changePassword] = useChangePasswordMutation()
  const [tokenError, setTokenError] = useState('')
  const router = useRouter()
  return (
    <Wrapper variant='small'>
      <Formik
        initialValues={{ newPassword: '' }}
        onSubmit={async (values, { setErrors }) => {
          const response = await changePassword({
            ...values,
            token:
              typeof router.query.token === 'string' ? router.query.token : ''
          })
          if (response.data?.changePassword.errors) {
            const errorMap = toErrorMap(response.data.changePassword.errors)
            if ('token' in errorMap) {
              setTokenError(errorMap.token)
            }
            setErrors(errorMap)
          } else if (response.data?.changePassword.user) {
            router.push('/')
          }
        }}
      >
        {({ isSubmitting }) => (
          <Form>
            <Box>
              <InputField
                name='newPassword'
                label='new password'
                placeholder='password'
                type='password'
              />
            </Box>
            {tokenError && (
              <Box>
                <Box color={'#f00'}>{tokenError}</Box>
                <NextLink href='/forgot-password'>
                  <Link>go forget it again</Link>
                </NextLink>
              </Box>
            )}
            <Button
              type='submit'
              variantColor='teal'
              mt={4}
              isLoading={isSubmitting}
            >
              change password
            </Button>
          </Form>
        )}
      </Formik>
    </Wrapper>
  )
}

export default withUrqlClient(createUrqlClient)(ChangePassword)
