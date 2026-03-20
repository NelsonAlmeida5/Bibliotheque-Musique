import { BaseSeeder } from '@adonisjs/lucid/seeders'
import Artist from '#models/artist'

export default class extends BaseSeeder {
  async run() {
    await Artist.firstOrCreate(
      { name: 'Twin Tribes' },
      {
        name: 'Twin Tribes',
        imageUrl: 'https://example.com/twin-tribes.jpg',
        description: 'Darkwave duo',
      }
    )

    await Artist.firstOrCreate(
      { name: 'She Past Away' },
      {
        name: 'She Past Away',
        imageUrl: 'https://example.com/she-past-away.jpg',
        description: 'Turkish post-punk / darkwave band',
      }
    )

    await Artist.firstOrCreate(
      { name: 'Molchat Doma' },
      {
        name: 'Molchat Doma',
        imageUrl: 'https://example.com/molchat-doma.jpg',
        description: 'Belarusian post-punk / synth-driven band',
      }
    )
  }
}
