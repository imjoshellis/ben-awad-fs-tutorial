import { UsernamePasswordInput } from './../resolvers/UsernamePasswordInput'
export const validateRegister = (options: UsernamePasswordInput) => {
  if (!options.email.includes('@')) {
    return [{ field: 'email', message: 'invalid email' }]
  }
  if (options.username.length <= 2) {
    return [{ field: 'username', message: 'username too short' }]
  }
  if (options.username.includes('@')) {
    return [{ field: 'username', message: 'cannot include @ symbol' }]
  }
  if (options.password.length <= 2) {
    return [{ field: 'password', message: 'password too short' }]
  }
  return null
}
