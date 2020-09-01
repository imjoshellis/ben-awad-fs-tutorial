import { gql } from 'graphql-tag'
import { PaginatedPosts, VoteMutationVariables } from './../generated/graphql'
import { stringifyVariables } from '@urql/core'
import { cacheExchange, Resolver } from '@urql/exchange-graphcache'
import Router from 'next/router'
import { dedupExchange, Exchange, fetchExchange } from 'urql'
import { pipe, tap } from 'wonka'
import {
  LoginMutation,
  LogoutMutation,
  MeDocument,
  MeQuery,
  RegisterMutation
} from '../generated/graphql'
import { betterUpdateQuery } from './betterUpdateQuery'

const errorExchange: Exchange = ({ forward }) => ops$ => {
  return pipe(
    forward(ops$),
    tap(({ error }) => {
      // If the OperationResult has an error send a request to sentry
      if (error?.message.includes('not authenticated')) {
        Router.replace('/login')
      }
    })
  )
}

export const cursorPagination = (): Resolver => {
  return (_parent, fieldArgs, cache, info) => {
    const { parentKey: entityKey, fieldName } = info

    const allFields = cache.inspectFields(entityKey)
    const fieldInfos = allFields.filter(info => info.fieldName === fieldName)
    const size = fieldInfos.length
    if (size === 0) {
      return undefined
    }

    const fieldKey = `${fieldName}(${stringifyVariables(fieldArgs)})`
    const isItInTheCache = cache.resolve(
      cache.resolveFieldByKey(entityKey, fieldKey) as string,
      'posts'
    )
    info.partial = !isItInTheCache

    const results: string[] = []
    let hasMore = true
    fieldInfos.forEach(fi => {
      const key = cache.resolveFieldByKey(entityKey, fi.fieldKey) as string
      if (!cache.resolve(key, 'hasMore')) {
        hasMore = false
      }
      const data = cache.resolve(key, 'posts') as string[]
      results.push(...data)
    })
    return { __typename: 'PaginatedPosts', hasMore, posts: results }
  }
}

export const createUrqlClient = (ssrExchange: any) => ({
  url: 'http://localhost:4000/graphql',
  fetchOptions: {
    credentials: 'include' as const
  },
  exchanges: [
    dedupExchange,
    cacheExchange({
      keys: {
        PaginatedPosts: () => null
      },
      resolvers: {
        Query: {
          posts: cursorPagination()
        }
      },
      updates: {
        Mutation: {
          vote: (_result, args, cache, info) => {
            const { postId, value } = args as VoteMutationVariables
            cache.readFragment(
              gql`
                fragment _ on Post {
                  id
                  points
                }
              `,
              { id: postId } as any
            )
          },
          createPost: (_result, args, cache, info) => {
            cache
              .inspectFields('Query')
              .filter(info => info.fieldName === 'posts')
              .forEach(fi =>
                cache.invalidate('Query', 'posts', fi.arguments || undefined)
              )
          },
          login: (_result, args, cache, info) => {
            betterUpdateQuery<LoginMutation, MeQuery>(
              cache,
              {
                query: MeDocument
              },
              _result,
              (result, query) => {
                if (result.login.errors) {
                  return query
                } else {
                  return {
                    me: result.login.user
                  }
                }
              }
            )
          },
          register: (_result, args, cache, info) => {
            betterUpdateQuery<RegisterMutation, MeQuery>(
              cache,
              {
                query: MeDocument
              },
              _result,
              (result, query) => {
                if (result.register.errors) {
                  return query
                } else {
                  return {
                    me: result.register.user
                  }
                }
              }
            )
          },
          logout: (_result, args, cache, info) => {
            betterUpdateQuery<LogoutMutation, MeQuery>(
              cache,
              {
                query: MeDocument
              },
              _result,
              () => ({
                me: null
              })
            )
          }
        }
      }
    }),
    errorExchange,
    ssrExchange,
    fetchExchange
  ]
})
