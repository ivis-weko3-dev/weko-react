#!/usr/bin/env bash

# quit on errors and unbound symbols:
set -o errexit

CURRENT_DIR=$(cd $(dirname $0); pwd)

# build-begin
while read dir
do
    ( cd "${CURRENT_DIR}/$dir"; npm install )
    ( cd "${CURRENT_DIR}/$dir"; npm run build )
done <<END
app-author-import
app-facet-search
END
# build-end
