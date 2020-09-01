import argon2 from 'argon2'
import {
  Arg,
  Ctx,
  Field,
  Mutation,
  ObjectType,
  Query,
  Resolver,
  FieldResolver,
  Root
} from 'type-graphql'
import { v4 } from 'uuid'
import { User } from '../entities/User'
import { sendEmail } from '../utils/sendEmail'
import { COOKIE_NAME, FORGET_PASSWORD_PREFIX } from './../constants'
import { MyContext } from './../types'
import { validateRegister } from './../utils/validateRegister'
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

@Resolver(User)
export class UserResolver {
  @FieldResolver(() => String)
  email (@Root() user: User, @Ctx() { req }: MyContext) {
    // this is the current user and its ok to show them their own email
    if (req.session.userId === user.id) return user.email
    // current user wants to see someone elses email
    return ''
  }

  @Query(() => [User])
  users () {
    return User.find()
  }

  @Mutation(() => Boolean)
  async forgotPassword (
    @Arg('email') email: string,
    @Ctx() { redis }: MyContext
  ) {
    const user = await User.findOne({ where: { email } })
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
    @Ctx() { redis, req }: MyContext
  ): Promise<UserResponse> {
    if (newPassword.length <= 2) {
      return {
        errors: [{ field: 'newPassword', message: 'password too short' }]
      }
    }
    const key = FORGET_PASSWORD_PREFIX + token
    const userId = await redis.get(key)
    if (!userId) {
      return {
        errors: [{ field: 'token', message: 'token expired' }]
      }
    }

    const userIdInt = parseInt(userId)
    const user = await User.findOne(userIdInt)

    if (!user) {
      return {
        errors: [{ field: 'user', message: 'user does not exist' }]
      }
    }

    await User.update(
      { id: userIdInt },
      { password: await argon2.hash(newPassword) }
    )
    await redis.del(key)
    req.session.userId = user.id

    return { user }
  }
  @Query(() => User, { nullable: true })
  me (@Ctx() { req }: MyContext) {
    if (!req.session.userId) {
      return null
    }
    return User.findOne(req.session.userId)
  }

  @Mutation(() => UserResponse)
  async register (
    @Arg('options') options: UsernamePasswordInput,
    @Ctx() { req }: MyContext
  ): Promise<UserResponse> {
    const errors = validateRegister(options)
    if (errors) {
      return { errors }
    }
    const hashedPassword = await argon2.hash(options.password)
    return await User.create({
      username: options.username,
      email: options.email,
      password: hashedPassword
    })
      .save()
      .then(user => {
        req.session.userId = user.id
        return { user }
      })
      .catch(err => {
        if (err.code === '23505') {
          return {
            errors: [{ field: 'username', message: 'username already exists' }]
          }
        } else {
          return {
            errors: [{ field: 'unknown', message: 'an unknown error occurred' }]
          }
        }
      })
  }

  @Mutation(() => UserResponse)
  async login (
    @Arg('usernameOrEmail') usernameOrEmail: string,
    @Arg('password') password: string,
    @Ctx() { req }: MyContext
  ): Promise<UserResponse> {
    const user = await User.findOne({
      where: usernameOrEmail.includes('@')
        ? { email: usernameOrEmail }
        : { username: usernameOrEmail }
    })
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
