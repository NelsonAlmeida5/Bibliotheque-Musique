import type { HttpContext } from '@adonisjs/core/http'
import { loginValidator, registerValidator } from '#validators/auth'
import User from '#models/user'

export default class AuthController {
  async register({ request, response, auth }: HttpContext) {
    const data = await request.validateUsing(registerValidator)

    const existingUserByEmail = await User.findBy('email', data.email)
    if (existingUserByEmail) {
      return response.conflict({ message: 'Email already in use' })
    }

    const existingUserByUsername = await User.findBy('username', data.username)
    if (existingUserByUsername) {
      return response.conflict({ message: 'Username already in use' })
    }

    const user = await User.create({
      username: data.username,
      email: data.email,
      password: data.password,
      role: 'user',
    })

    const token = await auth.use('api').createToken(user)

    return response.created({
      user,
      token,
    })
  }

  async login({ request, auth }: HttpContext) {
    const { email, password } = await request.validateUsing(loginValidator)

    const user = await User.verifyCredentials(email, password)
    const token = await auth.use('api').createToken(user)

    return {
      user,
      token,
    }
  }

  async me({ auth }: HttpContext) {
    const user = await auth.authenticateUsing(['api'])
    return user
  }

  async logout({ auth }: HttpContext) {
    await auth.use('api').invalidateToken()

    return {
      message: 'Logged out successfully',
    }
  }
}
