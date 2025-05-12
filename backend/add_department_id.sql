
PRAGMA foreign_keys=off;

BEGIN TRANSACTION;

-- Проверяем, существует ли уже колонка department_id
CREATE TABLE users_new (
    id INTEGER PRIMARY KEY,
    email VARCHAR NOT NULL,
    password VARCHAR NOT NULL,
    first_name VARCHAR,
    last_name VARCHAR, 
    middle_name VARCHAR,
    phone VARCHAR,
    role VARCHAR DEFAULT "employee",
    department VARCHAR,
    department_id INTEGER,
    telegram_id VARCHAR,
    disabled BOOLEAN DEFAULT FALSE,
    photo VARCHAR,
    FOREIGN KEY(department_id) REFERENCES departments(id)
);

-- Копируем данные из старой таблицы
INSERT INTO users_new 
SELECT 
    id, 
    email, 
    password, 
    first_name, 
    last_name, 
    middle_name, 
    phone, 
    role, 
    department, 
    NULL as department_id, 
    telegram_id, 
    disabled, 
    photo
FROM users;

-- Удаляем старую таблицу и переименовываем новую
DROP TABLE users;
ALTER TABLE users_new RENAME TO users;

-- Создаем необходимые индексы
CREATE UNIQUE INDEX ix_users_email ON users (email);
CREATE INDEX ix_users_id ON users (id);
CREATE INDEX ix_users_department ON users (department);
CREATE INDEX ix_users_department_id ON users (department_id);

COMMIT;

PRAGMA foreign_keys=on;

