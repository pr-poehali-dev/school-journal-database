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
    """CRUD для классов и предметов школьного журнала"""
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': HEADERS, 'body': ''}

    method = event.get('httpMethod', 'GET')
    params = event.get('queryStringParameters') or {}
    body = json.loads(event.get('body') or '{}')
    entity = params.get('entity') or body.get('entity', 'class')

    conn = get_db()
    cur = conn.cursor()

    # ========== SUBJECTS ==========
    if entity == 'subject':
        if method == 'GET':
            class_id = params.get('class_id')
            if class_id:
                cur.execute("SELECT id, name, class_id, teacher_id FROM subjects WHERE class_id=%s ORDER BY name", (class_id,))
            else:
                cur.execute("SELECT id, name, class_id, teacher_id FROM subjects ORDER BY name")
            rows = cur.fetchall()
            conn.close()
            return {'statusCode': 200, 'headers': HEADERS, 'body': json.dumps([{'id': r[0], 'name': r[1], 'class_id': r[2], 'teacher_id': r[3]} for r in rows])}

        if method == 'POST':
            name = body.get('name', '').strip()
            class_id = body.get('class_id')
            teacher_id = body.get('teacher_id')
            if not name or not class_id:
                conn.close()
                return {'statusCode': 400, 'headers': HEADERS, 'body': json.dumps({'error': 'Укажите название предмета и класс'})}
            cur.execute("INSERT INTO subjects (name, class_id, teacher_id) VALUES (%s,%s,%s) RETURNING id", (name, class_id, teacher_id))
            subject_id = cur.fetchone()[0]
            conn.commit()
            conn.close()
            return {'statusCode': 200, 'headers': HEADERS, 'body': json.dumps({'id': subject_id, 'name': name})}

        if method == 'PUT':
            subject_id = body.get('id')
            name = body.get('name', '').strip()
            teacher_id = body.get('teacher_id')
            cur.execute("UPDATE subjects SET name=%s, teacher_id=%s WHERE id=%s", (name, teacher_id, subject_id))
            conn.commit()
            conn.close()
            return {'statusCode': 200, 'headers': HEADERS, 'body': json.dumps({'ok': True})}

        if method == 'DELETE':
            subject_id = params.get('id') or body.get('id')
            cur.execute("UPDATE grades SET subject_id=NULL WHERE subject_id=%s", (subject_id,))
            cur.execute("UPDATE schedule SET subject_id=NULL WHERE subject_id=%s", (subject_id,))
            cur.execute("UPDATE subjects SET class_id=NULL WHERE id=%s", (subject_id,))
            conn.commit()
            conn.close()
            return {'statusCode': 200, 'headers': HEADERS, 'body': json.dumps({'ok': True})}

    # ========== CLASSES ==========
    if method == 'GET':
        cur.execute("""
            SELECT c.id, c.name, c.teacher_id, u.full_name as teacher_name,
                   COUNT(cs.student_id) as student_count
            FROM classes c
            LEFT JOIN users u ON c.teacher_id=u.id
            LEFT JOIN class_students cs ON c.id=cs.class_id
            WHERE c.name NOT LIKE '%%_archived'
            GROUP BY c.id, c.name, c.teacher_id, u.full_name
            ORDER BY c.name
        """)
        rows = cur.fetchall()
        conn.close()
        return {'statusCode': 200, 'headers': HEADERS, 'body': json.dumps([{'id': r[0], 'name': r[1], 'teacher_id': r[2], 'teacher_name': r[3], 'student_count': r[4]} for r in rows])}

    if method == 'POST':
        name = body.get('name', '').strip()
        teacher_id = body.get('teacher_id')
        if not name:
            conn.close()
            return {'statusCode': 400, 'headers': HEADERS, 'body': json.dumps({'error': 'Укажите название класса'})}
        cur.execute("INSERT INTO classes (name, teacher_id) VALUES (%s,%s) RETURNING id", (name, teacher_id))
        class_id = cur.fetchone()[0]
        conn.commit()
        conn.close()
        return {'statusCode': 200, 'headers': HEADERS, 'body': json.dumps({'id': class_id, 'name': name})}

    if method == 'PUT':
        class_id = body.get('id')
        name = body.get('name', '').strip()
        teacher_id = body.get('teacher_id')
        cur.execute("UPDATE classes SET name=%s, teacher_id=%s WHERE id=%s", (name, teacher_id, class_id))
        conn.commit()
        conn.close()
        return {'statusCode': 200, 'headers': HEADERS, 'body': json.dumps({'ok': True})}

    if method == 'DELETE':
        class_id = params.get('id') or body.get('id')
        cur.execute("UPDATE grades SET subject_id=NULL WHERE subject_id IN (SELECT id FROM subjects WHERE class_id=%s)", (class_id,))
        cur.execute("UPDATE schedule SET subject_id=NULL WHERE subject_id IN (SELECT id FROM subjects WHERE class_id=%s)", (class_id,))
        cur.execute("UPDATE subjects SET class_id=NULL WHERE class_id=%s", (class_id,))
        cur.execute("UPDATE class_students SET class_id=NULL WHERE class_id=%s", (class_id,))
        cur.execute("UPDATE classes SET teacher_id=NULL WHERE id=%s", (class_id,))
        cur.execute("UPDATE classes SET name=CONCAT(name,'_archived') WHERE id=%s", (class_id,))
        conn.commit()
        conn.close()
        return {'statusCode': 200, 'headers': HEADERS, 'body': json.dumps({'ok': True})}

    conn.close()
    return {'statusCode': 405, 'headers': HEADERS, 'body': json.dumps({'error': 'Method not allowed'})}
