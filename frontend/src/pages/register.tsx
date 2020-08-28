import React from 'react'
import { Formik, Form } from 'formik'
import { FormControl, FormLabel, Input } from '@chakra-ui/core'

interface RegisterProps {}

export const Register: React.FC<RegisterProps> = () => (
  <>
    <Formik
      initialValues={{ username: '', password: '' }}
      onSubmit={v => console.log(v)}
    >
      {({ values, handleChange }) => (
        <Form>
          <FormControl>
            <FormLabel htmlFor='username'>Username</FormLabel>
            <Input
              value={values.username}
              onChange={handleChange}
              id='username'
              placeholder='username'
            />
            {/* <FormErrorMessage>{form.errors.name}</FormErrorMessage> */}
          </FormControl>
        </Form>
      )}
    </Formik>
  </>
)

export default Register
