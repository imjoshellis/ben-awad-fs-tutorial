import { NextPage } from 'next'
import React from 'react'
import { Box, Button } from '@chakra-ui/core'
import Wrapper from '../../components/Wrapper'
import { Formik, Form } from 'formik'
import login from '../login'
import { toErrorMap } from '../../utils/toErrorMap'
import InputField from '../../components/InputField'

interface ChangePasswordProps {
  token: string
}

export const ChangePassword: NextPage<ChangePasswordProps> = ({ token }) => {
  return (
    <Wrapper variant='small'>
      <Formik
        initialValues={{ newPassword: '' }}
        onSubmit={async (values, { setErrors }) => {
          const response = await login(values)
          if (response.data?.login.errors) {
            setErrors(toErrorMap(response.data.login.errors))
          } else if (response.data?.login.user) {
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

ChangePassword.getInitialProps = ({ query }) => ({
  token: query.token as string
})

export default ChangePassword
