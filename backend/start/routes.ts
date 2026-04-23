import router from '@adonisjs/core/services/router'
import { middleware } from '#start/kernel'

const AuthController = () => import('#controllers/auth_controller')
const TracksController = () => import('#controllers/tracks_controller')
const ArtistsController = () => import('#controllers/artists_controller')
const CategoriesController = () => import('#controllers/categories_controller')
const FavoriteTracksController = () => import('#controllers/favorite_tracks_controller')
const FavoriteArtistsController = () => import('#controllers/favorite_artists_controller')
const MyPlaylistsController = () => import('#controllers/my_playlists_controller')
const CommentsController = () => import('#controllers/comments_controller')
const RatingsController = () => import('#controllers/ratings_controller')
const HomeController = () => import('#controllers/home_controller')

/*
|--------------------------------------------------------------------------
| Public routes
|--------------------------------------------------------------------------
*/
router.get('/', async () => {
  return { message: 'API Bibliotheque Musique is running - CD test' }
})

router.get('/home', [HomeController, 'index'])

router.post('/register', [AuthController, 'register'])
router.post('/login', [AuthController, 'login'])

router.get('/tracks', [TracksController, 'index'])
router.get('/tracks/:id', [TracksController, 'show'])

router.get('/artists', [ArtistsController, 'index'])
router.get('/artists/:id', [ArtistsController, 'show'])

router.get('/categories', [CategoriesController, 'index'])
router.get('/categories/:id', [CategoriesController, 'show'])

router.get('/tracks/:id/comments', [CommentsController, 'index'])

/*
|--------------------------------------------------------------------------
| Protected routes
|--------------------------------------------------------------------------
*/

router
  .group(() => {
    // Auth
    router.get('/me', [AuthController, 'me'])
    router.post('/logout', [AuthController, 'logout'])

    // Tracks
    router.post('/tracks', [TracksController, 'store'])
    router.put('/tracks/:id', [TracksController, 'update'])
    router.delete('/tracks/:id', [TracksController, 'destroy'])
    router.get('/my-tracks', [TracksController, 'myTracks'])

    // Artists (admin check inside controller)
    router.post('/artists', [ArtistsController, 'store'])
    router.put('/artists/:id', [ArtistsController, 'update'])
    router.delete('/artists/:id', [ArtistsController, 'destroy'])

    // Categories (admin check inside controller)
    router.post('/categories', [CategoriesController, 'store'])
    router.put('/categories/:id', [CategoriesController, 'update'])
    router.delete('/categories/:id', [CategoriesController, 'destroy'])

    // Favorite tracks
    router.get('/favorite-tracks', [FavoriteTracksController, 'index'])
    router.post('/favorite-tracks', [FavoriteTracksController, 'store'])
    router.delete('/favorite-tracks/:trackId', [FavoriteTracksController, 'destroy'])

    // Favorite artists
    router.get('/favorite-artists', [FavoriteArtistsController, 'index'])
    router.post('/favorite-artists', [FavoriteArtistsController, 'store'])
    router.delete('/favorite-artists/:artistId', [FavoriteArtistsController, 'destroy'])

    // My playlists
    router.get('/my-playlists', [MyPlaylistsController, 'index'])
    router.get('/my-playlists/:id', [MyPlaylistsController, 'show'])
    router.post('/my-playlists', [MyPlaylistsController, 'store'])
    router.put('/my-playlists/:id', [MyPlaylistsController, 'update'])
    router.delete('/my-playlists/:id', [MyPlaylistsController, 'destroy'])
    router.post('/my-playlists/:id/tracks', [MyPlaylistsController, 'addTrack'])
    router.delete('/my-playlists/:id/tracks/:trackId', [MyPlaylistsController, 'removeTrack'])

    // Ratings
    router.get('/tracks/:id/rating', [RatingsController, 'show'])
    router.post('/tracks/:id/rating', [RatingsController, 'store'])

    // Comments
    router.post('/tracks/:id/comments', [CommentsController, 'store'])
    router.put('/comments/:id', [CommentsController, 'update'])
    router.delete('/comments/:id', [CommentsController, 'destroy'])
  })
  .use(middleware.auth())
