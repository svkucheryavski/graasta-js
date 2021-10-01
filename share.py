from shutil import copyfile, move, rmtree
import subprocess
import json
import os

SRC_DIR = "./apps/"
DST_DIR = "../graasta.web.static/public/apps"

# which blocks and apps to process
app_blocks = [
   {
      "title": "Descriptive statistics and plots",
      "apps": ["asta-b101", "asta-b102", "asta-b103"]
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
        copyfile(app + "/public/" + app + ".js.map", SRC_DIR + app + "/" + app + ".js.map")
        copyfile(app + "/public/" + "index.html", SRC_DIR + app + "/index.html")

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