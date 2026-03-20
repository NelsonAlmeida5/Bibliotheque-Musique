import type { HttpContext } from '@adonisjs/core/http'
import Artist from '#models/artist'

export default class ArtistsController {
  async index({ request }: HttpContext) {
    const search = request.input('search')
    const page = request.input('page', 1)
    const limit = request.input('limit', 10)

    const query = Artist.query().orderBy('name', 'asc')

    if (search) {
      query.where((builder) => {
        builder
          .whereILike('name', `%${search}%`)
          .orWhereILike('description', `%${search}%`)
      })
    }

    return query.paginate(page, limit)
  }

  async show({ params }: HttpContext) {
    const artist = await Artist.query()
      .where('id', params.id)
      .preload('tracks', (tracksQuery) => {
        tracksQuery
          .preload('category')
          .preload('user')
          .orderBy('created_at', 'desc')
      })
      .firstOrFail()

    return artist
  }

  async store({ request, auth, response }: HttpContext) {
    const user = auth.user!

    if (user.role !== 'admin') {
      return response.forbidden({ message: 'Only admins can create artists' })
    }

    const data = request.only(['name', 'image_url', 'description'])

    const artist = await Artist.create({
      name: data.name,
      imageUrl: data.image_url,
      description: data.description,
    })

    return response.created(artist)
  }

  async update({ params, request, auth, response }: HttpContext) {
    const user = auth.user!

    if (user.role !== 'admin') {
      return response.forbidden({ message: 'Only admins can update artists' })
    }

    const artist = await Artist.findOrFail(params.id)

    const data = request.only(['name', 'image_url', 'description'])

    if (data.name !== undefined) artist.name = data.name
    if (data.image_url !== undefined) artist.imageUrl = data.image_url
    if (data.description !== undefined) artist.description = data.description

    await artist.save()

    return artist
  }

  async destroy({ params, auth, response }: HttpContext) {
    const user = auth.user!

    if (user.role !== 'admin') {
      return response.forbidden({ message: 'Only admins can delete artists' })
    }

    const artist = await Artist.findOrFail(params.id)
    await artist.delete()

    return { message: 'Artist deleted successfully' }
  }
}
