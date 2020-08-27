import { MikroORM } from '@mikro-orm/core'
import { Post } from './entities/Post'
import { __prod__ } from './constants'
import path from 'path'

export const microConfig = {
  migrations: {
    path: path.join(__dirname, './migrations'),
    pattern: /^[\w-]+\d+\.[jt]s$/
  },
  entities: [Post],
  dbName: 'bafstut',
  type: 'postgresql',
  debug: !__prod__
} as Parameters<typeof MikroORM.init>[0]

export default microConfig
