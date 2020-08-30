import { validateRegister } from './../utils/validateRegister'
import { v4 } from 'uuid'
import { COOKIE_NAME, FORGET_PASSWORD_PREFIX } from './../constants'
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
import { sendEmail } from '../utils/sendEmail'

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
  @Mutation(() => Boolean)
  async forgotPassword (
    @Arg('email') email: string,
    @Ctx() { em, redis }: MyContext
  ) {
    const user = await em.findOne(User, { email })
    if (!user) {
      // user not in DB
      return true
    }

    const token = v4()

    await redis.set(
      FORGET_PASSWORD_PREFIX + token,
      user.id,
      'ex',
      1000 * 60 * 60 * 24 * 3
    ) // 3 days

    await sendEmail(
      email,
      `<a href="http://localhost:3000/change-password/${token}">Reset Password</a>`
    )
    return true
  }

  @Mutation(() => UserResponse)
  async changePassword (
    @Arg('token') token: string,
    @Arg('newPassword') newPassword: string,
    @Ctx() { em, redis, req }: MyContext
  ): Promise<UserResponse> {
    if (newPassword.length <= 2) {
      return {
        errors: [{ field: 'newPassword', message: 'password too short' }]
      }
    }
    const userId = await redis.get(FORGET_PASSWORD_PREFIX + token)
    if (!userId) {
      return {
        errors: [{ field: 'token', message: 'token expired' }]
      }
    }

    const user = await em.findOne(User, { id: parseInt(userId) })

    if (!user) {
      return {
        errors: [{ field: 'user', message: 'user does not exist' }]
      }
    }

    user.password = await argon2.hash(newPassword)
    await em.persistAndFlush(user)

    req.session.userId = user.id

    return { user }
  }
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
        errors: [
          { field: 'usernameOrEmail', message: "username/email doesn't exist" }
        ]
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
