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

DAYS = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье']

def handler(event: dict, context) -> dict:
    """CRUD для расписания уроков"""
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': HEADERS, 'body': ''}

    method = event.get('httpMethod', 'GET')
    params = event.get('queryStringParameters') or {}
    body = json.loads(event.get('body') or '{}')
    conn = get_db()
    cur = conn.cursor()

    if method == 'GET':
        class_id = params.get('class_id')
        student_id = params.get('student_id')

        if student_id:
            cur.execute("""
                SELECT sc.id, sc.class_id, sc.subject_id, s.name as subject_name,
                       sc.day_of_week, sc.lesson_number, sc.start_time, sc.end_time, sc.lesson_topic
                FROM schedule sc
                JOIN subjects s ON sc.subject_id = s.id
                JOIN class_students cs ON cs.class_id = sc.class_id
                WHERE cs.student_id = %s
                ORDER BY sc.day_of_week, sc.lesson_number
            """, (student_id,))
        elif class_id:
            cur.execute("""
                SELECT sc.id, sc.class_id, sc.subject_id, s.name as subject_name,
                       sc.day_of_week, sc.lesson_number, sc.start_time, sc.end_time, sc.lesson_topic
                FROM schedule sc
                JOIN subjects s ON sc.subject_id = s.id
                WHERE sc.class_id = %s
                ORDER BY sc.day_of_week, sc.lesson_number
            """, (class_id,))
        else:
            cur.execute("""
                SELECT sc.id, sc.class_id, sc.subject_id, s.name as subject_name,
                       sc.day_of_week, sc.lesson_number, sc.start_time, sc.end_time, sc.lesson_topic
                FROM schedule sc
                JOIN subjects s ON sc.subject_id = s.id
                ORDER BY sc.day_of_week, sc.lesson_number
            """)

        rows = cur.fetchall()
        conn.close()
        return {
            'statusCode': 200,
            'headers': HEADERS,
            'body': json.dumps([{
                'id': r[0], 'class_id': r[1], 'subject_id': r[2],
                'subject_name': r[3], 'day_of_week': r[4],
                'day_name': DAYS[r[4]-1] if 1 <= r[4] <= 7 else '',
                'lesson_number': r[5], 'start_time': r[6], 'end_time': r[7],
                'lesson_topic': r[8] or ''
            } for r in rows])
        }

    if method == 'POST':
        class_id = body.get('class_id')
        subject_id = body.get('subject_id')
        day_of_week = body.get('day_of_week')
        lesson_number = body.get('lesson_number')
        start_time = body.get('start_time', '')
        end_time = body.get('end_time', '')
        lesson_topic = body.get('lesson_topic', '')

        if not all([class_id, subject_id, day_of_week, lesson_number]):
            conn.close()
            return {'statusCode': 400, 'headers': HEADERS, 'body': json.dumps({'error': 'Заполните все поля'})}

        cur.execute(
            "INSERT INTO schedule (class_id, subject_id, day_of_week, lesson_number, start_time, end_time, lesson_topic) VALUES (%s,%s,%s,%s,%s,%s,%s) RETURNING id",
            (class_id, subject_id, day_of_week, lesson_number, start_time, end_time, lesson_topic)
        )
        schedule_id = cur.fetchone()[0]
        conn.commit()
        conn.close()
        return {'statusCode': 200, 'headers': HEADERS, 'body': json.dumps({'id': schedule_id})}

    if method == 'PUT':
        schedule_id = body.get('id')
        subject_id = body.get('subject_id')
        day_of_week = body.get('day_of_week')
        lesson_number = body.get('lesson_number')
        start_time = body.get('start_time', '')
        end_time = body.get('end_time', '')
        lesson_topic = body.get('lesson_topic', '')
        cur.execute(
            "UPDATE schedule SET subject_id=%s, day_of_week=%s, lesson_number=%s, start_time=%s, end_time=%s, lesson_topic=%s WHERE id=%s",
            (subject_id, day_of_week, lesson_number, start_time, end_time, lesson_topic, schedule_id)
        )
        conn.commit()
        conn.close()
        return {'statusCode': 200, 'headers': HEADERS, 'body': json.dumps({'ok': True})}

    if method == 'DELETE':
        schedule_id = params.get('id') or body.get('id')
        cur.execute("UPDATE schedule SET class_id=NULL WHERE id=%s", (schedule_id,))
        conn.commit()
        conn.close()
        return {'statusCode': 200, 'headers': HEADERS, 'body': json.dumps({'ok': True})}

    conn.close()
    return {'statusCode': 405, 'headers': HEADERS, 'body': json.dumps({'error': 'Method not allowed'})}