#!/bin/bash

VERSION=$1
echo $VERSION

sed -i -E 's/("version": ").*",/\1'$VERSION'",/' package.json
sed -i -E 's/(sonar.projectVersion=).*/\1'$VERSION'/' sonar-project.properties
sed -i -E 's/(\s+version: ).*/\1'$VERSION'/' api/swagger.yaml
sed -i -E 's/(.*:bintra:)[^:]+(:.*)/\1'$VERSION'\2/' VERSION.cpe
