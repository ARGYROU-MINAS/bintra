#!/usr/bin/env python3

from common import *

import sys
import os
import pprint

# main function
def main(lines):
    rf = getRootFolder()
    print('Root folder is', rf, file=sys.stderr)

    tagLatest = getLatestTag()
    tagPrev = getPreviousTag(tagLatest)
    for line in lines:
        localRef, localSha, remoteRef, remoteSha = line.strip().split(' ')
        print('Did read line', localRef, ' and', remoteRef, file=sys.stderr)
        newTag = getTag(localRef)
        print('Tag found is', newTag, file=sys.stderr)
        if newTag is None:
            print('Not a tag push', file=sys.stderr)
            sys.exit(0)
        else:
            if not compareTags(tagPrev, tagLatest):
                print('Failed monotone version increase', file=sys.stderr)
                sys.exit(1)

            if not checkVersions(rf, newTag):
                print('Failed pre conditions', file=sys.stderr)
                sys.exit(1)


if __name__ == '__main__':
    print('Number of arguments', len(sys.argv), file=sys.stderr)
    argRemote = sys.argv[1]
    argUrl = sys.argv[2]
    print('Arguments', argRemote, argUrl, file=sys.stderr)
    main(sys.stdin)

