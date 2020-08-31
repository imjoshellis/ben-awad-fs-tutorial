import React from 'react'
import Wrapper from '../components/Wrapper'
import { Formik, Form } from 'formik'
import login from './login'
import { toErrorMap } from '../utils/toErrorMap'
import InputField from '../components/InputField'
import { Box, Link, Button } from '@chakra-ui/core'

interface CreatePostProps {}

export const CreatePost: React.FC<CreatePostProps> = () => {
  return (
    <Wrapper variant='small'>
      <Formik
        initialValues={{ title: '', text: '' }}
        onSubmit={async values => {
          console.log(values)
        }}
      >
        {({ isSubmitting }) => (
          <Form>
            <InputField name='title' label='Title' placeholder='title' />
            <Box mt={4}>
              <InputField
                textarea
                name='text'
                label='Text'
                placeholder='text'
              />
            </Box>
            <Button
              type='submit'
              variantColor='teal'
              mt={4}
              isLoading={isSubmitting}
            >
              Create Post
            </Button>
          </Form>
        )}
      </Formik>
    </Wrapper>
  )
}

export default CreatePost
