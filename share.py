from shutil import copyfile, move, rmtree
from os import makedirs, path
import json

SRC_DIR = "./apps/"
DST_DIR = "../graasta.com/public/apps"

# which blocks and apps to process
app_blocks = [
   {
      "title": "Descriptive statistics and plots",
      "apps": ["asta-b101", "asta-b102"]
   }
]

# copy application files and create JSON with meta data
out = []
for block in app_blocks:

    apps = [];
    for app in block["apps"]:
        print(SRC_DIR + app)
        makedirs(path.join(SRC_DIR, app), exist_ok = True)
        copyfile(app + "/public/" + app + ".css", SRC_DIR + app + "/" + app + ".css")
        copyfile(app + "/public/" + app + ".js", SRC_DIR + app + "/" + app + ".js")
        copyfile(app + "/public/" + app + ".js.map", SRC_DIR + app + "/" + app + ".js.map")
        copyfile(app + "/public/" + "index.html", SRC_DIR + app + "/index.html")
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
if path.exists(DST_DIR):
    rmtree(DST_DIR)
move(SRC_DIR, DST_DIR)