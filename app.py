
import os
import random
import time
from flask import Flask, render_template, jsonify, request
from flask_sqlalchemy import SQLAlchemy

app = Flask(__name__)

# Konfigurasi database
db_user = os.environ.get('MYSQL_USER')
db_password = os.environ.get('MYSQL_PASSWORD')
db_host = os.environ.get('MYSQL_HOST')
db_name = os.environ.get('MYSQL_DB')

app.config['SQLALCHEMY_DATABASE_URI'] = f'mysql+mysqlconnector://{db_user}:{db_password}@{db_host}/{db_name}'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

# Model untuk tabel leaderboard
class Leaderboard(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(80), nullable=False)
    wins = db.Column(db.Integer, default=1)

    def __repr__(self):
        return f'<Player {self.name}>'

# Route untuk halaman utama
@app.route('/')
def index():
    return render_template('index.html')

# Route untuk halaman leaderboard
@app.route('/leaderboard')
def get_leaderboard():
    players = Leaderboard.query.order_by(Leaderboard.wins.desc()).all()
    return render_template('leaderboard.html', players=players)

import time

# API untuk mendapatkan soal matematika baru
@app.route('/question')
def get_question():
    ops = ['+', '-', '*', '/']
    operator = random.choice(ops)
    num1 = random.randint(1, 20)
    num2 = random.randint(1, 10)

    if operator == '+':
        answer = num1 + num2
        question = f'{num1} + {num2}'
    elif operator == '-':
        # Pastikan hasil tidak negatif
        if num1 < num2:
            num1, num2 = num2, num1
        answer = num1 - num2
        question = f'{num1} - {num2}'
    elif operator == '*':
        num1 = random.randint(1, 10) # Perkalian dengan angka lebih kecil
        num2 = random.randint(1, 10)
        answer = num1 * num2
        question = f'{num1} x {num2}'
    else: # operator == '/'
        # Pastikan hasil adalah integer
        divisor = random.randint(2, 10)
        answer = random.randint(2, 10)
        dividend = divisor * answer
        question = f'{dividend} / {divisor}'
        num1, num2 = dividend, divisor

    # Buat satu jawaban salah
    wrong_answer = answer + random.randint(-5, 5)
    if wrong_answer == answer:
        wrong_answer += 1

    # Acak posisi jawaban
    answers = [answer, wrong_answer]
    random.shuffle(answers)

    time.sleep(0.5)

    return jsonify({
        'question': question,
        'answers': answers,
        'correct': answer
    })

# API untuk mencatat pemenang
@app.route('/winner', methods=['POST'])
def add_winner():
    data = request.get_json()
    winner_name = data.get('winner')

    if not winner_name:
        return jsonify({'error': 'Nama pemenang tidak boleh kosong'}), 400

    player = Leaderboard.query.filter_by(name=winner_name).first()

    if player:
        player.wins += 1
    else:
        player = Leaderboard(name=winner_name, wins=1)
        db.session.add(player)
    
    db.session.commit()
    return jsonify({'message': f'Pemenang {winner_name} berhasil dicatat!'})

# Inisialisasi database
with app.app_context():
    db.create_all()

if __name__ == '__main__':
    app.run(host='0.0.0.0')
