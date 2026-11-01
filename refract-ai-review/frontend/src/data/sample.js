export const SAMPLE_CODE = `import sqlite3


def get_user(db_path, user_id):
    connection = sqlite3.connect(db_path)
    query = f"SELECT id, email, role FROM users WHERE id = {user_id}"
    cursor = connection.execute(query)
    user = cursor.fetchone()
    connection.close()
    return user


def transfer_funds(account, amount):
    account.balance -= amount
    return account.balance
`;
