#!/usr/bin/env bash

DRY_RUN=yes
test "$1" == "-f" && DRY_RUN=no

set -e

function img_file_for_res() {
  echo $(dirname $1)/$2/$(basename $1)
}

RES="1920 1600 1280 960 640 320"

for album in $(find images/albums -type d -depth 1 -not -regex '.*/[0-9]*/.*'); do
  for img in $(find $album -type f -depth 1 -name '*.jpg' -not -regex '.*/[0-9]*/.*'); do
    can_skip=yes
    for res in $RES; do
      test -f $(img_file_for_res $img $res) || can_skip=no
      mkdir -p $(dirname $img)/$res
    done

    test "$can_skip" == "yes" && echo "Already resized $img into $RES" && continue

    msg="Resizing $img into $RES"
    if [ "$DRY_RUN" == "no" ]; then
      echo -n "$msg..."
      $SHELL -c "convert $img $(for res in $RES; do echo -n "\\( -clone 0 -resize ${res}x -sharpen 0x1.0 -write $(img_file_for_res $img $res) \\) "; done) null:"
      echo "done!"
    else
      echo "[DRY RUN] $msg"
    fi
  done

  if [ "$DRY_RUN" == "no" ]; then
    for res in $RES; do
      echo "Minifying $album/$res"
      imagemin $album/$res/* --out-dir $album/$res/minified # this will strip out exif data, nice!
      mv $album/$res/minified/* $album/$res/
      rmdir $album/$res/minified
    done
  fi
done

test "$DRY_RUN" == "yes" && echo "-f to apply"
