#!/usr/bin/env bash

DRY_RUN=yes
ALL=no

while getopts "fa" OPTION
do
  case $OPTION in
    f)
      DRY_RUN=no
      ;;
    a)
      ALL=yes
      ;;
    f)
  esac
done

set -e

function img_file_for_res() {
  echo $(dirname $1)/$2/$(basename $1)
}

RES="3200 2880 2560 2240 1920 1600 1280 960 640 320"

for album in $(find images/albums -type d -depth 1 -not -regex '.*/[0-9]*/.*'); do
  for img in $(find $album -type f -depth 1 -name '*.jpg' -not -regex '.*/[0-9]*/.*'); do
    include_res=""
    skip_res=""
    for res in $RES; do
      mkdir -p $(dirname $img)/$res
      if [ -f $(img_file_for_res $img $res) ]; then
        skip_res="$skip_res $res"
      else
        include_res="$include_res $res"
      fi
    done

    if [ "$ALL" == "yes" ]; then
      include_res="$RES"
      skip_res=""
    fi

    if [ "$skip_res" == " $RES" ]; then
      echo "Already resized $img into $RES"
      continue
    fi

    msg="Resizing $img into $include_res"
    if [ "$DRY_RUN" == "no" ]; then
      echo -n "$msg..."
      $SHELL -c "convert $img $(for res in $include_res; do echo -n "\\( -clone 0 -resize ${res}x -sharpen 0x1.0 -write $(img_file_for_res $img $res) \\) "; done) null:"
      echo "done!"
    else
      echo "[DRY RUN] $msg"
    fi
  done

  if [ "$DRY_RUN" == "no" ]; then
    for res in $include_res; do
      echo "Minifying $album/$res"
      imagemin $album/$res/* --out-dir $album/$res/minified # this will strip out exif data, nice!
      mv $album/$res/minified/* $album/$res/
      rmdir $album/$res/minified
    done
  fi
done

if [ "$DRY_RUN" == "yes" ]; then
  echo "-f to apply"
fi
