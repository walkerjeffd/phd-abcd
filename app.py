from flask import Flask, render_template, url_for
from flask.ext.frozen import Freezer
import sys

# flask config
DEBUG = True

# create app
app = Flask(__name__)
app.config.from_object(__name__)

# create freezer
freezer = Freezer(app)

# add views
@app.route('/')
def index():
    return render_template('index.html')

@app.route('/theory.html')
def theory():
    return render_template('theory.html')

@app.route('/datasets.html')
def datasets():
    return render_template('datasets.html')

@app.route('/simulation.html')
def simulation():
    return render_template('simulation.html')

@app.route('/calibration.html')
def calibration():
    return render_template('calibration.html')

@app.route('/montecarlo.html')
def montecarlo():
    return render_template('montecarlo.html')

if __name__ == '__main__':
    if len(sys.argv) > 1 and sys.argv[1] == 'build':
        freezer.freeze()
    else:
        app.run()