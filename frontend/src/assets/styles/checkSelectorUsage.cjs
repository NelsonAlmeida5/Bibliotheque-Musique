const fs = require("fs");
const path = require("path");
const root = path.join(__dirname, "..", "..");
const candidates = [
  "admin-track-list",
  "admin-track-row",
  "admin-track-row__actions",
  "admin-track-row__badge",
  "admin-track-row__cover",
  "admin-track-row__main",
  "admin-track-row__owner",
  "admin-track-row__status",
  "artist-card__cover--blue",
  "artist-card__cover--green",
  "artist-card__cover--rose",
  "artist-card__cover--sand",
  "artist-card__cover--violet",
  "artist-detail-hero__cover--blue",
  "artist-detail-hero__cover--sand",
  "artist-detail-hero__cover--stone",
  "artist-detail-hero__cover--violet",
  "artists-pagination",
  "catalog-page-btn",
  "catalog-pagination",
  "favorite-artist-card__cover--blue",
  "favorite-artist-card__cover--sand",
  "favorite-artist-card__cover--violet",
  "home-hero__visual",
  "hero-mic",
  "is-private",
  "my-track-card__badge",
  "navbar__user",
  "playlist-card__cover--blue",
  "playlist-card__cover--sand",
  "playlist-card__cover--stone",
  "playlist-card__cover--violet",
  "playlist-card__cover-grid--0",
  "playlist-card__cover-grid--1",
  "playlist-card__cover-grid--2",
  "playlist-card__cover-grid--3",
  "playlist-card__cover-grid--4",
  "playlist-detail-eyebrow",
];
const files = [];
function walk(dir) {
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      if (["node_modules", ".git", "dist"].includes(name)) continue;
      walk(full);
    } else if (stat.isFile()) {
      const ext = path.extname(name).toLowerCase();
      if ([".vue", ".js", ".ts", ".html"].includes(ext)) {
        files.push(full);
      }
    }
  }
}
walk(root);
for (const candidate of candidates) {
  const regex = new RegExp(
    candidate.replace(/[-\\/\\^$*+?.()|[\]{}]/g, "\\$&"),
  );
  const matches = [];
  for (const file of files) {
    const content = fs.readFileSync(file, "utf8");
    if (regex.test(content)) matches.push(path.relative(root, file));
  }
  console.log(
    candidate + ": " + (matches.length ? matches.join(", ") : "NOT FOUND"),
  );
}
