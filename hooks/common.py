#!/usr/bin/env python3

import sys
import re
import yaml
import json
import configparser
import pprint
import subprocess
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
VERSIONS_RE = re.compile(r"^(?P<major>\d+)\.(?P<minor>\d+)\.(?P<patch>\d+)$")

def getRootFolder():
    result = subprocess.run(["git", "rev-parse", "--show-toplevel"], stdout=subprocess.PIPE)
    s = result.stdout.decode('utf-8').strip()
    return s

def getLatestTag():
    result = subprocess.run(["git", "describe", "--tags", "--abbrev=0"], stdout=subprocess.PIPE)
    s = result.stdout.decode('utf-8').strip()
    pprint.pprint(s, sys.stderr)
    return s

def getPreviousTag(newTag):
    result = subprocess.run(["git", "describe", "--abbrev=0", newTag+"^"], stdout=subprocess.PIPE)
    s = result.stdout.decode('utf-8').strip()
    pprint.pprint(s, sys.stderr)
    return s

# parse Tag/Version out of ref string
def getTag(ref):
    p = TAGREF_RE
    _ = p.search(ref.strip())
    if not _:
        print('No RE match for tags', file=sys.stderr)
        return (None)
    name = (_.group('tag') or '').strip()
    return (name)

def compareTags(tagPrev, tagNow):
    p = VERSIONS_RE

    _ = p.search(tagPrev)
    if not _:
        print('No RE match for tagPrev', file=sys.stderr)
        return False
    prevMajor = int(_.group('major'))
    prevMinor = int(_.group('minor'))
    prevPatch = int(_.group('patch'))

    _ = p.search(tagNow)
    if not _:
        print('No RE match for tagNow', file=sys.stderr)
        return False
    nowMajor = int(_.group('major'))
    nowMinor = int(_.group('minor'))
    nowPatch = int(_.group('patch'))

    print(prevMajor, prevMinor, prevPatch, " -> ", nowMajor, nowMinor, nowPatch, file=sys.stderr)
    # now check all possible increments
    if prevMajor == nowMajor:
        if prevMinor == nowMinor:
            if prevPatch + 1 == nowPatch:
                return True
            else:
                print('Patch increment wrong', file=sys.stderr)
                return False
        else:
            if prevMinor + 1 == nowMinor:
                if nowPatch == 0:
                    return True
                else:
                    print('Patch should be zero on minor increment', file=sys.stderr)
                    return False
            else:
                print('Minor increment wrong', file=sys.stderr)
                return False
    else:
        if prevMajor + 1 == nowMajor:
            if nowMinor == 0 and nowPatch == 0:
                return True
            else:
                print('Minor and patch should be zero on major increment', file=sys.stderr)
                return False
        else:
            print('Major increment wrong', file=sys.stderr)
            return False
                
                

    return False

def checkVersionPackage(rf, v):
    cv = ''
    b =  True
    with open(rf + '/package.json') as json_file:
        data = json.load(json_file)
        cv = data['version']
        if cv != v:
            b = False
    return b, cv

def checkVersionSonar(rf, v):
    cv = ''
    b =  True
    txt = "[SONA]\n" + Path(rf + '/sonar-project.properties').read_text()
    config = configparser.ConfigParser()
    config.read_string(txt)
    cv = config['SONA']['sonar.projectVersion']
    if cv != v:
        b = False
    return b, cv

def checkVersionSwagger(rf, v):
    cv = ''
    b =  True
    with open(rf + "/api/swagger.yaml", "r") as stream:
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
def checkVersions(rf, v):
    b1, v1 = checkVersionPackage(rf, v)
    b2, v2 = checkVersionSonar(rf, v)
    b3, v3 = checkVersionSwagger(rf, v)
    if not b1:
        print('package.json contains wrong version', v1, file=sys.stderr)
    if not b2:
        print('sonar-project.properties contains wrong version', v2, file=sys.stderr)
    if not b3:
        print('api/swagger.yaml contains wrong version', v3, file=sys.stderr)
    return (b1 and b2 and b3)



