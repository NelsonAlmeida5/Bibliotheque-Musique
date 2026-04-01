import type { HttpContext } from '@adonisjs/core/http'
import { createArtistValidator, updateArtistValidator } from '#validators/artist'
import Artist from '#models/artist'
import FavoriteTrack from '#models/favorite_track'
import Rating from '#models/rating'
import FavoriteArtist from '#models/favorite_artist'

export default class ArtistsController {
  async index({ request }: HttpContext) {
    const search = request.input('search')
    const page = request.input('page', 1)
    const limit = request.input('limit', 10)

    const query = Artist.query().orderBy('name', 'asc')

    if (search) {
      query.where((builder) => {
        builder.whereILike('name', `%${search}%`).orWhereILike('description', `%${search}%`)
      })
    }

    const artists = await query
      .preload('tracks', (tracksQuery) => {
        tracksQuery.where('is_public', true).preload('category').orderBy('created_at', 'desc')
      })
      .paginate(page, limit)

    const serialized = artists.serialize()

    serialized.data = artists.all().map((artist) => {
      const base = artist.serialize()

      const categoryNames = Array.from(
        new Set(
          (artist.tracks ?? [])
            .map((track) => track.category?.name?.trim())
            .filter((name) => Boolean(name))
        )
      ) as string[]

      return {
        ...base,
        categoriesRepresented: {
          count: categoryNames.length,
          names: categoryNames,
        },
      }
    })

    return serialized
  }

  async show({ params }: HttpContext) {
    const artist = await Artist.query()
      .where('id', params.id)
      .preload('tracks', (tracksQuery) => {
        tracksQuery
          .where('is_public', true)
          .preload('category')
          .preload('user')
          .orderBy('created_at', 'desc')
      })
      .firstOrFail()

    const tracks = artist.tracks ?? []
    const serializedArtist = artist.serialize()

    const artistFavorites = await FavoriteArtist.query().where('artist_id', artist.id)
    const artistFavoritesCount = artistFavorites.length

    if (!tracks.length) {
      return {
        ...serializedArtist,
        latestTrackInCatalog: null,
        categoriesRepresented: {
          count: 0,
          names: [],
        },
        artistFavoritesCount,
        mostFavoritedTrack: null,
        highestRatedTrack: null,
      }
    }

    const trackIds = tracks.map((track) => track.id)

    const categoryNames = Array.from(
      new Set(tracks.map((track) => track.category?.name?.trim()).filter((name) => Boolean(name)))
    ) as string[]

    const latestTrack = tracks[0]
      ? {
          id: tracks[0].id,
          title: tracks[0].title ?? 'Untitled track',
        }
      : null

    const favorites = await FavoriteTrack.query().whereIn('track_id', trackIds)
    const ratings = await Rating.query().whereIn('track_id', trackIds)

    const favoriteCounts = new Map<number, number>()
    for (const favorite of favorites) {
      favoriteCounts.set(favorite.trackId, (favoriteCounts.get(favorite.trackId) ?? 0) + 1)
    }

    const ratingStats = new Map<number, { sum: number; count: number }>()
    for (const rating of ratings) {
      const current = ratingStats.get(rating.trackId) ?? { sum: 0, count: 0 }
      current.sum += rating.rating
      current.count += 1
      ratingStats.set(rating.trackId, current)
    }

    const overallAverage =
      ratings.length > 0
        ? ratings.reduce((sum, rating) => sum + rating.rating, 0) / ratings.length
        : 0

    const minimumVotes = 3

    const trackSummaries = tracks.map((track) => {
      const stats = ratingStats.get(track.id) ?? { sum: 0, count: 0 }
      const averageRating = stats.count > 0 ? stats.sum / stats.count : 0
      const weightedRating =
        stats.count > 0
          ? (averageRating * stats.count + overallAverage * minimumVotes) /
            (stats.count + minimumVotes)
          : 0

      return {
        id: track.id,
        title: track.title ?? 'Untitled track',
        createdAtMillis: track.createdAt?.toMillis() ?? 0,
        favoriteCount: favoriteCounts.get(track.id) ?? 0,
        ratingsCount: stats.count,
        averageRating,
        weightedRating,
      }
    })

    const mostFavoritedTrack =
      [...trackSummaries]
        .filter((track) => track.favoriteCount > 0)
        .sort((a, b) => {
          return (
            b.favoriteCount - a.favoriteCount ||
            b.ratingsCount - a.ratingsCount ||
            b.weightedRating - a.weightedRating ||
            b.createdAtMillis - a.createdAtMillis
          )
        })[0] ?? null

    const highestRatedTrack =
      [...trackSummaries]
        .filter((track) => track.ratingsCount > 0)
        .sort((a, b) => {
          return (
            b.weightedRating - a.weightedRating ||
            b.ratingsCount - a.ratingsCount ||
            b.averageRating - a.averageRating ||
            b.createdAtMillis - a.createdAtMillis
          )
        })[0] ?? null

    return {
      ...serializedArtist,
      latestTrackInCatalog: latestTrack,
      categoriesRepresented: {
        count: categoryNames.length,
        names: categoryNames,
      },
      artistFavoritesCount,
      mostFavoritedTrack: mostFavoritedTrack
        ? {
            id: mostFavoritedTrack.id,
            title: mostFavoritedTrack.title,
            favoriteCount: mostFavoritedTrack.favoriteCount,
          }
        : null,
      highestRatedTrack: highestRatedTrack
        ? {
            id: highestRatedTrack.id,
            title: highestRatedTrack.title,
            averageRating: Number(highestRatedTrack.averageRating.toFixed(1)),
            ratingsCount: highestRatedTrack.ratingsCount,
            weightedRating: Number(highestRatedTrack.weightedRating.toFixed(2)),
          }
        : null,
    }
  }

  async store({ request, auth, response }: HttpContext) {
    const user = auth.user!

    if (user.role !== 'admin') {
      return response.forbidden({ message: 'Only admins can create artists' })
    }

    const data = await request.validateUsing(createArtistValidator)

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

    const data = await request.validateUsing(updateArtistValidator)

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
