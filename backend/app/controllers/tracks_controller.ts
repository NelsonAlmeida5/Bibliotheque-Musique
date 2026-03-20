import type { HttpContext } from '@adonisjs/core/http'
import { createTrackValidator, updateTrackValidator } from '#validators/track'
import Track from '#models/track'
import Artist from '#models/artist'
import Category from '#models/category'

export default class TracksController {
  async index({ request }: HttpContext) {
    const search = request.input('search')
    const artistId = request.input('artist_id')
    const categoryId = request.input('category_id')
    const userId = request.input('user_id')
    const page = request.input('page', 1)
    const limit = request.input('limit', 10)

    const query = Track.query()
      .preload('artist')
      .preload('category')
      .preload('user')
      .orderBy('created_at', 'desc')

    if (search) {
      query.where((builder) => {
        builder.whereILike('title', `%${search}%`).orWhereILike('description', `%${search}%`)
      })
    }

    if (artistId) {
      query.where('artist_id', artistId)
    }

    if (categoryId) {
      query.where('category_id', categoryId)
    }

    if (userId) {
      query.where('user_id', userId)
    }

    return query.paginate(page, limit)
  }

  async show({ params }: HttpContext) {
    const track = await Track.query()
      .where('id', params.id)
      .preload('artist')
      .preload('category')
      .preload('user')
      .preload('comments', (commentsQuery) => {
        commentsQuery.preload('user').orderBy('created_at', 'desc')
      })
      .preload('ratings')
      .firstOrFail()

    return track
  }

  async store({ request, auth, response }: HttpContext) {
    const user = auth.user!

    const data = await request.validateUsing(createTrackValidator)

    await Artist.findOrFail(data.artist_id)
    await Category.findOrFail(data.category_id)

    const track = await Track.create({
      title: data.title,
      embedUrl: data.embed_url,
      coverUrl: data.cover_url,
      description: data.description,
      artistId: data.artist_id,
      categoryId: data.category_id,
      userId: user.id,
    })

    await track.load('artist')
    await track.load('category')
    await track.load('user')

    return response.created(track)
  }

  async update({ params, request, auth, response }: HttpContext) {
    const user = auth.user!

    const track = await Track.findOrFail(params.id)

    if (track.userId !== user.id && user.role !== 'admin') {
      return response.forbidden({ message: 'You are not allowed to update this track' })
    }

    const data = await request.validateUsing(updateTrackValidator)

    if (data.artist_id) {
      await Artist.findOrFail(data.artist_id)
      track.artistId = data.artist_id
    }

    if (data.category_id) {
      await Category.findOrFail(data.category_id)
      track.categoryId = data.category_id
    }

    if (data.title !== undefined) track.title = data.title
    if (data.embed_url !== undefined) track.embedUrl = data.embed_url
    if (data.cover_url !== undefined) track.coverUrl = data.cover_url
    if (data.description !== undefined) track.description = data.description

    await track.save()

    await track.load('artist')
    await track.load('category')
    await track.load('user')

    return track
  }

  async destroy({ params, auth, response }: HttpContext) {
    const user = auth.user!

    const track = await Track.findOrFail(params.id)

    if (track.userId !== user.id && user.role !== 'admin') {
      return response.forbidden({ message: 'You are not allowed to delete this track' })
    }

    await track.delete()

    return { message: 'Track deleted successfully' }
  }

  async myTracks({ auth }: HttpContext) {
    const user = auth.user!

    const tracks = await Track.query()
      .where('user_id', user.id)
      .preload('artist')
      .preload('category')
      .orderBy('created_at', 'desc')

    return tracks
  }
}
