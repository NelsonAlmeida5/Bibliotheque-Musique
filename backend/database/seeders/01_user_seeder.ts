import { BaseSeeder } from '@adonisjs/lucid/seeders'
import User from '#models/user'

export default class extends BaseSeeder {
  async run() {
    await User.firstOrCreate(
      { email: 'admin@test.com' },
      {
        username: 'admin',
        email: 'admin@test.com',
        password: '12345678',
        role: 'admin',
      }
    )

    await User.firstOrCreate(
      { email: 'user@test.com' },
      {
        username: 'user1',
        email: 'user@test.com',
        password: '12345678',
        role: 'user',
      }
    )
  }
}
