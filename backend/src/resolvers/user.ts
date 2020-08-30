import { validateRegister } from './../utils/validateRegister'
import { COOKIE_NAME } from './../constants'
import { EntityManager } from '@mikro-orm/postgresql'
import { MyContext } from './../types'
import argon2 from 'argon2'
import {
  Field,
  Resolver,
  Ctx,
  Mutation,
  Arg,
  ObjectType,
  Query
} from 'type-graphql'
import { User } from '../entities/User'
import { UsernamePasswordInput } from './UsernamePasswordInput'

@ObjectType()
class FieldError {
  @Field()
  field: string
  @Field()
  message: string
}

@ObjectType()
class UserResponse {
  @Field(() => [FieldError], { nullable: true })
  errors?: FieldError[]

  @Field(() => User, { nullable: true })
  user?: User
}

@Resolver()
export class UserResolver {
  // @Mutation(() => Boolean)
  // async forgotPassword (@Arg('email') email: string, @Ctx() { em }: MyContext) {
  // const user = await em.findOne(User, { email })
  // return false
  // }

  @Query(() => User, { nullable: true })
  async me (@Ctx() { em, req }: MyContext) {
    if (!req.session.userId) {
      return null
    }
    const user = await em.findOne(User, { id: req.session.userId })
    return user
  }

  @Mutation(() => UserResponse)
  async register (
    @Arg('options') options: UsernamePasswordInput,
    @Ctx() { em, req }: MyContext
  ): Promise<UserResponse> {
    const errors = validateRegister(options)
    if (errors) {
      return { errors }
    }
    const hashedPassword = await argon2.hash(options.password)
    let user
    try {
      const result = await (em as EntityManager)
        .createQueryBuilder(User)
        .getKnexQuery()
        .insert({
          username: options.username,
          email: options.email,
          password: hashedPassword,
          created_at: new Date(),
          updated_at: new Date()
        })
        .returning('*')
      user = result[0]
    } catch (err) {
      if (err.code === '23505') {
        return {
          errors: [{ field: 'username', message: 'username already exists' }]
        }
      }
      console.error(err.message)
    }

    req.session.userId = user.id

    return { user }
  }

  @Mutation(() => UserResponse)
  async login (
    @Arg('usernameOrEmail') usernameOrEmail: string,
    @Arg('password') password: string,
    @Ctx() { em, req }: MyContext
  ): Promise<UserResponse> {
    const user = await em.findOne(
      User,
      usernameOrEmail.includes('@')
        ? { email: usernameOrEmail }
        : { username: usernameOrEmail }
    )
    if (!user) {
      return {
        errors: [{ field: 'username', message: "username doesn't exist" }]
      }
    }
    const valid = await argon2.verify(user.password, password)
    if (!valid) {
      return {
        errors: [{ field: 'password', message: 'incorrect' }]
      }
    }

    req.session.userId = user.id

    return { user }
  }

  @Mutation(() => Boolean)
  logout (@Ctx() { req, res }: MyContext) {
    return new Promise(resolve =>
      req.session.destroy(err => {
        res.clearCookie(COOKIE_NAME)
        if (err) {
          console.error(err)
          resolve(false)
          return
        }
        resolve(true)
      })
    )
  }
}
