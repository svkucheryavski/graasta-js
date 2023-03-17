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
      "title": "Covariance and regression",
      "apps": ["asta-b301", "asta-b302", "asta-b303", "asta-b304", "asta-b305", "asta-b306", "asta-b307", "asta-b308", "asta-b309"]
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

        # copy the javascript file
        os.makedirs(os.path.join(SRC_DIR, app), exist_ok = True)
        copyfile(app + "/dist/" + app + ".js", SRC_DIR + app + "/" + app + ".js")

        # create HTML file
        f = open(SRC_DIR + app + "/index.html", "w")
        f.write(f"""
<!DOCTYPE html>
<html lang='en'>
<head>
	<meta charset='utf-8'>
	<meta name='viewport' content='width=device-width,initial-scale=1'>
	<title>graasta | {app}</title>

	<script defer type='module' src='{app}.js'></script>

   <style>
      html, body {{
        font-size: 12px;
        height: 100%;
        width: 100%;
        padding: 0;
        margin: 0;
      }}

      @media (min-width: 960px) and (min-height: 540px) {{
        html, body {{
            font-size: 14px;
        }}
      }}

      @media (min-width: 1200px) and (min-height: 675px) {{
        html, body {{
            font-size: 16px;
        }}
      }}
   </style>
</head>

<body>
   <div id='graasta-app-container'></div>
</body>
</html>
        """)
        f.close()

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