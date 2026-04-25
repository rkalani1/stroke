#!/usr/bin/env bash
# Generates Apple-touch-startup-image splash screens from icon-512.png.
# Centers the icon on a #3B82F6 (theme color) background at every common
# iOS device pixel dimension. Run after icon-512.png changes.
#
# Requires: sips (macOS built-in) and ImageMagick (`brew install imagemagick`).
# If ImageMagick is not present, falls back to icon-only splashes (no
# centered composition — iOS will still display them, just without
# brand-color padding).

set -euo pipefail

SRC="icon-512.png"
OUT="assets/splash"
BG="#3B82F6"
mkdir -p "$OUT"

# Common iPhone + iPad portrait dimensions (CSS px × pixel ratio).
# Format: "WIDTHxHEIGHT label"
sizes=(
  "1320x2868 iphone-16-pro-max"
  "1206x2622 iphone-16-pro"
  "1290x2796 iphone-16"
  "1284x2778 iphone-15-plus"
  "1170x2532 iphone-15-14-13-12"
  "1125x2436 iphone-13-mini-12-mini-x-xs"
  "750x1334  iphone-8-7-6"
  "2048x2732 ipad-pro-129"
  "1668x2388 ipad-pro-11"
  "1620x2160 ipad-mini"
)

if command -v magick >/dev/null 2>&1; then
  ICON_SIZE=384
  for entry in "${sizes[@]}"; do
    dim="${entry%% *}"
    label="${entry##* }"
    out="$OUT/splash-${label}.png"
    echo "  $dim  $out"
    magick -size "$dim" "xc:$BG" \
      \( "$SRC" -resize "${ICON_SIZE}x${ICON_SIZE}" \) \
      -gravity center -composite "$out"
  done
else
  echo "ImageMagick not found — generating icon-only splashes via sips."
  echo "Install ImageMagick for branded splashes: brew install imagemagick"
  for entry in "${sizes[@]}"; do
    dim="${entry%% *}"
    label="${entry##* }"
    w="${dim%x*}"
    h="${dim##*x}"
    out="$OUT/splash-${label}.png"
    cp "$SRC" "$out"
    sips -z "$h" "$w" "$out" --padToHeightWidth "$h" "$w" --padColor "$(echo $BG | sed 's/#//')" >/dev/null
    echo "  $dim  $out"
  done
fi

echo ""
echo "Generated $(ls $OUT/splash-*.png | wc -l | tr -d ' ') splash images in $OUT."
