import { EntityManager, IDatabaseDriver, Connection } from '@mikro-orm/core'
import { Response, Request } from 'express'

export type MyContextArgs = {
  req: Request & { session: Express.Session }
  res: Response
}

export type MyContext = {
  em: EntityManager<any> & EntityManager<IDatabaseDriver<Connection>>
  req: Request & { session: Express.Session }
  res: Response
}
