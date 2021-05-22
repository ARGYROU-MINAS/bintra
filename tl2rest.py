# Importing the required libraries
import xml.etree.ElementTree as Xet
import requests
import os
import datetime
from pprint import pprint

headers = {
    'Apikey': os.environ['APIKEY'],
    'Content-type': 'application/json'
}
buildID=0
dtnow=datetime.datetime.now()
dtstring=dtnow.strftime("%d/%m/%Y %H:%M:%S")
dtreleasedate=dtnow.strftime("%Y-%m-%d")

def parseXML(xmlfile):
    reqitems = []
    # Parsing the XML file
    xmlparse = Xet.parse(xmlfile)
    root = xmlparse.getroot()

    for item in root.findall('./testcase'):
        package = {}
        tcid = item.get('external_id')
        package['tcid'] = tcid
        package['result'] = item.find('./result').text
        package['notes'] = item.find('./notes').text
        reqitems.append(package)
    return reqitems

def updateBuild(aItems):
    global buildID

    tpapikey = os.environ['TPAPIKEY']
    currenttag = os.environ['TAGSHORT']
    r = requests.get("https://testlink.kretschmann.software/lib/api/rest/v3/testplans/" + tpapikey + "/builds", headers=headers)
    j = r.json()
    pprint(j)
    isNewTag = True
    for i in j['items']:
        build = j['items'][i]
        pprint(build)
        buildname = build['name']
        if (buildname == currenttag):
            print("Found existing tag in build #", i)
            buildID = i
            isNewTag = False

    if isNewTag:
        print("Create new build")
        payload = {
            "name": os.environ['TAGSHORT'],
            "testplan": 2,
            "commit_id": os.environ['COMMIT_ID'],
            "tag": os.environ['TAGFULL'],
            "branch": "master",
            "release_date": dtreleasedate,
            "notes": "Created build at " +dtstring
        }
        r = requests.post("https://testlink.kretschmann.software/lib/api/rest/v3/builds", json=payload, headers=headers)
        print("result", r.text)
        buildID = r.json()['id']
    else:
        print("Update existing build")
        payload = {
            "commit_id": os.environ['COMMIT_ID'],
            "name": os.environ['TAGSHORT'],
            "tag": os.environ['TAGFULL'],
            "notes": "Updated build at " + dtstring
        }
        r = requests.put("https://testlink.kretschmann.software/lib/api/rest/v3/builds/"+buildID, json=payload, headers=headers)
        print("result", r.text)

def submit(aResults):
    platformID = 1
    executionType = 2
    testPlanID = 2
    for r in aResults:
        print("submit", r['tcid']);
        payload = {
            "platformID": platformID,
            "executionType": executionType,
            "testPlanID": testPlanID,
            "buildID": buildID,
            "statusCode": r['result'].lower(),
            "notes": r['notes'],
            "testCaseExternalID": r['tcid']
        }
        pprint(payload)
        r = requests.post("https://testlink.kretschmann.software/lib/api/rest/v3/executions", json=payload, headers=headers)
        print("result", r.text)


def main():
    items = parseXML('testlink.xml')
    updateBuild(items);
    submit(items);


if __name__ == "__main__":
    # calling main function
    main()
