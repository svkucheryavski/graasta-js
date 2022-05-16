"""
This script builds the selected apps and copy
"""

from shutil import copyfile, move, rmtree, make_archive
import subprocess
import json
import os

SRC_DIR = "./apps/"
DST_DIR = "../graasta-web-static/public/apps"

# which blocks and apps to process
app_blocks = [
   {
      "title": "Descriptive statistics and plots",
      "apps": ["asta-b101", "asta-b102", "asta-b103", "asta-b104"]
   },
   {
      "title": "Confidence intervals",
      "apps": ["asta-b201", "asta-b202", "asta-b203", "asta-b204"]
   },
   {
      "title": "Hypothesis testing",
      "apps": ["asta-b205", "asta-b206", "asta-b207", "asta-b208"]
   },
   {
      "title": "Comparing means",
      "apps": ["asta-b209", "asta-b210", "asta-b211", "asta-b212"]
   },
   {
      "title": "Relationship between two variables",
      "apps": ["asta-b301", "asta-b302", "asta-b303", "asta-b304", "asta-b305"]
   }
]

# copy application files and create JSON with meta data
out = []
wd = os.getcwd()
print(wd)
for block in app_blocks:

    apps = [];
    for app in block["apps"]:
        print(SRC_DIR + app)

        # build the app
        os.chdir(app)
        subprocess.call("npm run build", shell=True)
        os.chdir(wd)

        # copy the files
        os.makedirs(os.path.join(SRC_DIR, app), exist_ok = True)
        copyfile(app + "/public/" + app + ".css", SRC_DIR + app + "/" + app + ".css")
        copyfile(app + "/public/" + app + ".js", SRC_DIR + app + "/" + app + ".js")
        copyfile(app + "/public/" + "index.html", SRC_DIR + app + "/index.html")

        # make archive
        make_archive(SRC_DIR + app, 'zip', SRC_DIR + app)

        # add app info into json
        app_info = json.load(open(app + "/info.json"))
        apps.append(app_info)

    out.append(
        {
            "title": block["title"],
            "apps": apps
        }
    )

# save the app info as JSON object into js file
with open(SRC_DIR + "apps.js", 'w') as outfile:
    outfile.write("const appBlocks = " + json.dumps(out) + "; export default appBlocks;")

# move everything to graasta.com repository
if os.path.exists(DST_DIR):
    rmtree(DST_DIR)
move(SRC_DIR, DST_DIR)