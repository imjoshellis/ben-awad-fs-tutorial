import { ApolloServer } from 'apollo-server-express'
import connectRedis from 'connect-redis'
import cors from 'cors'
import express from 'express'
import session from 'express-session'
import Redis from 'ioredis'
import 'reflect-metadata'
import { buildSchema } from 'type-graphql'
import { createConnection } from 'typeorm'
import { COOKIE_NAME, __prod__ } from './constants'
import { Post } from './entities/Post'
import { User } from './entities/User'
import { PostResolver } from './resolvers/post'
import { UserResolver } from './resolvers/user'
import { MyContext, MyContextArgs } from './types'
import path from 'path'
import { Updoot } from './entities/Updoot'

const main = async () => {
  const conn = await createConnection({
    type: 'postgres',
    database: 'lireddit',
    username: 'dev',
    password: 'dev',
    logging: true,
    synchronize: true,
    migrations: [path.join(__dirname, './migrations/*')],
    entities: [Post, User, Updoot]
  })
  await conn.runMigrations()

  const app = express()

  const RedisStore = connectRedis(session)
  const redis = new Redis()

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
        client: redis,
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
      req,
      res,
      redis
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
