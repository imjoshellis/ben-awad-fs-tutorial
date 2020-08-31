import { Box, Button } from '@chakra-ui/core'
import { Form, Formik } from 'formik'
import { useRouter } from 'next/router'
import React, { useEffect } from 'react'
import InputField from '../components/InputField'
import Wrapper from '../components/Wrapper'
import { useCreatePostMutation, useMeQuery } from '../generated/graphql'
import { withUrqlClient } from 'next-urql'
import { createUrqlClient } from '../utils/createUrqlClient'
import Layout from '../components/Layout'
import { useIsAuth } from '../utils/useIsAuth'

interface CreatePostProps {}

export const CreatePost: React.FC<CreatePostProps> = () => {
  const [, createPost] = useCreatePostMutation()
  const router = useRouter()
  useIsAuth()
  return (
    <Layout variant='small'>
      <Formik
        initialValues={{ title: '', text: '' }}
        onSubmit={async values => {
          const { error } = await createPost({ input: values })
          if (!error) {
            router.push('/')
          }
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
    </Layout>
  )
}

export default withUrqlClient(createUrqlClient)(CreatePost)
