#!/usr/bin/env python3

import sys
import re
import yaml
import json
import configparser
import pprint
from pathlib import Path

# An example hook script to verify what is about to be pushed.  Called by "git
# push" after it has checked the remote status, but before anything has been
# pushed.  If this script exits with a non-zero status nothing will be pushed.
#
# This hook is called with the following parameters:
#
# $1 -- Name of the remote to which the push is being done
# $2 -- URL to which the push is being done
#
# If pushing without using a named remote those arguments will be equal.
#
# Information about the commits which are being pushed is supplied as lines to
# the standard input in the form:
#
#   <local ref> <local sha1> <remote ref> <remote sha1>
#

# constant regular exprressions
TAGREF_RE = re.compile(r"^refs/tags/(?P<tag>.*)$")


# parse Tag/Version out of ref string
def getTag(ref):
    p = TAGREF_RE
    _ = p.search(ref.strip())
    if not _:
        print('No RE match for tags', file=sys.stderr)
        return (None)
    name = (_.group('tag') or '').strip()
    return (name)

def checkVersionPackage(v):
    cv = ''
    b =  True
    with open('package.json') as json_file:
        data = json.load(json_file)
        cv = data['version']
        if cv != v:
            b = False
    return b, cv

def checkVersionSonar(v):
    cv = ''
    b =  True
    txt = "[SONA]\n" + Path('sonar-project.properties').read_text()
    config = configparser.ConfigParser()
    config.read_string(txt)
    cv = config['SONA']['sonar.projectVersion']
    if cv != v:
        b = False
    return b, cv

def checkVersionSwagger(v):
    cv = ''
    b =  True
    with open("api/swagger.yaml", "r") as stream:
        try:
            o = yaml.safe_load(stream)
            #pprint.pprint(o['info']['version'], sys.stderr)
            cv = o['info']['version']
            if cv != v:
                b = False
        except yaml.YAMLError as exc:
            print(exc, file=sys.stderr)
            b = False
    return b, cv

# search for given version in several files
# - package.json: version
# - sonar-project.properties: sonar.projectVersion
# - api/swagger.yaml: info.version
def checkVersions(v):
    b1, v1 = checkVersionPackage(v)
    b2, v2 = checkVersionSonar(v)
    b3, v3 = checkVersionSwagger(v)
    if not b1:
        print('package.json contains wrong version', v1, file=sys.stderr)
    if not b2:
        print('sonar-project.properties contains wrong version', v2, file=sys.stderr)
    if not b3:
        print('api/swagger.yaml contains wrong version', v3, file=sys.stderr)
    return (b1 and b2 and b3)


# main function
def main(lines):
    for line in lines:
        localRef, localSha, remoteRef, remoteSha = line.strip().split(' ')
        #print('Did read line', localRef, ' and', remoteRef, file=sys.stderr)
        newTag = getTag(localRef)
        print('Tag found is', newTag, file=sys.stderr)
        b = checkVersions(newTag)
        if not b:
            print('Failed pre conditions', file=sys.stderr)
            sys.exit(1)


if __name__ == '__main__':
    #print('Number of arguments', len(sys.argv), file=sys.stderr)
    argRemote = sys.argv[1]
    argUrl = sys.argv[2]
    main(sys.stdin)
    sys.exit(1)
