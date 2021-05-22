# Importing the required libraries
import xml.etree.ElementTree as Xet
import requests
import os
from pprint import pprint

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

def submit(aResults):
    platformID = 1
    executionType = 2
    testPlanID = 2
    buildID = 1
    headers = {
        'Apikey': os.environ['APIKEY'],
        'Content-type': 'application/json'
    }
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
    pprint(items);
    submit(items);


if __name__ == "__main__":
    # calling main function
    main()
