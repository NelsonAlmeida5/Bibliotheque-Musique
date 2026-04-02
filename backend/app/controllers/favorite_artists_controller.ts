import type { HttpContext } from '@adonisjs/core/http'
import { favoriteArtistValidator } from '#validators/favorite'
import FavoriteArtist from '#models/favorite_artist'
import Artist from '#models/artist'

function buildFavoriteArtistPayload(favorite: FavoriteArtist) {
  const favoriteData = favorite.serialize()
  const artistModel = favorite.artist

  if (!artistModel) {
    return {
      ...favoriteData,
      artist: null,
    }
  }

  const artistData = artistModel.serialize()

  const categoryNames = Array.from(
    new Set(
      (artistModel.tracks ?? [])
        .map((track) => track.category?.name?.trim())
        .filter((name) => Boolean(name))
    )
  ) as string[]

  return {
    ...favoriteData,
    artist: {
      ...artistData,
      categoriesRepresented: {
        count: categoryNames.length,
        names: categoryNames,
      },
    },
  }
}

export default class FavoriteArtistsController {
  async index({ auth }: HttpContext) {
    const user = auth.getUserOrFail()

    const favorites = await FavoriteArtist.query()
      .where('user_id', user.id)
      .preload('artist', (artistQuery) => {
        artistQuery.preload('tracks', (tracksQuery) => {
          tracksQuery.where('is_public', true).preload('category').orderBy('created_at', 'desc')
        })
      })
      .orderBy('created_at', 'desc')

    return favorites.map((favorite) => buildFavoriteArtistPayload(favorite))
  }

  async store({ request, auth, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const { artist_id: artistId } = await request.validateUsing(favoriteArtistValidator)

    await Artist.findOrFail(artistId)

    const existing = await FavoriteArtist.query()
      .where('user_id', user.id)
      .where('artist_id', artistId)
      .first()

    if (existing) {
      return response.conflict({ message: 'Artist already in favorites' })
    }

    const favorite = await FavoriteArtist.create({
      userId: user.id,
      artistId: artistId,
    })

    const createdFavorite = await FavoriteArtist.query()
      .where('id', favorite.id)
      .preload('artist', (artistQuery) => {
        artistQuery.preload('tracks', (tracksQuery) => {
          tracksQuery.where('is_public', true).preload('category').orderBy('created_at', 'desc')
        })
      })
      .firstOrFail()

    return response.created(buildFavoriteArtistPayload(createdFavorite))
  }

  async destroy({ params, auth, response }: HttpContext) {
    const user = auth.getUserOrFail()

    const favorite = await FavoriteArtist.query()
      .where('user_id', user.id)
      .where('artist_id', params.artistId)
      .first()

    if (!favorite) {
      return response.notFound({ message: 'Favorite artist not found' })
    }

    await favorite.delete()

    return {
      message: 'Favorite artist removed successfully',
    }
  }
}
