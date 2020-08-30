import { MikroORM } from '@mikro-orm/core'
import { ApolloServer } from 'apollo-server-express'
import connectRedis from 'connect-redis'
import cors from 'cors'
import express from 'express'
import session from 'express-session'
import redis from 'redis'
import 'reflect-metadata'
import { buildSchema } from 'type-graphql'
import { __prod__, COOKIE_NAME } from './constants'
import microConfig from './mikro-orm.config'
import { PostResolver } from './resolvers/post'
import { UserResolver } from './resolvers/user'
import { MyContext, MyContextArgs } from './types'
import { sendEmail } from './utils/sendEmail'

const main = async () => {
  sendEmail('email@ienawrtienawt.com', 'hello there')
  const orm = await MikroORM.init(microConfig)
  await orm.getMigrator().up()

  const app = express()

  const RedisStore = connectRedis(session)
  const redisClient = redis.createClient()

  app.use(
    cors({
      origin: 'http://localhost:3000',
      credentials: true
    })
  )

  app.use(
    session({
      name: COOKIE_NAME,
      store: new RedisStore({
        client: redisClient,
        disableTouch: true
      }),
      cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 365 * 10, // 10 years
        httpOnly: true, // no client-side
        sameSite: 'lax', // csrf
        secure: __prod__ // https only
      },
      saveUninitialized: false,
      secret: 'arsitenariesntwufnt',
      resave: false
    })
  )

  const apolloServer = new ApolloServer({
    schema: await buildSchema({
      resolvers: [PostResolver, UserResolver],
      validate: false
    }),
    context: ({ req, res }: MyContextArgs): MyContext => ({
      em: orm.em,
      req,
      res
    })
  })

  apolloServer.applyMiddleware({
    app,
    cors: false
  })

  app.listen(4000, () => {
    console.log('server started on localhost:4000')
  })
}

main().catch(err => console.error(err))
