import { Redis } from 'ioredis'
import { Response, Request } from 'express'

export type MyContextArgs = {
  req: Request & { session: Express.Session }
  res: Response
}

export type MyContext = {
  req: Request & { session: Express.Session }
  res: Response
  redis: Redis
}
