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
      .where('is_public', true)
      .preload('artist')
      .preload('category')
      .preload('user')
      .preload('ratings')
      .orderBy('created_at', 'desc')

    if (search) {
      query.where((builder) => {
        builder
          .whereILike('title', `%${search}%`)
          .orWhereILike('description', `%${search}%`)
          .orWhereILike('custom_artist_name', `%${search}%`)
          .orWhereILike('custom_category_name', `%${search}%`)
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
      .where('is_public', true)
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
    const user = auth.getUserOrFail()
    const data = await request.validateUsing(createTrackValidator)

    if (!data.artist_id && !data.custom_artist_name) {
      return response.unprocessableEntity({
        message: 'You must provide either artist_id or custom_artist_name',
      })
    }

    if (!data.category_id && !data.custom_category_name) {
      return response.unprocessableEntity({
        message: 'You must provide either category_id or custom_category_name',
      })
    }

    if (data.artist_id) {
      await Artist.findOrFail(data.artist_id)
    }

    if (data.category_id) {
      await Category.findOrFail(data.category_id)
    }

    const track = await Track.create({
      title: data.title,
      embedUrl: data.embed_url,
      coverUrl: data.cover_url,
      description: data.description,
      artistId: data.artist_id ?? null,
      categoryId: data.category_id ?? null,
      customArtistName: data.custom_artist_name ?? null,
      customCategoryName: data.custom_category_name ?? null,
      userId: user.id,
      isPublic: user.role === 'admin' ? (data.is_public ?? true) : false,
    })

    await track.load('artist')
    await track.load('category')
    await track.load('user')

    return response.created(track)
  }

  async update({ params, request, auth, response }: HttpContext) {
    const user = auth.getUserOrFail()

    const track = await Track.findOrFail(params.id)

    if (track.userId !== user.id && user.role !== 'admin') {
      return response.forbidden({ message: 'You are not allowed to update this track' })
    }

    const data = await request.validateUsing(updateTrackValidator)

    const nextArtistId = data.artist_id !== undefined ? data.artist_id : track.artistId
    const nextCategoryId = data.category_id !== undefined ? data.category_id : track.categoryId

    const nextCustomArtistName =
      data.custom_artist_name !== undefined ? data.custom_artist_name : track.customArtistName

    const nextCustomCategoryName =
      data.custom_category_name !== undefined ? data.custom_category_name : track.customCategoryName

    if (!nextArtistId && !nextCustomArtistName) {
      return response.unprocessableEntity({
        message: 'A track must have either artist_id or custom_artist_name',
      })
    }

    if (!nextCategoryId && !nextCustomCategoryName) {
      return response.unprocessableEntity({
        message: 'A track must have either category_id or custom_category_name',
      })
    }

    if (data.artist_id !== undefined && data.artist_id !== null) {
      await Artist.findOrFail(data.artist_id)
      track.artistId = data.artist_id
      track.customArtistName = null
    }

    if (data.custom_artist_name !== undefined) {
      track.customArtistName = data.custom_artist_name
      track.artistId = null
    }

    if (data.category_id !== undefined && data.category_id !== null) {
      await Category.findOrFail(data.category_id)
      track.categoryId = data.category_id
      track.customCategoryName = null
    }

    if (data.custom_category_name !== undefined) {
      track.customCategoryName = data.custom_category_name
      track.categoryId = null
    }

    if (data.title !== undefined) track.title = data.title
    if (data.embed_url !== undefined) track.embedUrl = data.embed_url
    if (data.cover_url !== undefined) track.coverUrl = data.cover_url
    if (data.description !== undefined) track.description = data.description

    if (user.role === 'admin' && data.is_public !== undefined) {
      track.isPublic = data.is_public
    }

    await track.save()

    await track.load('artist')
    await track.load('category')
    await track.load('user')

    return track
  }

  async destroy({ params, auth, response }: HttpContext) {
    const user = auth.getUserOrFail()

    const track = await Track.findOrFail(params.id)

    if (track.userId !== user.id && user.role !== 'admin') {
      return response.forbidden({ message: 'You are not allowed to delete this track' })
    }

    await track.delete()

    return { message: 'Track deleted successfully' }
  }

  async myTracks({ auth }: HttpContext) {
    const user = auth.getUserOrFail()

    const tracks = await Track.query()
      .where('user_id', user.id)
      .where('is_public', false)
      .preload('artist')
      .preload('category')
      .orderBy('created_at', 'desc')

    return tracks
  }
}
