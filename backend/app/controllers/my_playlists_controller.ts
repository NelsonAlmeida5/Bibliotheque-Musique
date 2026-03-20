import type { HttpContext } from '@adonisjs/core/http'
import {
  createPlaylistValidator,
  updatePlaylistValidator,
  addTrackToPlaylistValidator,
} from '#validators/playlist'
import Playlist from '#models/playlist'
import Track from '#models/track'

export default class MyPlaylistsController {
  async index({ auth }: HttpContext) {
    const user = auth.getUserOrFail()

    const playlists = await Playlist.query()
      .where('user_id', user.id)
      .preload('tracks', (tracksQuery) => {
        tracksQuery.preload('artist').preload('category')
      })
      .orderBy('created_at', 'desc')

    return playlists
  }

  async show({ params, auth, response }: HttpContext) {
    const user = auth.getUserOrFail()

    const playlist = await Playlist.query()
      .where('id', params.id)
      .where('user_id', user.id)
      .preload('tracks', (tracksQuery) => {
        tracksQuery.preload('artist').preload('category').preload('user')
      })
      .first()

    if (!playlist) {
      return response.notFound({ message: 'Playlist not found' })
    }

    return playlist
  }

  async store({ request, auth, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const data = await request.validateUsing(createPlaylistValidator)

    const playlist = await Playlist.create({
      name: data.name,
      description: data.description,
      userId: user.id,
    })

    return response.created(playlist)
  }

  async update({ params, request, auth, response }: HttpContext) {
    const user = auth.getUserOrFail()

    const playlist = await Playlist.query().where('id', params.id).where('user_id', user.id).first()

    if (!playlist) {
      return response.notFound({ message: 'Playlist not found' })
    }

    const data = await request.validateUsing(updatePlaylistValidator)

    if (data.name !== undefined) playlist.name = data.name
    if (data.description !== undefined) playlist.description = data.description

    await playlist.save()

    return playlist
  }

  async destroy({ params, auth, response }: HttpContext) {
    const user = auth.getUserOrFail()

    const playlist = await Playlist.query().where('id', params.id).where('user_id', user.id).first()

    if (!playlist) {
      return response.notFound({ message: 'Playlist not found' })
    }

    await playlist.delete()

    return {
      message: 'Playlist deleted successfully',
    }
  }

  async addTrack({ params, request, auth, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const { track_id: trackId } = await request.validateUsing(addTrackToPlaylistValidator)

    const playlist = await Playlist.query().where('id', params.id).where('user_id', user.id).first()

    if (!playlist) {
      return response.notFound({ message: 'Playlist not found' })
    }

    await Track.findOrFail(trackId)

    const alreadyAttached = await playlist
      .related('tracks')
      .query()
      .where('tracks.id', trackId)
      .first()

    if (alreadyAttached) {
      return response.conflict({ message: 'Track already in playlist' })
    }

    await playlist.related('tracks').attach([trackId])

    return {
      message: 'Track added to playlist successfully',
    }
  }

  async removeTrack({ params, auth, response }: HttpContext) {
    const user = auth.getUserOrFail()

    const playlist = await Playlist.query().where('id', params.id).where('user_id', user.id).first()

    if (!playlist) {
      return response.notFound({ message: 'Playlist not found' })
    }

    await playlist.related('tracks').detach([params.trackId])

    return {
      message: 'Track removed from playlist successfully',
    }
  }
}
