import { BaseSeeder } from '@adonisjs/lucid/seeders'
import Category from '#models/category'

export default class extends BaseSeeder {
  async run() {
    await Category.firstOrCreate(
      { name: 'Darkwave' },
      { name: 'Darkwave', description: 'Darkwave tracks and artists' }
    )

    await Category.firstOrCreate(
      { name: 'Goth Rock' },
      { name: 'Goth Rock', description: 'Goth rock category' }
    )

    await Category.firstOrCreate(
      { name: 'Post-Punk' },
      { name: 'Post-Punk', description: 'Post-punk tracks and artists' }
    )
  }
}
