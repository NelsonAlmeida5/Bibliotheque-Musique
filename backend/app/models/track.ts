import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, hasMany, manyToMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany, ManyToMany } from '@adonisjs/lucid/types/relations'

import User from '#models/user'
import Artist from '#models/artist'
import Category from '#models/category'
import FavoriteTrack from '#models/favorite_track'
import Playlist from '#models/playlist'
import Comment from '#models/comment'
import Rating from '#models/rating'

export default class Track extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare title: string

  @column()
  declare embedUrl: string

  @column()
  declare coverUrl: string | null

  @column()
  declare description: string | null

  @column()
  declare categoryId: number

  @column()
  declare artistId: number

  @column()
  declare userId: number

  @column()
  declare isPublic: boolean

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime | null

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @belongsTo(() => Category)
  declare category: BelongsTo<typeof Category>

  @belongsTo(() => Artist)
  declare artist: BelongsTo<typeof Artist>

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>

  @hasMany(() => FavoriteTrack)
  declare favoriteTracks: HasMany<typeof FavoriteTrack>

  @hasMany(() => Comment)
  declare comments: HasMany<typeof Comment>

  @hasMany(() => Rating)
  declare ratings: HasMany<typeof Rating>

  @manyToMany(() => Playlist, {
    pivotTable: 'playlist_tracks',
  })
  declare playlists: ManyToMany<typeof Playlist>
}
