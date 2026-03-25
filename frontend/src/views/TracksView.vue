<script setup>
const sortOptions = [
  'Most recent',
  'Top rated',
  'Most favorited',
  'Artist A–Z',
  'Title A–Z',
]

const selectedCategories = ['Phonk', 'Shoegaze']

const categories = [
  { name: 'Ambient', count: 12, checked: false },
  { name: 'Brazilian Underground', count: 24, checked: false },
  { name: 'Darkwave', count: 118, checked: false },
  { name: 'Dubstep', count: 41, checked: false },
  { name: 'EBM', count: 28, checked: false },
  { name: 'Electro', count: 105, checked: false },
  { name: 'Funk', count: 17, checked: false },
  { name: 'Hardstyle', count: 62, checked: false },
  { name: 'Hip-hop', count: 93, checked: false },
  { name: 'House', count: 34, checked: false },
  { name: 'Industrial', count: 51, checked: false },
  { name: 'Lo-fi', count: 22, checked: false },
  { name: 'Medieval', count: 31, checked: false },
  { name: 'Metal', count: 117, checked: false },
  { name: 'New wave', count: 74, checked: false },
  { name: 'Phonk', count: 38, checked: true },
  { name: 'Pop', count: 88, checked: false },
  { name: 'Post-punk', count: 42, checked: false },
  { name: 'Punk', count: 35, checked: false },
  { name: 'Rap', count: 29, checked: false },
  { name: 'Rock', count: 142, checked: false },
  { name: 'Shoegaze', count: 96, checked: true },
  { name: 'Soundtrack / OST', count: 18, checked: false },
  { name: 'Synthwave', count: 84, checked: false },
  { name: 'Techno', count: 47, checked: false },
  { name: 'Trap', count: 39, checked: false },
]

const tracks = [
  {
    id: 1,
    category: 'Shoegaze',
    title: 'Tower of Memories',
    artist: 'ivri',
    rating: '5.0',
  },
  {
    id: 2,
    category: 'Phonk',
    title: 'Drift Into Darkness',
    artist: 'Sxmpra',
    rating: '4.1',
  },
  {
    id: 3,
    category: 'Darkwave',
    title: 'Angels Ignore Me',
    artist: 'DollWave',
    rating: '4.0',
  },
  {
    id: 4,
    category: 'Hardstyle',
    title: 'Prophecy of the Storm',
    artist: 'Headhunterz',
    rating: '3.2',
  },
  {
    id: 5,
    category: 'Brazilian Underground',
    title: 'União Fiasco',
    artist: 'Luckhaos',
    rating: '4.4',
  },
  {
    id: 6,
    category: 'Industrial',
    title: 'The Pale Cathedral',
    artist: 'Lustmord',
    rating: '4.8',
  },
]
</script>

<template>
  <section class="catalog-page">
    <section class="catalog-topbar">
      <div class="container catalog-topbar__inner">
        <div class="catalog-heading">
          <h1>Catalog</h1>
          <p>1,240 tracks</p>
        </div>

        <div class="catalog-view-toggle" aria-label="View mode">
          <button type="button" class="catalog-view-toggle__button is-active">
            ▦ Grid
          </button>
          <button type="button" class="catalog-view-toggle__button">
            ☰ List
          </button>
        </div>
      </div>
    </section>

    <section class="catalog-content-section">
      <div class="container catalog-layout">
        <aside class="catalog-sidebar">
          <div class="catalog-filter-block">
            <label class="catalog-filter-label" for="track-search">Search</label>
            <input
              id="track-search"
              type="text"
              class="catalog-input"
              placeholder="Track title, artist..."
            />
          </div>

          <div class="catalog-filter-block">
            <div class="catalog-filter-label">Category</div>

            <div class="catalog-category-list">
              <label
                v-for="category in categories"
                :key="category.name"
                class="catalog-category-item"
              >
                <input type="checkbox" :checked="category.checked" />
                <span>{{ category.name }}</span>
                <small>{{ category.count }}</small>
              </label>
            </div>
          </div>

          <div class="catalog-filter-block">
            <label class="catalog-filter-label" for="artist-filter">Artist</label>
            <input
              id="artist-filter"
              type="text"
              class="catalog-input"
              placeholder="Filter by artist..."
            />
          </div>

          <div class="catalog-filter-block">
            <label class="catalog-filter-label" for="sort-by">Sort by</label>
            <select id="sort-by" class="catalog-select">
              <option
                v-for="option in sortOptions"
                :key="option"
                :value="option"
                :selected="option === 'Most recent'"
              >
                {{ option }}
              </option>
            </select>
          </div>
        </aside>

        <div class="catalog-main">
          <div class="catalog-active-filters">
            <button
              v-for="category in selectedCategories"
              :key="category"
              type="button"
              class="catalog-chip"
            >
              {{ category }} ×
            </button>

            <button type="button" class="catalog-clear">Clear all</button>
          </div>

          <div class="catalog-grid">
            <article
              v-for="track in tracks"
              :key="track.id"
              class="catalog-card"
            >
              <div class="catalog-card__cover">
                <button type="button" class="catalog-card__favorite">♡</button>
                <div class="catalog-card__play">▶</div>
              </div>

              <div class="catalog-card__body">
                <p class="catalog-card__category">{{ track.category }}</p>
                <h3 class="catalog-card__title">{{ track.title }}</h3>
                <p class="catalog-card__artist">{{ track.artist }}</p>

                <div class="catalog-card__footer">
                  <div class="catalog-card__rating">
                    <span class="stars">★★★★★</span>
                    <span>{{ track.rating }}</span>
                  </div>

                  <RouterLink
                    :to="`/tracks/${track.id}`"
                    class="button button--details button--sm"
                  >
                    Details →
                  </RouterLink>
                </div>
              </div>
            </article>
          </div>

          <div class="catalog-pagination">
            <button type="button" class="catalog-page-btn">‹</button>
            <button type="button" class="catalog-page-btn is-active">1</button>
            <button type="button" class="catalog-page-btn">2</button>
            <button type="button" class="catalog-page-btn">3</button>
            <button type="button" class="catalog-page-btn">…</button>
            <button type="button" class="catalog-page-btn">24</button>
            <button type="button" class="catalog-page-btn">›</button>
          </div>
        </div>
      </div>
    </section>
  </section>
</template>