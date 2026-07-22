from flask import Flask, render_template, request, jsonify, send_file
import sqlite3
import base64
import os
from io import BytesIO
from PIL import Image

app = Flask(__name__)

UPLOAD_FOLDER = "uploads"

os.makedirs(UPLOAD_FOLDER, exist_ok=True)


def db():

    conn = sqlite3.connect("database.db")
    conn.row_factory = sqlite3.Row
    return conn


def create_tables():

    conn = db()

    conn.execute("""

    CREATE TABLE IF NOT EXISTS projects(

        id INTEGER PRIMARY KEY AUTOINCREMENT,

        name TEXT,

        image TEXT

    )

    """)

    conn.commit()

    conn.close()


create_tables()


@app.route("/")

def home():

    return render_template("index.html")


@app.route("/save", methods=["POST"])

def save():

    data = request.json

    name = data["name"]

    image = data["image"]

    conn = db()

    conn.execute(

        "INSERT INTO projects(name,image) VALUES(?,?)",

        (name, image)

    )

    conn.commit()

    conn.close()

    return jsonify({"status": "saved"})


@app.route("/projects")

def projects():

    conn = db()

    rows = conn.execute(

        "SELECT * FROM projects ORDER BY id DESC"

    ).fetchall()

    conn.close()

    return jsonify([dict(r) for r in rows])


@app.route("/project/<int:id>")

def project(id):

    conn = db()

    row = conn.execute(

        "SELECT * FROM projects WHERE id=?",

        (id,)

    ).fetchone()

    conn.close()

    return jsonify(dict(row))


@app.route("/delete/<int:id>", methods=["DELETE"])

def delete(id):

    conn = db()

    conn.execute(

        "DELETE FROM projects WHERE id=?",

        (id,)

    )

    conn.commit()

    conn.close()

    return jsonify({"deleted": True})


if __name__ == "__main__":

    app.run(debug=True)