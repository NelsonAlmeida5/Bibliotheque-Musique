import { BaseSeeder } from '@adonisjs/lucid/seeders'
import Track from '#models/track'
import User from '#models/user'
import Artist from '#models/artist'
import Category from '#models/category'

export default class extends BaseSeeder {
  async run() {
    const admin = await User.findByOrFail('email', 'admin@test.com')

    const darkwave = await Category.findByOrFail('name', 'Darkwave')
    const gothRock = await Category.findByOrFail('name', 'Goth Rock')
    const postPunk = await Category.findByOrFail('name', 'Post-Punk')

    const twinTribes = await Artist.findByOrFail('name', 'Twin Tribes')
    const shePastAway = await Artist.findByOrFail('name', 'She Past Away')
    const molchatDoma = await Artist.findByOrFail('name', 'Molchat Doma')

    await Track.firstOrCreate(
      { title: 'Monolith' },
      {
        title: 'Monolith',
        embedUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        coverUrl: 'https://example.com/monolith.jpg',
        description: 'A darkwave track for testing',
        artistId: twinTribes.id,
        categoryId: darkwave.id,
        userId: admin.id,
      }
    )

    await Track.firstOrCreate(
      { title: 'Ritual' },
      {
        title: 'Ritual',
        embedUrl: 'https://www.youtube.com/watch?v=example1',
        coverUrl: 'https://example.com/ritual.jpg',
        description: 'A second darkwave track',
        artistId: twinTribes.id,
        categoryId: darkwave.id,
        userId: admin.id,
      }
    )

    await Track.firstOrCreate(
      { title: 'Kasvetli Kutlama' },
      {
        title: 'Kasvetli Kutlama',
        embedUrl: 'https://www.youtube.com/watch?v=example2',
        coverUrl: 'https://example.com/kasvetli.jpg',
        description: 'Dark and hypnotic post-punk atmosphere',
        artistId: shePastAway.id,
        categoryId: gothRock.id,
        userId: admin.id,
      }
    )

    await Track.firstOrCreate(
      { title: 'Sudno' },
      {
        title: 'Sudno',
        embedUrl: 'https://www.youtube.com/watch?v=example3',
        coverUrl: 'https://example.com/sudno.jpg',
        description: 'Cold post-punk track',
        artistId: molchatDoma.id,
        categoryId: postPunk.id,
        userId: admin.id,
      }
    )
  }
}
