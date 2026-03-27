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
    """Аутентификация и управление пользователями школьного журнала"""
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': HEADERS, 'body': ''}

    method = event.get('httpMethod', 'POST')
    params = event.get('queryStringParameters') or {}
    body = json.loads(event.get('body') or '{}')
    action = params.get('action') or body.get('action', 'login')

    conn = get_db()
    cur = conn.cursor()

    if method == 'POST' and action == 'login':
        login = body.get('login', '').strip()
        password = body.get('password', '').strip()
        if not login or not password:
            conn.close()
            return {'statusCode': 400, 'headers': HEADERS, 'body': json.dumps({'error': 'Введите логин и пароль'})}
        cur.execute("SELECT id, login, role, full_name FROM users WHERE login=%s AND password_hash=%s", (login, password))
        user = cur.fetchone()
        conn.close()
        if not user:
            return {'statusCode': 401, 'headers': HEADERS, 'body': json.dumps({'error': 'Неверный логин или пароль'})}
        return {'statusCode': 200, 'headers': HEADERS, 'body': json.dumps({'id': user[0], 'login': user[1], 'role': user[2], 'full_name': user[3]})}

    if method == 'GET':
        role = params.get('role')
        class_id = params.get('class_id')
        if class_id:
            cur.execute("""
                SELECT u.id, u.login, u.full_name, u.role
                FROM users u JOIN class_students cs ON cs.student_id=u.id
                WHERE cs.class_id=%s ORDER BY u.full_name
            """, (class_id,))
        elif role:
            cur.execute("SELECT id, login, full_name, role FROM users WHERE role=%s AND login NOT LIKE '%%_del' ORDER BY full_name", (role,))
        else:
            cur.execute("SELECT id, login, full_name, role FROM users WHERE login NOT LIKE '%%_del' ORDER BY full_name")
        rows = cur.fetchall()
        conn.close()
        return {'statusCode': 200, 'headers': HEADERS, 'body': json.dumps([{'id': r[0], 'login': r[1], 'full_name': r[2], 'role': r[3]} for r in rows])}

    if method == 'POST' and action == 'create':
        login = body.get('login', '').strip()
        password = body.get('password', '').strip()
        full_name = body.get('full_name', '').strip()
        role = body.get('role', 'student')
        class_id = body.get('class_id')
        if not login or not password or not full_name:
            conn.close()
            return {'statusCode': 400, 'headers': HEADERS, 'body': json.dumps({'error': 'Заполните все поля'})}
        if not login.startswith('22'):
            conn.close()
            return {'statusCode': 400, 'headers': HEADERS, 'body': json.dumps({'error': 'Логин должен начинаться с 22'})}
        try:
            cur.execute("INSERT INTO users (login, password_hash, role, full_name) VALUES (%s,%s,%s,%s) RETURNING id", (login, password, role, full_name))
            user_id = cur.fetchone()[0]
        except Exception:
            conn.close()
            return {'statusCode': 400, 'headers': HEADERS, 'body': json.dumps({'error': 'Логин уже занят. Выберите другой логин.'})}
        if class_id and role == 'student':
            cur.execute("INSERT INTO class_students (class_id, student_id) VALUES (%s,%s) ON CONFLICT DO NOTHING", (class_id, user_id))
        conn.commit()
        conn.close()
        return {'statusCode': 200, 'headers': HEADERS, 'body': json.dumps({'id': user_id, 'login': login, 'full_name': full_name, 'role': role})}

    if method == 'PUT':
        user_id = body.get('id')
        full_name = body.get('full_name', '').strip()
        password = body.get('password', '').strip()
        class_id = body.get('class_id')
        if password:
            cur.execute("UPDATE users SET full_name=%s, password_hash=%s WHERE id=%s", (full_name, password, user_id))
        else:
            cur.execute("UPDATE users SET full_name=%s WHERE id=%s", (full_name, user_id))
        if class_id:
            cur.execute("INSERT INTO class_students (class_id, student_id) VALUES (%s,%s) ON CONFLICT DO NOTHING", (class_id, user_id))
        conn.commit()
        conn.close()
        return {'statusCode': 200, 'headers': HEADERS, 'body': json.dumps({'ok': True})}

    if method == 'DELETE':
        user_id = params.get('id') or body.get('id')
        class_id = params.get('class_id') or body.get('class_id')
        if class_id:
            cur.execute("UPDATE class_students SET class_id=NULL WHERE class_id=%s AND student_id=%s", (class_id, user_id))
        else:
            cur.execute("UPDATE class_students SET class_id=NULL WHERE student_id=%s", (user_id,))
            cur.execute("UPDATE grades SET student_id=NULL WHERE student_id=%s", (user_id,))
            cur.execute("UPDATE users SET login=CONCAT(login,'_del'), full_name=CONCAT(full_name,' (удалён)') WHERE id=%s", (user_id,))
        conn.commit()
        conn.close()
        return {'statusCode': 200, 'headers': HEADERS, 'body': json.dumps({'ok': True})}

    conn.close()
    return {'statusCode': 405, 'headers': HEADERS, 'body': json.dumps({'error': 'Method not allowed'})}