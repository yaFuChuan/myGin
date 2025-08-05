package models

import (
	"database/sql"
	"time"
	"golang.org/x/crypto/bcrypt"
	"errors"
)

// 使用者結構定義，加入 role 欄位
type User struct {
	ID             int
	Name           string
	Email          string
	HashedPassword []byte
	Created        time.Time
	Role           string
}

type UserModel struct {
	DB *sql.DB
}


func (m *UserModel) AuthenticateWithRole(email, password string) (int, string, error) {
	var id int
	var hashedPassword []byte
	var role string

	stmt := `
		SELECT id, hashed_password, role
		FROM DB_LIAN..usersWeb
		WHERE email = ?
	`

	err := m.DB.QueryRow(stmt, email).Scan(&id, &hashedPassword, &role)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return 0, "", ErrInvalidCredentials
		}
		return 0, "", err
	}

	err = bcrypt.CompareHashAndPassword(hashedPassword, []byte(password))
	if err != nil {
		if errors.Is(err, bcrypt.ErrMismatchedHashAndPassword) {
			return 0, "", ErrInvalidCredentials
		}
		return 0, "", err
	}

	return id, role, nil
}

func (m *UserModel) Insert(name, email, password string) error {
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), 12)
	if err != nil {
		return err
	}

	stmt := `
		INSERT INTO DB_LIAN..usersWeb
		(name, email, hashed_password, created, role)
		VALUES (?, ?, ?, getdate(), ?)
	`
	_, err = m.DB.Exec(stmt, name, email, string(hashedPassword), "user")
	if err != nil {
		return ErrDuplicateEmail
	}

	return nil
}
