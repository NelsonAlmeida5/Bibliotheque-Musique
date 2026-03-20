import { DateTime } from 'luxon'
import hash from '@adonisjs/core/services/hash'
import { compose } from '@adonisjs/core/helpers'
import { BaseModel, column, hasMany } from '@adonisjs/lucid/orm'
import { withAuthFinder } from '@adonisjs/auth/mixins/lucid'
import { DbAccessTokensProvider } from '@adonisjs/auth/access_tokens'
import type { HasMany } from '@adonisjs/lucid/types/relations'

import Track from '#models/track'
import Playlist from '#models/playlist'
import FavoriteTrack from '#models/favorite_track'
import FavoriteArtist from '#models/favorite_artist'
import Comment from '#models/comment'
import Rating from '#models/rating'

const AuthFinder = withAuthFinder(() => hash.use('argon2'), {
  uids: ['email'],
  passwordColumnName: 'password',
})

export default class User extends compose(BaseModel, AuthFinder) {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare username: string

  @column()
  declare email: string

  @column({ serializeAs: null })
  declare password: string

  @column()
  declare role: string

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime | null

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @hasMany(() => Track)
  declare tracks: HasMany<typeof Track>

  @hasMany(() => Playlist)
  declare playlists: HasMany<typeof Playlist>

  @hasMany(() => FavoriteTrack)
  declare favoriteTracks: HasMany<typeof FavoriteTrack>

  @hasMany(() => FavoriteArtist)
  declare favoriteArtists: HasMany<typeof FavoriteArtist>

  @hasMany(() => Comment)
  declare comments: HasMany<typeof Comment>

  @hasMany(() => Rating)
  declare ratings: HasMany<typeof Rating>

  static accessTokens = DbAccessTokensProvider.forModel(User)
}
