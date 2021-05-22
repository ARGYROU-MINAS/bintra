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

def parse_xml(xmlfile):
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

def update_build(aitems):
    global buildID

    tpapikey = os.environ['TPAPIKEY']
    currenttag = os.environ['TAGSHORT']
    r = requests.get("https://testlink.kretschmann.software/lib/api/rest/v3/testplans/" + tpapikey + "/builds", headers=headers)
    j = r.json()
    pprint(j)
    is_new_tag = True
    for i in j['items']:
        build = j['items'][i]
        pprint(build)
        buildname = build['name']
        if (buildname == currenttag):
            print("Found existing tag in build #", i)
            buildID = i
            is_new_tag = False

    if is_new_tag:
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

def submit(aresults):
    platform_id = 1
    execution_type = 2
    testplan_id = 2
    for r in aresults:
        print("submit", r['tcid']);
        payload = {
            "platformID": platform_id,
            "executionType": execution_type,
            "testPlanID": testplan_id,
            "buildID": buildID,
            "statusCode": r['result'].lower(),
            "notes": r['notes'],
            "testCaseExternalID": r['tcid']
        }
        pprint(payload)
        r = requests.post("https://testlink.kretschmann.software/lib/api/rest/v3/executions", json=payload, headers=headers)
        print("result", r.text)


def main():
    items = parse_xml('testlink.xml')
    update_build(items);
    submit(items);


if __name__ == "__main__":
    # calling main function
    main()
