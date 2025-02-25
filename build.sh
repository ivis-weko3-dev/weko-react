#!/usr/bin/env bash

# quit on errors and unbound symbols:
set -o errexit

CURRENT_DIR=$(cd $(dirname $0); pwd)

# build-begin
while read dir
do
    ( cd "$dir"; npm install )
    ( cd "$dir"; npm run build )
done <<END
app-author-export
app-author-import
app-facet-search
END
# build-end
