import json
import os
import psycopg2

def get_db():
    return psycopg2.connect(os.environ['DATABASE_URL'])

HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-User-Id, X-Auth-Token, X-Session-Id',
    'Content-Type': 'application/json'
}

def handler(event: dict, context) -> dict:
    """CRUD для оценок учеников"""
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': HEADERS, 'body': ''}

    method = event.get('httpMethod', 'GET')
    params = event.get('queryStringParameters') or {}
    body = json.loads(event.get('body') or '{}')
    conn = get_db()
    cur = conn.cursor()

    if method == 'GET':
        student_id = params.get('student_id')
        subject_id = params.get('subject_id')
        class_id = params.get('class_id')

        if student_id and subject_id:
            cur.execute("""
                SELECT g.id, g.student_id, u.full_name, g.subject_id, s.name,
                       g.grade, g.note, g.grade_date
                FROM grades g
                JOIN users u ON g.student_id = u.id
                JOIN subjects s ON g.subject_id = s.id
                WHERE g.student_id=%s AND g.subject_id=%s
                ORDER BY g.grade_date DESC
            """, (student_id, subject_id))
        elif student_id:
            cur.execute("""
                SELECT g.id, g.student_id, u.full_name, g.subject_id, s.name,
                       g.grade, g.note, g.grade_date
                FROM grades g
                JOIN users u ON g.student_id = u.id
                JOIN subjects s ON g.subject_id = s.id
                WHERE g.student_id=%s
                ORDER BY g.grade_date DESC
            """, (student_id,))
        elif subject_id:
            cur.execute("""
                SELECT g.id, g.student_id, u.full_name, g.subject_id, s.name,
                       g.grade, g.note, g.grade_date
                FROM grades g
                JOIN users u ON g.student_id = u.id
                JOIN subjects s ON g.subject_id = s.id
                WHERE g.subject_id=%s
                ORDER BY u.full_name, g.grade_date DESC
            """, (subject_id,))
        elif class_id:
            cur.execute("""
                SELECT g.id, g.student_id, u.full_name, g.subject_id, s.name,
                       g.grade, g.note, g.grade_date
                FROM grades g
                JOIN users u ON g.student_id = u.id
                JOIN subjects s ON g.subject_id = s.id
                JOIN class_students cs ON cs.student_id = g.student_id
                WHERE cs.class_id=%s
                ORDER BY u.full_name, g.grade_date DESC
            """, (class_id,))
        else:
            cur.execute("""
                SELECT g.id, g.student_id, u.full_name, g.subject_id, s.name,
                       g.grade, g.note, g.grade_date
                FROM grades g
                JOIN users u ON g.student_id = u.id
                JOIN subjects s ON g.subject_id = s.id
                ORDER BY g.grade_date DESC
            """)

        rows = cur.fetchall()

        # Средний балл по ученику
        averages = {}
        if student_id:
            cur.execute("""
                SELECT g.subject_id, s.name, ROUND(AVG(g.grade)::numeric, 2)
                FROM grades g
                JOIN subjects s ON g.subject_id = s.id
                WHERE g.student_id=%s
                GROUP BY g.subject_id, s.name
            """, (student_id,))
            avg_rows = cur.fetchall()
            averages = {r[0]: {'subject_name': r[1], 'avg': float(r[2])} for r in avg_rows}

        conn.close()
        return {
            'statusCode': 200,
            'headers': HEADERS,
            'body': json.dumps({
                'grades': [{
                    'id': r[0], 'student_id': r[1], 'student_name': r[2],
                    'subject_id': r[3], 'subject_name': r[4],
                    'grade': r[5], 'note': r[6],
                    'grade_date': str(r[7])
                } for r in rows],
                'averages': averages
            })
        }

    if method == 'POST':
        student_id = body.get('student_id')
        subject_id = body.get('subject_id')
        grade = body.get('grade')
        note = body.get('note', '')
        grade_date = body.get('grade_date', '')

        if not all([student_id, subject_id, grade]):
            conn.close()
            return {'statusCode': 400, 'headers': HEADERS, 'body': json.dumps({'error': 'Укажите ученика, предмет и оценку'})}

        if grade_date:
            cur.execute(
                "INSERT INTO grades (student_id, subject_id, grade, note, grade_date) VALUES (%s,%s,%s,%s,%s) RETURNING id",
                (student_id, subject_id, grade, note, grade_date)
            )
        else:
            cur.execute(
                "INSERT INTO grades (student_id, subject_id, grade, note) VALUES (%s,%s,%s,%s) RETURNING id",
                (student_id, subject_id, grade, note)
            )

        grade_id = cur.fetchone()[0]
        conn.commit()
        conn.close()
        return {'statusCode': 200, 'headers': HEADERS, 'body': json.dumps({'id': grade_id})}

    if method == 'PUT':
        grade_id = body.get('id')
        grade = body.get('grade')
        note = body.get('note', '')
        grade_date = body.get('grade_date', '')
        if grade_date:
            cur.execute("UPDATE grades SET grade=%s, note=%s, grade_date=%s WHERE id=%s", (grade, note, grade_date, grade_id))
        else:
            cur.execute("UPDATE grades SET grade=%s, note=%s WHERE id=%s", (grade, note, grade_id))
        conn.commit()
        conn.close()
        return {'statusCode': 200, 'headers': HEADERS, 'body': json.dumps({'ok': True})}

    if method == 'DELETE':
        grade_id = params.get('id') or body.get('id')
        cur.execute("UPDATE grades SET student_id=NULL WHERE id=%s", (grade_id,))
        conn.commit()
        conn.close()
        return {'statusCode': 200, 'headers': HEADERS, 'body': json.dumps({'ok': True})}

    conn.close()
    return {'statusCode': 405, 'headers': HEADERS, 'body': json.dumps({'error': 'Method not allowed'})}
